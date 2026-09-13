const fs = require('fs');
const path = require('path');
const { selectUsesFromSource, getUnitName, USES_CLAUSE_SCOPE } = require('../model/parsePascalSource');

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

test('interface scope excludes uses from the implementation section', () => {

   const source = getSourceFileStringWithBothSections();
   const matchUses = selectUsesFromSource(source, USES_CLAUSE_SCOPE.INTERFACE);

   expect(matchUses).toEqual(['Winapi.Windows', 'System.SysUtils']);
});

test('interfaceAndImplementation scope combines uses from both sections', () => {

   const source = getSourceFileStringWithBothSections();
   const matchUses = selectUsesFromSource(source, USES_CLAUSE_SCOPE.INTERFACE_AND_IMPLEMENTATION);

   expect(matchUses).toEqual(
      ['Winapi.Windows', 'System.SysUtils', 'System.StrUtils', 'System.DateUtils']
   );
});

test('interfaceAndImplementation scope does not duplicate a unit used in both sections', () => {

   const source = `
      unit untDuplicado;
      interface
      uses UnitA, UnitB;
      implementation
      uses UnitB, UnitC;
      end.
   `;
   const matchUses = selectUsesFromSource(source, USES_CLAUSE_SCOPE.INTERFACE_AND_IMPLEMENTATION);

   expect(matchUses).toEqual(['UnitA', 'UnitB', 'UnitC']);
});

test('interfaceAndImplementation scope falls back to interface list when implementation has no uses', () => {

   const source = getSourceFileString();
   const interfaceOnly = selectUsesFromSource(source, USES_CLAUSE_SCOPE.INTERFACE);
   const bothSections = selectUsesFromSource(source, USES_CLAUSE_SCOPE.INTERFACE_AND_IMPLEMENTATION);

   expect(bothSections).toEqual(interfaceOnly);
});

function getSourceFileString() {
   const filePath = path.join(__dirname, 'souceUsesInInterface.pas');
   const source = fs.readFileSync(filePath, 'utf-8')
   return source;
}

function getSourceFileStringWithBothSections() {
   const filePath = path.join(__dirname, 'sourceUsesInInterfaceAndImplementation.pas');
   const source = fs.readFileSync(filePath, 'utf-8')
   return source;
}