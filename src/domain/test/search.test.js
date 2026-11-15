import { matchesSearch, normalizeForSearch } from '../search/index.js';
import { filterMethods } from '../methodSelection/index.js';
import { ipcErrorCode } from '../ipcErrors/index.js';

test('normaliza caixa e acentos', () => {
  expect(normalizeForSearch('EDIÇÃO Ábrir')).toBe('edicao abrir');
  expect(matchesSearch('Selecionar Método', 'metodo')).toBe(true);
  expect(matchesSearch('Selecionar Método', 'unit')).toBe(false);
});

describe('filterMethods', () => {
  const methods = [
    { id: 'unit:uc|tcliente|salvar', label: 'TCliente.Salvar' },
    { id: 'unit:uc||formatarcpf', label: 'FormatarCpf' },
    { id: 'unit:uc|tcliente|carregar', label: 'TCliente.Carregar' },
    { id: 'unit:uc||validacao', label: 'Validação' },
  ];
  const labels = (list) => list.map((m) => m.label);

  test('texto vazio mantém todos, na ordem recebida', () => {
    expect(labels(filterMethods(methods, ''))).toEqual(['TCliente.Salvar', 'FormatarCpf', 'TCliente.Carregar', 'Validação']);
  });

  test('filtra por parte do rótulo preservando a ordem', () => {
    expect(labels(filterMethods(methods, 'cliente.'))).toEqual(['TCliente.Salvar', 'TCliente.Carregar']);
  });

  test('sem diferenciar maiúsculas nem acentos', () => {
    expect(labels(filterMethods(methods, 'FORMATAR'))).toEqual(['FormatarCpf']);
    expect(labels(filterMethods(methods, 'validacao'))).toEqual(['Validação']);
  });

  test('sem resultado', () => {
    expect(filterMethods(methods, 'xyz')).toEqual([]);
  });
});

describe('ipcErrorCode', () => {
  test.each([
    ['PROJECT_REPLACED', "Error invoking remote method 'methods:list': Error: [PROJECT_REPLACED] Outro Project foi carregado"],
    ['NO_PROJECT', '[NO_PROJECT] Nenhum Project carregado'],
    ['METHOD_NOT_FOUND', 'Error: [METHOD_NOT_FOUND] Method não encontrado: unit:x||y'],
  ])('extrai %s da mensagem', (code, message) => {
    expect(ipcErrorCode(new Error(message))).toBe(code);
  });

  test('erro sem código', () => {
    expect(ipcErrorCode(new Error('ENOENT: arquivo não encontrado'))).toBeNull();
    expect(ipcErrorCode(undefined)).toBeNull();
    expect(ipcErrorCode('texto')).toBeNull();
  });
});
