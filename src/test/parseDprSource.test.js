const fs = require('fs');
const path = require('path');
const parseDprSource = require('../model/parseDprSource');

test('extrai todas as Project Units de um .dpr', () => {

   const source = getSourceFileString();
   const projectUnits = parseDprSource(source);

   expect(projectUnits).toEqual([
      { unitName: 'UnitA', path: 'UnitA.pas' },
      { unitName: 'UnitPrincipal', path: 'UnitPrincipal.pas' },
   ]);
});

test('preserva a grafia original do nome da unit', () => {

   const source = getSourceFileString();
   const projectUnits = parseDprSource(source);

   expect(projectUnits[0].unitName).toBe('UnitA');
});

test('ignora entradas sem "in \'path\'"', () => {

   const source = getSourceFileString();
   const projectUnits = parseDprSource(source);

   const unitNames = projectUnits.map(unit => unit.unitName);
   expect(unitNames).not.toContain('Vcl.Forms');
});

test('reconhece entrada de unit de formulário com comentário {FormX}', () => {

   const source = getSourceFileString();
   const projectUnits = parseDprSource(source);

   expect(projectUnits).toContainEqual(
      { unitName: 'UnitPrincipal', path: 'UnitPrincipal.pas' }
   );
});

function getSourceFileString() {
   const filePath = path.join(__dirname, 'sourceDprWithProjectUnits.dpr');
   const source = fs.readFileSync(filePath, 'utf-8');
   return source;
}
