import { vi } from 'vitest';
import { createCallIndexCache } from '../services/callIndexCache.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// `build` controlável: cada chamada fica pendente até o teste resolvê-la.
function setup() {
  const builds = [];
  const build = vi.fn((args) => {
    const d = deferred();
    builds.push({ args, ...d });
    return d.promise;
  });
  const readFile = vi.fn(async () => 'fonte');
  return { cache: createCallIndexCache({ build, readFile }), build, builds, readFile };
}

const PROJECT_A = { dprPath: '/proj/A.dpr', projectDir: '/proj', projectUnits: [{ unitName: 'UnitA', path: 'UnitA.pas' }] };
const PROJECT_B = { dprPath: '/outro/B.dpr', projectDir: '/outro', projectUnits: [] };

describe('Índice montado sob demanda e reaproveitado', () => {
  test('nada é montado antes do primeiro pedido', () => {
    const { cache, build } = setup();
    cache.setProject(PROJECT_A);
    expect(build).not.toHaveBeenCalled();
  });

  test('segundo pedido não reanalisa', async () => {
    const { cache, build, builds } = setup();
    cache.setProject(PROJECT_A);
    const first = cache.getIndex();
    builds[0].resolve({ id: 'indiceA' });
    await expect(first).resolves.toEqual({ id: 'indiceA' });
    await expect(cache.getIndex()).resolves.toEqual({ id: 'indiceA' });
    expect(build).toHaveBeenCalledTimes(1);
  });

  test('pedidos concorrentes recebem a mesma montagem', async () => {
    const { cache, build, builds } = setup();
    cache.setProject(PROJECT_A);
    const first = cache.getIndex();
    const second = cache.getIndex();
    expect(build).toHaveBeenCalledTimes(1);
    builds[0].resolve({ id: 'indiceA' });
    await expect(Promise.all([first, second])).resolves.toEqual([{ id: 'indiceA' }, { id: 'indiceA' }]);
  });

  test('arquivo alterado em disco não é percebido: o índice continua o mesmo', async () => {
    const { cache, build, builds } = setup();
    cache.setProject(PROJECT_A);
    const first = cache.getIndex();
    builds[0].resolve({ id: 'indiceA' });
    await first;
    // (nenhuma API de observação: só um novo setProject remonta)
    await cache.getIndex();
    expect(build).toHaveBeenCalledTimes(1);
  });

  test('readFile resolve os caminhos relativos à pasta do Project', async () => {
    const { cache, builds, readFile } = setup();
    cache.setProject(PROJECT_A);
    cache.getIndex();
    expect(builds[0].args).toMatchObject({ dprPath: '/proj/A.dpr', projectUnits: PROJECT_A.projectUnits });
    await builds[0].args.readFile('UnitA.pas');
    await builds[0].args.readFile('/proj/A.dpr');
    expect(readFile.mock.calls).toEqual([['/proj/UnitA.pas', 'utf-8'], ['/proj/A.dpr', 'utf-8']]);
  });

  test('sem Project carregado, falha com NO_PROJECT', async () => {
    const { cache } = setup();
    await expect(cache.getIndex()).rejects.toMatchObject({ code: 'NO_PROJECT', message: expect.stringMatching(/^\[NO_PROJECT\]/) });
  });

  test('falha na montagem não fica em cache', async () => {
    const { cache, build, builds } = setup();
    cache.setProject(PROJECT_A);
    const first = cache.getIndex();
    builds[0].reject(new Error('disco'));
    await expect(first).rejects.toThrow('disco');
    cache.getIndex();
    expect(build).toHaveBeenCalledTimes(2);
  });
});

describe('Índice descartado ao carregar outro Project', () => {
  test('troca de Project durante a análise rejeita o pedido pendente como PROJECT_REPLACED', async () => {
    const { cache, build, builds } = setup();
    cache.setProject(PROJECT_A);
    const pendingA = cache.getIndex();
    cache.setProject(PROJECT_B);
    // A montagem de A segue até o fim, mas o resultado é descartado.
    builds[0].resolve({ id: 'indiceA' });
    await expect(pendingA).rejects.toMatchObject({ code: 'PROJECT_REPLACED', message: expect.stringMatching(/^\[PROJECT_REPLACED\]/) });

    const nextB = cache.getIndex();
    expect(build).toHaveBeenCalledTimes(2);
    expect(builds[1].args.dprPath).toBe('/outro/B.dpr');
    builds[1].resolve({ id: 'indiceB' });
    await expect(nextB).resolves.toEqual({ id: 'indiceB' });
  });

  test('erro da montagem antiga também chega como PROJECT_REPLACED', async () => {
    const { cache, builds } = setup();
    cache.setProject(PROJECT_A);
    const pendingA = cache.getIndex();
    cache.setProject(PROJECT_B);
    builds[0].reject(new Error('disco'));
    await expect(pendingA).rejects.toMatchObject({ code: 'PROJECT_REPLACED' });
  });

  test('reabrir o mesmo Project monta o índice outra vez', async () => {
    const { cache, build, builds } = setup();
    cache.setProject(PROJECT_A);
    const first = cache.getIndex();
    builds[0].resolve({ id: 'v1' });
    await first;
    cache.setProject(PROJECT_A);
    const second = cache.getIndex();
    builds[1].resolve({ id: 'v2' });
    await expect(second).resolves.toEqual({ id: 'v2' });
    expect(build).toHaveBeenCalledTimes(2);
  });
});
