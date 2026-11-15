import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import parseDprSource from '../../parseDprSource/index.js';
import { buildCallIndex } from '../../callIndex/buildCallIndex.js';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

// Monta o índice de uma fixture como o main process faz: Project Units vindas
// do parser regex do .dpr e `readFile` relativo à pasta do .dpr.
export async function indexFixture(dir, dprFile) {
  const base = path.join(fixtures, dir);
  const projectUnits = parseDprSource(await readFile(path.join(base, dprFile), 'utf-8'));
  const read = [];
  const index = await buildCallIndex({
    dprPath: dprFile,
    projectUnits,
    readFile: (file) => {
      read.push(file);
      return readFile(path.join(base, file), 'utf-8');
    },
  });
  return { index, read, projectUnits };
}
