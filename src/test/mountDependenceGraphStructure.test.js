const mountDependenceGraphStructure = require('../model/mountDependenceGraphStructure');

test('mountGraphStructure', () => {

   const unitMain = 'Main';
   const arrayUses = ['Winapi.Windows', 'Winapi.Messages', 'System.SysUtils'];

   const  graphStructure = mountDependenceGraphStructure(unitMain, arrayUses);

   const result = {
      nodes: [
         { id: unitMain.toLowerCase(), label: unitMain, },
         { id: 'winapi.windows', label: 'Winapi.Windows' },
         { id: 'winapi.messages', label: 'Winapi.Messages' },
         { id: 'system.sysutils', label: 'System.SysUtils' },
      ],

      edges: [
         { from: unitMain.toLowerCase(), to: 'winapi.windows' },
         { from: unitMain.toLowerCase(), to: 'winapi.messages' },
         { from: unitMain.toLowerCase(), to: 'system.sysutils' }
      ],
   };

   expect(graphStructure).toEqual(result);
});

test('mountGraphStructure com projectUnits classifica os nós', () => {

   const unitMain = 'UnitPrincipal';
   const arrayUses = ['UnitA', 'Vcl.Forms'];
   const projectUnits = [{ unitName: 'UnitA', path: 'UnitA.pas' }];

   const graphStructure = mountDependenceGraphStructure(unitMain, arrayUses, projectUnits);

   const result = {
      nodes: [
         { id: unitMain.toLowerCase(), label: unitMain, group: 'projectUnit' },
         { id: 'unita', label: 'UnitA', group: 'projectUnit' },
         { id: 'vcl.forms', label: 'Vcl.Forms', group: 'externalUnit' },
      ],

      edges: [
         { from: unitMain.toLowerCase(), to: 'unita' },
         { from: unitMain.toLowerCase(), to: 'vcl.forms' },
      ],
   };

   expect(graphStructure).toEqual(result);
});