// Leitura de formulários `.dfm`/`.fmx` em formato texto (design D9). Devolve
// o objeto raiz e os candidatos a handler: toda propriedade atribuída a um
// identificador (`OnClick = Button1Click`, `BeforePost = qrDadosBeforePost`),
// inclusive em componentes aninhados, objetos `inherited`/`inline` e itens de
// coleções. Quem usa decide quais são Methods do formulário (`FocusControl =
// edNome` aponta um componente, `FieldKind = fkLookup` um valor de enum).
// Formulário binário não tem handlers legíveis: `binary: true`.

const OBJECT_LINE = /^\s*(object|inherited|inline)\s+(?:([A-Za-z_][\w]*)\s*:\s*)?([A-Za-z_][\w.]*)\s*(?:\[\s*\d+\s*\])?\s*$/i;
const END_LINE = /^\s*end\s*$/i;
const ITEM_LINE = /^\s*item\s*$/i;
const EVENT_LINE = /^\s*([A-Za-z_][\w]*)\s*=\s*([A-Za-z_][\w]*)\s*$/;
const LITERALS = new Set(['true', 'false']);

export function isBinaryForm(text) {
  if (text.startsWith('TPF0')) return true;
  const first = text.charCodeAt(0);
  if (first === 0xff || first === 0xfffd) return true;
  return text.slice(0, 64).includes('\0');
}

export function parseForm(text) {
  if (isBinaryForm(text)) return { binary: true, rootName: null, rootClass: null, handlers: [] };
  let rootName = null;
  let rootClass = null;
  let depth = 0;
  const handlers = [];
  const components = [];
  for (const line of text.split(/\r?\n/)) {
    const object = OBJECT_LINE.exec(line);
    if (object) {
      if (depth === 0 && !rootClass) {
        rootName = object[2] || null;
        rootClass = object[3];
      }
      components.push(object[2] || object[3]);
      depth++;
      continue;
    }
    if (ITEM_LINE.test(line)) {
      components.push(components[components.length - 1] || null);
      depth++;
      continue;
    }
    if (END_LINE.test(line)) {
      components.pop();
      depth = Math.max(0, depth - 1);
      continue;
    }
    const event = EVENT_LINE.exec(line);
    if (event && depth > 0 && !LITERALS.has(event[2].toLowerCase())) {
      handlers.push({ component: components[components.length - 1], event: event[1], handler: event[2] });
    }
  }
  return { binary: false, rootName, rootClass, handlers };
}

// Caminho do formulário de uma Unit a partir das diretivas `{$R}` dela:
// `{$R *.dfm}` usa o nome base da própria `.pas`; `{$R Outro.dfm}` aponta o
// arquivo, relativo à pasta da Unit. `.res` e afins são ignorados.
export function formPaths(unitPath, resources) {
  const dir = unitPath.includes('/') || unitPath.includes('\\') ? unitPath.replace(/[^/\\]*$/, '') : '';
  const base = unitPath.replace(/\.[^./\\]*$/, '');
  const paths = [];
  for (const resource of resources) {
    const arg = resource.replace(/^'|'$/g, '').trim();
    const match = /^(.*)\.(dfm|fmx)$/i.exec(arg);
    if (!match) continue;
    paths.push(match[1] === '*' ? `${base}.${match[2]}` : `${dir}${arg}`);
  }
  return paths;
}
