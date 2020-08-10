const fs = require('fs');
const path = require('path');
const selectUsesFromSource = require('../model/selectUsesFromSource');

test('get list of uses in interface', () => {

   const filePath = path.join(__dirname, 'souceUsesInInterface.pas');
   const source = fs.readFileSync(filePath, 'utf-8')
   const matchUses = selectUsesFromSource(source);

   expect(matchUses).toEqual(
      ['Winapi.Windows', 'Winapi.Messages', 'System.SysUtils',
         'System.Variants', 'System.Classes', 'Vcl.Graphics',
         'Vcl.Controls', 'Vcl.Forms', 'Vcl.Dialogs', 'Vcl.StdCtrls'
      ]
   );
});