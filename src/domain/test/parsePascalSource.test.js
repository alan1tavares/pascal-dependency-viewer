import { readFileSync } from 'fs';
import { join } from 'path';
import { selectUsesFromSource, getUnitName, USES_CLAUSE_ORIGIN } from '../parsePascalSource/index.js';

test('get list of uses in interface', () => {

   const source = getSourceFileString();
   const matchUses = selectUsesFromSource(source);

   expect(matchUses).toEqual(
      ['Winapi.Windows', 'Winapi.Messages', 'System.SysUtils',
         'System.Variants', 'System.Classes', 'Vcl.Graphics',
         'Vcl.Controls', 'Vcl.Forms', 'Vcl.Dialogs', 'Vcl.StdCtrls'
      ].map(unitName => ({ unitName, origin: USES_CLAUSE_ORIGIN.INTERFACE }))
   );
});

test('get the unit name', () => {

   const source = getSourceFileString();
   const unitName = getUnitName(source);

   expect(unitName).toBe('untExercicio04');
});

test('units declared only in the interface section get origin interface', () => {

   const source = getSourceFileStringWithBothSections();
   const matchUses = selectUsesFromSource(source);

   expect(matchUses).toContainEqual({ unitName: 'System.SysUtils', origin: USES_CLAUSE_ORIGIN.INTERFACE });
});

test('extraction always covers both sections, tagging origin per unit', () => {

   const source = getSourceFileStringWithBothSections();
   const matchUses = selectUsesFromSource(source);

   expect(matchUses).toEqual([
      { unitName: 'Winapi.Windows', origin: USES_CLAUSE_ORIGIN.INTERFACE },
      { unitName: 'System.SysUtils', origin: USES_CLAUSE_ORIGIN.INTERFACE },
      { unitName: 'System.StrUtils', origin: USES_CLAUSE_ORIGIN.IMPLEMENTATION },
      { unitName: 'System.DateUtils', origin: USES_CLAUSE_ORIGIN.IMPLEMENTATION },
   ]);
});

test('unit declared in both sections (case-insensitive) collapses into a single entry with origin both', () => {

   const source = `
      unit untDuplicado;
      interface
      uses UnitA, UnitB;
      implementation
      uses unitb, UnitC;
      end.
   `;
   const matchUses = selectUsesFromSource(source);

   expect(matchUses).toEqual([
      { unitName: 'UnitA', origin: USES_CLAUSE_ORIGIN.INTERFACE },
      { unitName: 'UnitB', origin: USES_CLAUSE_ORIGIN.BOTH },
      { unitName: 'UnitC', origin: USES_CLAUSE_ORIGIN.IMPLEMENTATION },
   ]);
});

test('unit repeated within the same section only appears once', () => {

   const source = `
      unit untRepetido;
      interface
      uses UnitA, UnitA;
      implementation
      end.
   `;
   const matchUses = selectUsesFromSource(source);

   expect(matchUses).toEqual([
      { unitName: 'UnitA', origin: USES_CLAUSE_ORIGIN.INTERFACE },
   ]);
});

test('implementation section without a uses clause does not throw and yields only interface origins', () => {

   const source = getSourceFileString();
   const matchUses = selectUsesFromSource(source);

   expect(matchUses.every(entry => entry.origin === USES_CLAUSE_ORIGIN.INTERFACE)).toBe(true);
});

function getSourceFileString() {
   const filePath = join(import.meta.dirname, 'souceUsesInInterface.pas');
   const source = readFileSync(filePath, 'utf-8')
   return source;
}

function getSourceFileStringWithBothSections() {
   const filePath = join(import.meta.dirname, 'sourceUsesInInterfaceAndImplementation.pas');
   const source = readFileSync(filePath, 'utf-8')
   return source;
}
