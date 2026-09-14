import { jest } from '@jest/globals';
import expandDependencyGraph from '../expandDependencyGraph/index.js';

function fakeReadFile(sources) {
   return path => sources[path];
}

test('expansão de duas camadas via Project Unit intermediária', () => {
   const projectUnits = [
      { unitName: 'UnitA', path: 'UnitA.pas' },
      { unitName: 'UnitB', path: 'UnitB.pas' },
      { unitName: 'UnitC', path: 'UnitC.pas' },
   ];
   const readFile = fakeReadFile({
      'UnitA.pas': 'unit UnitA; interface uses UnitB; implementation end.',
      'UnitB.pas': 'unit UnitB; interface uses UnitC; implementation end.',
      'UnitC.pas': 'unit UnitC; interface uses System.SysUtils; implementation end.',
   });

   const result = expandDependencyGraph('UnitA', projectUnits, readFile);

   expect(result).toEqual({
      nodes: [
         { id: 'unita', label: 'UnitA', group: 'projectUnit' },
         { id: 'unitb', label: 'UnitB', group: 'projectUnit' },
         { id: 'unitc', label: 'UnitC', group: 'projectUnit' },
         { id: 'system.sysutils', label: 'System.SysUtils', group: 'externalUnit' },
      ],
      edges: [
         { from: 'unita', to: 'unitb', origin: 'interface' },
         { from: 'unitb', to: 'unitc', origin: 'interface' },
         { from: 'unitc', to: 'system.sysutils', origin: 'interface' },
      ],
      rootUnitId: 'unita',
   });
});

test('External Unit encontrada durante a expansão não é lida do disco', () => {
   const projectUnits = [{ unitName: 'UnitA', path: 'UnitA.pas' }];
   const readFile = jest.fn(fakeReadFile({
      'UnitA.pas': 'unit UnitA; interface uses Vcl.Forms; implementation end.',
   }));

   const result = expandDependencyGraph('UnitA', projectUnits, readFile);

   expect(result).toEqual({
      nodes: [
         { id: 'unita', label: 'UnitA', group: 'projectUnit' },
         { id: 'vcl.forms', label: 'Vcl.Forms', group: 'externalUnit' },
      ],
      edges: [{ from: 'unita', to: 'vcl.forms', origin: 'interface' }],
      rootUnitId: 'unita',
   });
   expect(readFile).toHaveBeenCalledTimes(1);
   expect(readFile).toHaveBeenCalledWith('UnitA.pas');
});

test('dependência em diamante gera um único nó com dois edges', () => {
   const projectUnits = [
      { unitName: 'UnitA', path: 'UnitA.pas' },
      { unitName: 'UnitB', path: 'UnitB.pas' },
      { unitName: 'UnitC', path: 'UnitC.pas' },
      { unitName: 'UnitD', path: 'UnitD.pas' },
   ];
   const readFile = jest.fn(fakeReadFile({
      'UnitA.pas': 'unit UnitA; interface uses UnitB, UnitC; implementation end.',
      'UnitB.pas': 'unit UnitB; interface uses UnitD; implementation end.',
      'UnitC.pas': 'unit UnitC; interface uses UnitD; implementation end.',
      'UnitD.pas': 'unit UnitD; interface uses System.SysUtils; implementation end.',
   }));

   const result = expandDependencyGraph('UnitA', projectUnits, readFile);

   expect(result).toEqual({
      nodes: [
         { id: 'unita', label: 'UnitA', group: 'projectUnit' },
         { id: 'unitb', label: 'UnitB', group: 'projectUnit' },
         { id: 'unitc', label: 'UnitC', group: 'projectUnit' },
         { id: 'unitd', label: 'UnitD', group: 'projectUnit' },
         { id: 'system.sysutils', label: 'System.SysUtils', group: 'externalUnit' },
      ],
      edges: [
         { from: 'unita', to: 'unitb', origin: 'interface' },
         { from: 'unita', to: 'unitc', origin: 'interface' },
         { from: 'unitb', to: 'unitd', origin: 'interface' },
         { from: 'unitc', to: 'unitd', origin: 'interface' },
         { from: 'unitd', to: 'system.sysutils', origin: 'interface' },
      ],
      rootUnitId: 'unita',
   });
   expect(readFile).toHaveBeenCalledWith('UnitD.pas');
   expect(readFile.mock.calls.filter(call => call[0] === 'UnitD.pas')).toHaveLength(1);
});

test('ciclo direto entre duas Project Units não recursa infinitamente', () => {
   const projectUnits = [
      { unitName: 'UnitA', path: 'UnitA.pas' },
      { unitName: 'UnitB', path: 'UnitB.pas' },
   ];
   const readFile = fakeReadFile({
      'UnitA.pas': 'unit UnitA; interface uses UnitB; implementation end.',
      'UnitB.pas': 'unit UnitB; interface uses UnitA; implementation end.',
   });

   const result = expandDependencyGraph('UnitA', projectUnits, readFile);

   expect(result).toEqual({
      nodes: [
         { id: 'unita', label: 'UnitA', group: 'projectUnit' },
         { id: 'unitb', label: 'UnitB', group: 'projectUnit' },
      ],
      edges: [
         { from: 'unita', to: 'unitb', origin: 'interface' },
         { from: 'unitb', to: 'unita', origin: 'interface' },
      ],
      rootUnitId: 'unita',
   });
});

test('dependência só na seção implementation de uma unidade intermediária aparece no grafo, com origem implementation', () => {
   const projectUnits = [
      { unitName: 'UnitA', path: 'UnitA.pas' },
      { unitName: 'UnitB', path: 'UnitB.pas' },
      { unitName: 'UnitC', path: 'UnitC.pas' },
   ];
   const readFile = fakeReadFile({
      'UnitA.pas': 'unit UnitA; interface uses UnitB; implementation end.',
      'UnitB.pas': 'unit UnitB; interface implementation uses UnitC; end.',
      'UnitC.pas': 'unit UnitC; interface implementation end.',
   });

   const result = expandDependencyGraph('UnitA', projectUnits, readFile);

   expect(result.edges).toContainEqual({ from: 'unitb', to: 'unitc', origin: 'implementation' });
});

test('dependência da Root Unit declarada só na seção implementation aparece no grafo', () => {
   const projectUnits = [
      { unitName: 'UnitA', path: 'UnitA.pas' },
      { unitName: 'UnitB', path: 'UnitB.pas' },
   ];
   const readFile = fakeReadFile({
      'UnitA.pas': 'unit UnitA; interface implementation uses UnitB; end.',
      'UnitB.pas': 'unit UnitB; interface implementation end.',
   });

   const result = expandDependencyGraph('UnitA', projectUnits, readFile);

   expect(result.nodes).toContainEqual({ id: 'unitb', label: 'UnitB', group: 'projectUnit' });
   expect(result.edges).toContainEqual({ from: 'unita', to: 'unitb', origin: 'implementation' });
});

test('dependência declarada nas duas seções vira um único edge com origem both', () => {
   const projectUnits = [
      { unitName: 'UnitA', path: 'UnitA.pas' },
      { unitName: 'UnitB', path: 'UnitB.pas' },
   ];
   const readFile = fakeReadFile({
      'UnitA.pas': 'unit UnitA; interface uses UnitB; implementation uses UnitB; end.',
      'UnitB.pas': 'unit UnitB; interface implementation end.',
   });

   const result = expandDependencyGraph('UnitA', projectUnits, readFile);

   expect(result.edges).toEqual([{ from: 'unita', to: 'unitb', origin: 'both' }]);
});

test('dependência de uma Project Unit intermediária é External Unit', () => {
   const projectUnits = [
      { unitName: 'UnitA', path: 'UnitA.pas' },
      { unitName: 'UnitB', path: 'UnitB.pas' },
   ];
   const readFile = fakeReadFile({
      'UnitA.pas': 'unit UnitA; interface uses UnitB; implementation end.',
      'UnitB.pas': 'unit UnitB; interface uses Vcl.Forms; implementation end.',
   });

   const result = expandDependencyGraph('UnitA', projectUnits, readFile);

   expect(result.nodes).toContainEqual(
      { id: 'vcl.forms', label: 'Vcl.Forms', group: 'externalUnit' }
   );
});
