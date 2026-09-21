import {
  addRecentProject,
  removeRecentProject,
  describeRecentProject,
  filterRecentProjects,
} from '../recentProjects/index.js';

test('adiciona um Project novo no topo da lista', () => {
  expect(addRecentProject(['/proj/B.dpr'], '/proj/A.dpr')).toEqual(['/proj/A.dpr', '/proj/B.dpr']);
});

test('reabrir um Project existente o move para o topo sem duplicar', () => {
  expect(addRecentProject(['B', 'A'], 'A')).toEqual(['A', 'B']);
});

test('descarta a entrada mais antiga ao passar de 10 itens', () => {
  const list = Array.from({ length: 10 }, (_, i) => `P${i}`);

  const result = addRecentProject(list, 'novo');

  expect(result).toHaveLength(10);
  expect(result[0]).toBe('novo');
  expect(result).not.toContain('P9');
});

test('respeita um limite customizado', () => {
  expect(addRecentProject(['B', 'A'], 'C', 2)).toEqual(['C', 'B']);
});

test('remove uma entrada da lista', () => {
  expect(removeRecentProject(['A', 'B', 'C'], 'B')).toEqual(['A', 'C']);
});

test('divide o caminho em nome do arquivo e pasta (separador /)', () => {
  expect(describeRecentProject('/proj/sub/Vendas.dpr')).toEqual({
    fileName: 'Vendas.dpr',
    dir: '/proj/sub',
  });
});

test('divide o caminho em nome do arquivo e pasta (separador \\)', () => {
  expect(describeRecentProject('C:\\proj\\Vendas.dpr')).toEqual({
    fileName: 'Vendas.dpr',
    dir: 'C:\\proj',
  });
});

test('filtra por nome do arquivo sem diferenciar maiúsculas de minúsculas', () => {
  const paths = ['/x/Vendas.dpr', '/x/Estoque.dpr'];

  expect(filterRecentProjects(paths, 'vend')).toEqual(['/x/Vendas.dpr']);
});

test('filtra pelo caminho completo', () => {
  const paths = ['/cliente1/App.dpr', '/cliente2/App.dpr'];

  expect(filterRecentProjects(paths, 'cliente2')).toEqual(['/cliente2/App.dpr']);
});

test('filtro vazio devolve todos e filtro sem resultado devolve lista vazia', () => {
  const paths = ['/x/A.dpr', '/x/B.dpr'];

  expect(filterRecentProjects(paths, '')).toEqual(paths);
  expect(filterRecentProjects(paths, 'zzz')).toEqual([]);
});
