const mountDependenceGraphStructure = require('../model/mountDependenceGraphStructure');

test('mountGraphStructure', () => {

   const unitMain = 'Main';
   const arrayUses = ['Winapi.Windows', 'Winapi.Messages', 'System.SysUtils'];

   const  graphStructure = mountDependenceGraphStructure(unitMain, arrayUses);

   const result = {
      nodes: [
         { id: unitMain, label: unitMain, },
         { id: 'Winapi.Windows', label: 'Winapi.Windows' },
         { id: 'Winapi.Messages', label: 'Winapi.Messages' },
         { id: 'System.SysUtils', label: 'System.SysUtils' },
      ],

      edges: [
         { from: unitMain, to: 'Winapi.Windows' },
         { from: unitMain, to: 'Winapi.Messages' },
         { from: unitMain, to: 'System.SysUtils' }
      ],
   };

   expect(graphStructure).toEqual(result);
});