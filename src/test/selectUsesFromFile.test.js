const fs = require('fs');
const path = require('path');
const selectUses = require('../model/selectUses');

test('selectUses', () => {

   const filePath = path.join(__dirname, 'untExercicio04.pas');
   const source = fs.readFileSync(filePath, 'utf-8')
   const matchUses = selectUses(source);

   expect(matchUses).toBe(
      'Winapi.Windows,Winapi.Messages,System.SysUtils,' + 
      'System.Variants,System.Classes,Vcl.Graphics,Vcl.Controls,Vcl.Forms,' + 
      'Vcl.Dialogs,Vcl.StdCtrls'
   );      
   
});