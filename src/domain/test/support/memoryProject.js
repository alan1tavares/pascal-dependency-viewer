import { buildCallIndex } from '../../callIndex/buildCallIndex.js';

// Monta o índice de um Project em memória. `units`: { NomeDaUnit: fonte };
// `files`: outros arquivos (formulários), por caminho; `main`: corpo do .dpr.
export async function indexProject(units, { main = 'begin\nend.', files = {}, name = 'Teste' } = {}) {
  const names = Object.keys(units);
  const dpr = `program ${name};\n\nuses\n${names.map((n) => `  ${n} in '${n}.pas'`).join(',\n')};\n\n${main}`;
  const contents = { [`${name}.dpr`]: dpr, ...files };
  for (const n of names) contents[`${n}.pas`] = units[n];
  const read = [];
  const readFile = async (path) => {
    read.push(path);
    if (!(path in contents)) throw Object.assign(new Error(`ENOENT: ${path}`), { code: 'ENOENT' });
    return contents[path];
  };
  const projectUnits = names.map((n) => ({ unitName: n, path: `${n}.pas` }));
  const index = await buildCallIndex({ dprPath: `${name}.dpr`, projectUnits, readFile });
  return { index, read };
}

const idByLabel = (index, label) => {
  const matches = [...index.nodes.values()].filter((node) => node.label === label);
  if (matches.length !== 1) throw new Error(`Nó '${label}' encontrado ${matches.length} vezes`);
  return matches[0].id;
};

// Callers de um Method, por rótulo: ['TTela.Gravar', 'X (via TBase.Salvar)'].
export function callersOf(index, label) {
  const refs = index.callers.get(idByLabel(index, label)) || [];
  return refs.map((ref) => {
    const caller = index.nodes.get(ref.callerId).label;
    return ref.kind === 'polymorphic' ? `${caller} (via ${ref.viaLabel})` : caller;
  });
}

export function isEntryPoint(index, label) {
  return index.entryPoints.has(idByLabel(index, label));
}
