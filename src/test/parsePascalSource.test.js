const fs = require('fs');
const path = require('path');
const { selectUsesFromSource, getUnitName } = require('../model/parsePascalSource');

test('get list of uses in interface', () => {

   const source = getSourceFileString();
   const matchUses = selectUsesFromSource(source);

   expect(matchUses).toEqual(
      ['Winapi.Windows', 'Winapi.Messages', 'System.SysUtils',
         'System.Variants', 'System.Classes', 'Vcl.Graphics',
         'Vcl.Controls', 'Vcl.Forms', 'Vcl.Dialogs', 'Vcl.StdCtrls'
      ]
   );
});

test('get the unit name', () => {

   const source = getSourceFileString();
   const unitName = getUnitName(source);

   expect(unitName).toBe('untExercicio04');
});

function getSourceFileString() {
   const filePath = path.join(__dirname, 'souceUsesInInterface.pas');
   const source = fs.readFileSync(filePath, 'utf-8')
   return source; 
}