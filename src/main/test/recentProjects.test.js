import { jest } from '@jest/globals';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let userDataDir;

jest.unstable_mockModule('electron', () => ({
  app: { getPath: jest.fn(() => userDataDir) },
}));

const recentProjects = await import('../services/recentProjects.js');

beforeEach(() => {
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'recent-projects-'));
});

afterEach(() => {
  fs.rmSync(userDataDir, { recursive: true, force: true });
});

test('a lista começa vazia quando não há arquivo persistido', () => {
  expect(recentProjects.list()).toEqual([]);
});

test('add registra o Project no topo e persiste entre leituras', () => {
  recentProjects.add('/proj/A.dpr');
  recentProjects.add('/proj/B.dpr');

  expect(recentProjects.list()).toEqual(['/proj/B.dpr', '/proj/A.dpr']);
  const onDisk = JSON.parse(fs.readFileSync(path.join(userDataDir, 'recent-projects.json'), 'utf-8'));
  expect(onDisk).toEqual(['/proj/B.dpr', '/proj/A.dpr']);
});

test('add de um Project já presente o move para o topo sem duplicar', () => {
  recentProjects.add('/proj/A.dpr');
  recentProjects.add('/proj/B.dpr');
  recentProjects.add('/proj/A.dpr');

  expect(recentProjects.list()).toEqual(['/proj/A.dpr', '/proj/B.dpr']);
});

test('mantém no máximo 10 entradas', () => {
  for (let i = 0; i < 12; i++) recentProjects.add(`/proj/P${i}.dpr`);

  const list = recentProjects.list();
  expect(list).toHaveLength(10);
  expect(list[0]).toBe('/proj/P11.dpr');
});

test('remove tira a entrada da lista persistida', () => {
  recentProjects.add('/proj/A.dpr');
  recentProjects.add('/proj/B.dpr');

  recentProjects.remove('/proj/A.dpr');

  expect(recentProjects.list()).toEqual(['/proj/B.dpr']);
});

test('JSON inválido é tratado como lista vazia', () => {
  fs.writeFileSync(path.join(userDataDir, 'recent-projects.json'), '{não é json');

  expect(recentProjects.list()).toEqual([]);
});

test('formato inesperado é tratado como lista vazia', () => {
  fs.writeFileSync(path.join(userDataDir, 'recent-projects.json'), JSON.stringify({ a: 1 }));

  expect(recentProjects.list()).toEqual([]);
});

test('falha ao escrever não lança erro', () => {
  const blocker = path.join(userDataDir, 'arquivo-no-lugar-da-pasta');
  fs.writeFileSync(blocker, 'x');
  const originalDir = userDataDir;
  userDataDir = path.join(blocker, 'userData');

  expect(() => recentProjects.add('/proj/A.dpr')).not.toThrow();
  userDataDir = originalDir;
});
