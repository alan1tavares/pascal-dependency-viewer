import { vi } from 'vitest';

const showOpenDialog = vi.fn();
const showMessageBox = vi.fn();
const readFile = vi.fn();
const parseDprSource = vi.fn();
const recentProjects = {
  add: vi.fn(),
  remove: vi.fn(),
  list: vi.fn(),
};

const callIndexCache = { setProject: vi.fn() };

vi.doMock('../services/callIndexCache.js', () => ({ callIndexCache }));
vi.doMock('electron', () => ({
  dialog: { showOpenDialog, showMessageBox },
}));
vi.doMock('../services/fileSystem.js', () => ({ readFile }));
vi.doMock('../services/recentProjects.js', () => recentProjects);
vi.doMock('../../domain/parseDprSource/index.js', () => ({
  default: parseDprSource,
}));

const { performOpenProject, loadProject, registerProjectHandler } = await import('../ipc/project.js');

function registerHandlers() {
  const handlers = {};
  registerProjectHandler({ handle: (channel, fn) => { handlers[channel] = fn; } });
  return handlers;
}

beforeEach(() => {
  readFile.mockReturnValue('source');
  parseDprSource.mockReturnValue([{ unitName: 'UnitA', path: 'UnitA.pas' }]);
  showMessageBox.mockResolvedValue({});
});

test('loadProject lê, parseia, registra o recente e devolve o Project', () => {
  const project = loadProject('/proj/App.dpr');

  expect(readFile).toHaveBeenCalledWith('/proj/App.dpr');
  expect(recentProjects.add).toHaveBeenCalledWith('/proj/App.dpr');
  expect(project).toEqual({
    projectUnits: [{ unitName: 'UnitA', path: 'UnitA.pas' }],
    projectDir: '/proj',
  });
});

test('loadProject registra o Project no cache do índice de chamadas, sem mudar o retorno', () => {
  callIndexCache.setProject.mockClear();

  const project = loadProject('/proj/App.dpr');

  expect(callIndexCache.setProject).toHaveBeenCalledTimes(1);
  expect(callIndexCache.setProject).toHaveBeenCalledWith({
    dprPath: '/proj/App.dpr',
    projectDir: '/proj',
    projectUnits: [{ unitName: 'UnitA', path: 'UnitA.pas' }],
  });
  expect(Object.keys(project).sort()).toEqual(['projectDir', 'projectUnits']);
});

test('falha de parse não troca o Project do cache', () => {
  callIndexCache.setProject.mockClear();
  parseDprSource.mockImplementationOnce(() => { throw new TypeError('parse'); });

  expect(() => loadProject('/proj/Ruim.dpr')).toThrow('parse');
  expect(callIndexCache.setProject).not.toHaveBeenCalled();
});

test('falha de leitura não troca o Project do cache', () => {
  callIndexCache.setProject.mockClear();
  readFile.mockImplementationOnce(() => { throw Object.assign(new Error('x'), { code: 'ENOENT' }); });

  expect(() => loadProject('/proj/Sumiu.dpr')).toThrow();
  expect(callIndexCache.setProject).not.toHaveBeenCalled();
});

test('performOpenProject registra o recente ao abrir um .dpr pelo diálogo', async () => {
  showOpenDialog.mockResolvedValue({ filePaths: ['/proj/App.dpr'] });

  const project = await performOpenProject();

  expect(project.projectDir).toBe('/proj');
  expect(recentProjects.add).toHaveBeenCalledWith('/proj/App.dpr');
});

test('performOpenProject cancelado não lê nem registra nada', async () => {
  showOpenDialog.mockResolvedValue({ filePaths: [] });

  const project = await performOpenProject();

  expect(project).toBeNull();
  expect(readFile).not.toHaveBeenCalled();
  expect(recentProjects.add).not.toHaveBeenCalled();
});

test('falha de leitura não registra o recente', () => {
  readFile.mockImplementation(() => { throw Object.assign(new Error('x'), { code: 'ENOENT' }); });

  expect(() => loadProject('/proj/App.dpr')).toThrow();
  expect(recentProjects.add).not.toHaveBeenCalled();
});

test('recentProjects:list devolve a lista persistida', () => {
  recentProjects.list.mockReturnValue(['/proj/A.dpr']);

  expect(registerHandlers()['recentProjects:list']()).toEqual(['/proj/A.dpr']);
});

test('recentProjects:open carrega o Project, registra e envia app:project-loaded', async () => {
  const event = { sender: { send: vi.fn() } };

  await registerHandlers()['recentProjects:open'](event, '/proj/A.dpr');

  expect(recentProjects.add).toHaveBeenCalledWith('/proj/A.dpr');
  expect(event.sender.send).toHaveBeenCalledWith('app:project-loaded', {
    projectUnits: [{ unitName: 'UnitA', path: 'UnitA.pas' }],
    projectDir: '/proj',
  });
  expect(showMessageBox).not.toHaveBeenCalled();
});

test('recentProjects:open com arquivo ausente mostra erro, remove a entrada e não envia nada', async () => {
  readFile.mockImplementation(() => { throw Object.assign(new Error('x'), { code: 'ENOENT' }); });
  const event = { sender: { send: vi.fn() } };

  await registerHandlers()['recentProjects:open'](event, '/proj/Velho.dpr');

  expect(showMessageBox).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  expect(recentProjects.remove).toHaveBeenCalledWith('/proj/Velho.dpr');
  expect(event.sender.send).not.toHaveBeenCalled();
});

test('recentProjects:open propaga falhas de parse sem remover a entrada', async () => {
  parseDprSource.mockImplementation(() => { throw new TypeError('parse'); });
  const event = { sender: { send: vi.fn() } };

  await expect(registerHandlers()['recentProjects:open'](event, '/proj/A.dpr')).rejects.toThrow('parse');
  expect(recentProjects.remove).not.toHaveBeenCalled();
});
