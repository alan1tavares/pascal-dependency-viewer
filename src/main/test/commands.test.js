import { jest } from '@jest/globals';

const { runCommand } = await import('../commands.js');
const { registerCommandsHandler } = await import('../ipc/commands.js');

function setup(performOpenProject = jest.fn()) {
  const webContents = { send: jest.fn() };
  return { webContents, performOpenProject };
}

test('openProject envia app:project-loaded com o Project devolvido pelo diálogo', async () => {
  const project = { projectUnits: [], projectDir: '/tmp' };
  const { webContents, performOpenProject } = setup(jest.fn().mockResolvedValue(project));

  await runCommand('openProject', { webContents, performOpenProject });

  expect(performOpenProject).toHaveBeenCalled();
  expect(webContents.send).toHaveBeenCalledWith('app:project-loaded', project);
});

test('openProject não envia nada quando o diálogo nativo é cancelado', async () => {
  const { webContents, performOpenProject } = setup(jest.fn().mockResolvedValue(null));

  await runCommand('openProject', { webContents, performOpenProject });

  expect(webContents.send).not.toHaveBeenCalled();
});

test('selectUnit envia app:show-root-unit-selection sem payload', async () => {
  const { webContents, performOpenProject } = setup();

  await runCommand('selectUnit', { webContents, performOpenProject });

  expect(webContents.send).toHaveBeenCalledWith('app:show-root-unit-selection');
  expect(performOpenProject).not.toHaveBeenCalled();
});

test('openRecent envia app:show-open-recent sem payload e sem abrir diálogo nativo', async () => {
  const { webContents, performOpenProject } = setup();

  await runCommand('openRecent', { webContents, performOpenProject });

  expect(webContents.send).toHaveBeenCalledWith('app:show-open-recent');
  expect(performOpenProject).not.toHaveBeenCalled();
});

test('id desconhecido é ignorado', async () => {
  const { webContents, performOpenProject } = setup();

  await runCommand('naoExiste', { webContents, performOpenProject });

  expect(webContents.send).not.toHaveBeenCalled();
  expect(performOpenProject).not.toHaveBeenCalled();
});

test('commands:run é registrado e executa o Command no webContents que chamou', async () => {
  const handlers = {};
  const { webContents, performOpenProject } = setup();
  registerCommandsHandler(
    { handle: (channel, fn) => { handlers[channel] = fn; } },
    { performOpenProject },
  );

  await handlers['commands:run']({ sender: webContents }, 'selectUnit');

  expect(webContents.send).toHaveBeenCalledWith('app:show-root-unit-selection');
});
