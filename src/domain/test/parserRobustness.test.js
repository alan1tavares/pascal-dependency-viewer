import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSource, ParseError } from '../pascalParser/parser.js';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

function parseAll(dir) {
  const base = path.join(fixtures, dir);
  return readdirSync(base)
    .filter((file) => /\.(pas|dpr)$/i.test(file))
    .map((file) => {
      try {
        parseSource(readFileSync(path.join(base, file), 'utf-8'));
        return { file, error: null };
      } catch (error) {
        return { file, error };
      }
    });
}

test('fixture callGraph: só a Unit inválida proposital falha', () => {
  const results = parseAll('callGraph');
  expect(results.length).toBeGreaterThanOrEqual(8);
  const failures = results.filter((r) => r.error);
  expect(failures.map((r) => r.file)).toEqual(['UQuebrada.pas']);
  expect(failures[0].error).toBeInstanceOf(ParseError);
  expect(failures[0].error.line).toBe(9);
});

test('fixture cineTapioca: o .dpr e as 14 Units são analisados sem falha', () => {
  const results = parseAll('cineTapioca');
  expect(results).toHaveLength(15);
  expect(results.filter((r) => r.error).map((r) => `${r.file}: ${r.error.message}`)).toEqual([]);
});
