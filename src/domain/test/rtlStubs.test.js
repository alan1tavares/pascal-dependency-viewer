import { RTL_STUBS } from '../callIndex/rtlStubs.js';
import { parseSource } from '../pascalParser/parser.js';

test.each(RTL_STUBS.map((stub) => [stub.unitName, stub]))('stub %s passa pelo parser sem erro', (unitName, stub) => {
  const ast = parseSource(stub.source);
  expect(ast.name).toBe(unitName);
  expect(ast.impl.decls).toEqual([]);
});

test('stubs declaram os containers exigidos pelo spec', () => {
  const declared = new Set(
    RTL_STUBS.flatMap((stub) => parseSource(stub.source).intf.decls.map((decl) => decl.name)),
  );
  for (const name of ['TList', 'TObjectList', 'TDictionary', 'TObjectDictionary', 'TQueue', 'TStack', 'TEnumerable', 'TStringList', 'TStrings']) {
    expect(declared).toContain(name);
  }
});
