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

test('monta o menu "Arquivo" com "Abrir projeto (.dpr)", "Abrir recente" e "Sair" nesta ordem', () => {
  const { template } = buildTestMenu({ platform: 'linux' });

  const arquivoMenu = template[0];
  expect(arquivoMenu.label).toBe('Arquivo');
  expect(arquivoMenu.submenu.map((item) => item.label)).toEqual([
    'Abrir projeto (.dpr)',
    'Abrir recente  Ctrl+K R',
    'Sair',
  ]);
  expect(arquivoMenu.submenu[2].role).toBe('quit');
});

test('"Abrir projeto (.dpr)" tem o atalho CmdOrCtrl+O (Cmd no macOS, Ctrl no Linux)', () => {
  const { template } = buildTestMenu();

  expect(template[0].submenu[0].accelerator).toBe('CmdOrCtrl+O');
});

test('"Abrir recente" exibe a dica ⌘K R no macOS e Ctrl+K R no Linux, sem acelerador nativo', () => {
  const mac = buildTestMenu({ platform: 'darwin' }).template[0].submenu[1];
  const linux = buildTestMenu({ platform: 'linux' }).template[0].submenu[1];

  expect(mac.label).toBe('Abrir recente  ⌘K R');
  expect(linux.label).toBe('Abrir recente  Ctrl+K R');
  expect(mac.accelerator).toBeUndefined();
  expect(linux.accelerator).toBeUndefined();
});

test('"Abrir recente" envia app:show-open-recent sem payload e sem abrir diálogo nativo', () => {
  const { template, mainWindow, performOpenProject } = buildTestMenu();

  template[0].submenu[1].click();

  expect(mainWindow.webContents.send).toHaveBeenCalledWith('app:show-open-recent');
  expect(performOpenProject).not.toHaveBeenCalled();
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

test('"Abrir projeto (.dpr)" reaproveita performOpenProject e envia app:project-loaded', async () => {
  const project = { projectUnits: [], projectDir: '/tmp' };
  const performOpenProject = jest.fn().mockResolvedValue(project);
  const { template, mainWindow } = buildTestMenu({ performOpenProject });

  await template[0].submenu[0].click();

  expect(performOpenProject).toHaveBeenCalled();
  expect(mainWindow.webContents.send).toHaveBeenCalledWith('app:project-loaded', project);
});

test('"Abrir projeto (.dpr)" não envia nada quando o diálogo é cancelado', async () => {
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
