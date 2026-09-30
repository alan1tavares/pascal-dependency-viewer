import { filterProjectUnits } from '../rootUnitSelection/index.js';

test('filtra por nome da unit sem diferenciar maiúsculas de minúsculas', () => {
  const projectUnits = [
    { unitName: 'Vendas', path: 'modulos/vendas/Vendas.pas' },
    { unitName: 'Estoque', path: 'modulos/estoque/Estoque.pas' },
  ];

  expect(filterProjectUnits(projectUnits, 'vend')).toEqual([
    { unitName: 'Vendas', path: 'modulos/vendas/Vendas.pas' },
  ]);
});

test('filtra pelo caminho do arquivo mesmo quando o nome não contém o texto', () => {
  const projectUnits = [
    { unitName: 'Vendas', path: 'modulos/vendas/Vendas.pas' },
    { unitName: 'Relatorios', path: 'modulos/estoque/Relatorios.pas' },
  ];

  expect(filterProjectUnits(projectUnits, 'estoque')).toEqual([
    { unitName: 'Relatorios', path: 'modulos/estoque/Relatorios.pas' },
  ]);
});

test('texto vazio retorna todas as units', () => {
  const projectUnits = [
    { unitName: 'Vendas', path: 'modulos/vendas/Vendas.pas' },
    { unitName: 'Estoque', path: 'modulos/estoque/Estoque.pas' },
  ];

  expect(filterProjectUnits(projectUnits, '')).toEqual(projectUnits);
});

test('filtro sem resultado devolve lista vazia', () => {
  const projectUnits = [{ unitName: 'Vendas', path: 'modulos/vendas/Vendas.pas' }];

  expect(filterProjectUnits(projectUnits, 'zzz')).toEqual([]);
});
