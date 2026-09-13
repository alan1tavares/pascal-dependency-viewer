import classifyExternalUnits from '../model/classifyExternalUnits/index.js';

test('dependência corresponde a uma Project Unit', () => {
   const dependencyNames = ['UnitB'];
   const projectUnits = [{ unitName: 'UnitB', path: 'UnitB.pas' }];

   const result = classifyExternalUnits(dependencyNames, projectUnits);

   expect(result).toEqual([{ unitName: 'UnitB', isExternal: false }]);
});

test('dependência não corresponde a nenhuma Project Unit', () => {
   const dependencyNames = ['Vcl.Forms'];
   const projectUnits = [{ unitName: 'UnitB', path: 'UnitB.pas' }];

   const result = classifyExternalUnits(dependencyNames, projectUnits);

   expect(result).toEqual([{ unitName: 'Vcl.Forms', isExternal: true }]);
});

test('comparação de nomes é case-insensitive', () => {
   const dependencyNames = ['unitb'];
   const projectUnits = [{ unitName: 'UnitB', path: 'UnitB.pas' }];

   const result = classifyExternalUnits(dependencyNames, projectUnits);

   expect(result).toEqual([{ unitName: 'unitb', isExternal: false }]);
});
