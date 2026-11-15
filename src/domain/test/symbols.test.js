import { parseSource } from '../pascalParser/parser.js';
import { buildSymbolTable } from '../callIndex/symbols.js';
import { RTL_STUBS } from '../callIndex/rtlStubs.js';

const UNIT_A = `unit UnitA;
interface
type
  TBase = class
    procedure Salvar; virtual;
    property Nome: string read FNome;
  end;
  TDerived = class(TBase)
    procedure Extra;
  end;
procedure Formatar;
implementation
procedure Interna; begin end;
procedure Formatar; begin end;
procedure TBase.Salvar; begin end;
procedure TDerived.Extra; begin end;
end.`;

const UNIT_B = `unit UnitB;
interface
uses UnitA, System.Generics.Collections;
type
  TLista = TObjectList<TDerived>;
implementation
end.`;

function table() {
  return buildSymbolTable([
    ...RTL_STUBS.map((stub) => ({ ast: parseSource(stub.source), isStub: true })),
    { ast: parseSource(UNIT_A) },
    { ast: parseSource(UNIT_B) },
  ]);
}

test('membros herdados são encontrados a partir da classe derivada', () => {
  const t = table();
  const unitB = t.unitByName('UnitB');
  const derived = t.resolveType({ k: 'named', name: ['TDerived'], args: [] }, { unit: unitB });
  const found = t.findMember(derived, 'salvar');
  expect(found.member.id).toBe('unit:unita|tbase|salvar');
  expect(found.owner.ent.name).toBe('TBase');
  expect(t.hasBody(found.member)).toBe(true);
  expect(t.findMember(derived, 'Nome').member.kind).toBe('property');
  expect(t.findMember(derived, 'ClassName').owner.ent.name).toBe('TObject');
});

test('routines soltas: só as da interface são visíveis via uses', () => {
  const t = table();
  const unitB = t.unitByName('UnitB');
  expect(t.lookupGlobal('Formatar', unitB)[0]).toMatchObject({ kind: 'routine', id: 'unit:unita||formatar', hasBody: true });
  expect(t.lookupGlobal('Interna', unitB)).toBeNull();
  expect(t.lookupGlobal('Interna', t.unitByName('UnitA'))[0].kind).toBe('routine');
});

test('alias genérico de container da RTL resolve o elemento e o indexador', () => {
  const t = table();
  const unitB = t.unitByName('UnitB');
  const lista = t.resolveType({ k: 'named', name: ['TLista'], args: [] }, { unit: unitB });
  expect(lista.ent.name).toBe('TObjectList');
  const items = t.findMember(lista, 'Items');
  expect(t.memberType(items.member, items.owner, items.member.prop.type).ent.name).toBe('TDerived');
  expect(t.enumeratedType(lista).ent.name).toBe('TDerived');
});

test('descendentes e unidades qualificadas', () => {
  const t = table();
  const base = t.entityForClassName(t.unitByName('UnitA'), 'TBase');
  expect(t.descendants(base).map((e) => e.name)).toEqual(['TDerived']);
  const qualified = t.resolveType({ k: 'named', name: ['UnitA', 'TBase'], args: [] }, { unit: t.unitByName('UnitB') });
  expect(qualified.ent).toBe(base);
  expect(t.unitByName('Generics.Collections').name).toBe('System.Generics.Collections');
  expect(t.unitByName('Classes').name).toBe('System.Classes');
});
