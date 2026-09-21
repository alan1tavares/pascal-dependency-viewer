import { jest } from '@jest/globals';

const showOpenDialog = jest.fn();
const showMessageBox = jest.fn();
const readFile = jest.fn();
const parseDprSource = jest.fn();
const recentProjects = {
  add: jest.fn(),
  remove: jest.fn(),
  list: jest.fn(),
};

jest.unstable_mockModule('electron', () => ({
  dialog: { showOpenDialog, showMessageBox },
}));
jest.unstable_mockModule('../services/fileSystem.js', () => ({ readFile }));
jest.unstable_mockModule('../services/recentProjects.js', () => recentProjects);
jest.unstable_mockModule('../../domain/parseDprSource/index.js', () => ({
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
  const event = { sender: { send: jest.fn() } };

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
  const event = { sender: { send: jest.fn() } };

  await registerHandlers()['recentProjects:open'](event, '/proj/Velho.dpr');

  expect(showMessageBox).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
  expect(recentProjects.remove).toHaveBeenCalledWith('/proj/Velho.dpr');
  expect(event.sender.send).not.toHaveBeenCalled();
});

test('recentProjects:open propaga falhas de parse sem remover a entrada', async () => {
  parseDprSource.mockImplementation(() => { throw new TypeError('parse'); });
  const event = { sender: { send: jest.fn() } };

  await expect(registerHandlers()['recentProjects:open'](event, '/proj/A.dpr')).rejects.toThrow('parse');
  expect(recentProjects.remove).not.toHaveBeenCalled();
});
