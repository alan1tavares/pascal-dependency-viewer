import { jest } from '@jest/globals';

const buildFromTemplate = jest.fn((template) => template);
const setApplicationMenu = jest.fn();
const showMessageBox = jest.fn();

jest.unstable_mockModule('electron', () => ({
  Menu: { buildFromTemplate, setApplicationMenu },
  dialog: { showMessageBox },
}));

const { buildMenu } = await import('../menu.js');

function buildTestMenu(overrides = {}) {
  const mainWindow = { webContents: { send: jest.fn() } };
  const performOpenProject = jest.fn();
  buildMenu(mainWindow, { performOpenProject, ...overrides });
  const template = buildFromTemplate.mock.calls[buildFromTemplate.mock.calls.length - 1][0];
  return { mainWindow, performOpenProject, template };
}

test('monta o menu "Arquivo" com "Abrir Projeto" e "Sair" nesta ordem', () => {
  const { template } = buildTestMenu();

  const arquivoMenu = template[0];
  expect(arquivoMenu.label).toBe('Arquivo');
  expect(arquivoMenu.submenu.map((item) => item.label)).toEqual(['Abrir Projeto', 'Sair']);
  expect(arquivoMenu.submenu[1].role).toBe('quit');
});

test('"Abrir Projeto" tem o atalho CmdOrCtrl+O (Cmd no macOS, Ctrl no Linux)', () => {
  const { template } = buildTestMenu();

  expect(template[0].submenu[0].accelerator).toBe('CmdOrCtrl+O');
});

test('monta o menu "Edição" com "Selecionar Unit" e "Selecionar Método" nesta ordem', () => {
  const { template } = buildTestMenu();

  const edicaoMenu = template[1];
  expect(edicaoMenu.label).toBe('Edição');
  expect(edicaoMenu.submenu.map((item) => item.label)).toEqual([
    'Selecionar Unit',
    'Selecionar Método',
  ]);
});

test('mantém { role: "viewMenu" } como terceira entrada', () => {
  const { template } = buildTestMenu();

  expect(template[2]).toEqual({ role: 'viewMenu' });
});

test('"Abrir Projeto" reaproveita performOpenProject e envia app:project-loaded', async () => {
  const project = { projectUnits: [], projectDir: '/tmp' };
  const performOpenProject = jest.fn().mockResolvedValue(project);
  const { template, mainWindow } = buildTestMenu({ performOpenProject });

  await template[0].submenu[0].click();

  expect(performOpenProject).toHaveBeenCalled();
  expect(mainWindow.webContents.send).toHaveBeenCalledWith('app:project-loaded', project);
});

test('"Abrir Projeto" não envia nada quando o diálogo é cancelado', async () => {
  const performOpenProject = jest.fn().mockResolvedValue(null);
  const { template, mainWindow } = buildTestMenu({ performOpenProject });

  await template[0].submenu[0].click();

  expect(mainWindow.webContents.send).not.toHaveBeenCalled();
});

test('"Selecionar Unit" envia app:show-root-unit-selection sem payload', () => {
  const { template, mainWindow } = buildTestMenu();

  template[1].submenu[0].click();

  expect(mainWindow.webContents.send).toHaveBeenCalledWith('app:show-root-unit-selection');
});

test('"Selecionar Método" exibe um alerta e não mexe no renderer', () => {
  const { template, mainWindow } = buildTestMenu();

  template[1].submenu[1].click();

  expect(showMessageBox).toHaveBeenCalledWith(
    mainWindow,
    expect.objectContaining({ message: expect.stringContaining('Selecionar Método') }),
  );
  expect(mainWindow.webContents.send).not.toHaveBeenCalled();
});
