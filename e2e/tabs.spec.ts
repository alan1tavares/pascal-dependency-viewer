import { test, expect, type Page } from '@playwright/test'
import { emit, loadProject, pickRootUnit, stubPreload } from './support/rendererHarness'

const tabTitles = (page: Page) => page.locator('.tab-bar .tab .tab-title').allTextContents()
const activeTab = (page: Page) => page.locator('.tab-bar .tab.active .tab-title')
const tab = (page: Page, title: string) => page.locator('.tab-bar .tab', { hasText: title })
const expandCalls = (page: Page) => page.evaluate(() => (window as any).__expandCalls || 0)

async function openRootUnit(page: Page, unitName: string) {
  await emit(page, 'app:show-root-unit-selection')
  await pickRootUnit(page, unitName)
  await expect(activeTab(page)).toHaveText(unitName)
}

test.beforeEach(async ({ page }) => {
  await stubPreload(page)
  await page.setViewportSize({ width: 1000, height: 700 })
  await page.goto('/')
})

test('inicia só com a Welcome Tab, ativa e sem botão de fechar', async ({ page }) => {
  expect(await tabTitles(page)).toEqual(['Bem-vindo'])
  await expect(activeTab(page)).toHaveText('Bem-vindo')
  await expect(tab(page, 'Bem-vindo').locator('.tab-close')).toHaveCount(0)

  await page.keyboard.press('Meta+w')
  expect(await tabTitles(page)).toEqual(['Bem-vindo'])
})

test('Esc fecha o Selecionar Unit aberto ao carregar um Project e mantém a Welcome Tab', async ({ page }) => {
  await loadProject(page)
  await expect(page.locator('#commandPaletteOverlay')).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(page.locator('#commandPaletteOverlay')).toHaveCount(0)
  await expect(activeTab(page)).toHaveText('Bem-vindo')
  await expect(page.locator('.tab-panel.active .project-loaded')).toBeVisible()
})

test('Cmd/Ctrl+P troca para a lista de Commands a partir do Selecionar Unit automático', async ({ page }) => {
  await loadProject(page)
  await emit(page, 'app:show-command-palette')

  await expect(page.locator('#commandPaletteInput')).toHaveAttribute('placeholder', 'Digite um comando')
  await expect(page.locator('#commandPaletteList')).toContainText('Bem-vindo')
})

test('cada Root Unit abre uma Graph Tab no fim da barra; repetir só ativa', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await expect(activeTab(page)).toHaveText('UnitA')
  await openRootUnit(page, 'UnitB')

  expect(await tabTitles(page)).toEqual(['Bem-vindo', 'UnitA', 'UnitB'])
  await expect(tab(page, 'UnitA')).toHaveAttribute('title', 'UnitA.pas')
  expect(await expandCalls(page)).toBe(2)

  await openRootUnit(page, 'UnitA')
  expect(await tabTitles(page)).toEqual(['Bem-vindo', 'UnitA', 'UnitB'])
  expect(await expandCalls(page)).toBe(2)
})

test('cada Graph Tab mantém seu próprio View Filter', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await expect(activeTab(page)).toHaveText('UnitA')

  await page.locator('.tab-panel.active .viewFilterExternal').check()
  await openRootUnit(page, 'UnitB')
  await expect(page.locator('.tab-panel.active .viewFilterExternal')).not.toBeChecked()

  await tab(page, 'UnitA').click()
  await expect(activeTab(page)).toHaveText('UnitA')
  await expect(page.locator('.tab-panel.active .viewFilterExternal')).toBeChecked()
  await expect(page.locator('.tab-panel.active .filter-panel')).toBeVisible()
})

test('fechar a Tab ativa ativa a usada mais recentemente', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await openRootUnit(page, 'UnitB')

  await tab(page, 'UnitA').click()
  await tab(page, 'Bem-vindo').click()
  await tab(page, 'UnitB').click()
  await tab(page, 'UnitB').locator('.tab-close').click()

  expect(await tabTitles(page)).toEqual(['Bem-vindo', 'UnitA'])
  await expect(activeTab(page)).toHaveText('Bem-vindo')
})

test('Cmd+W fecha a Tab ativa e fechar a última reabre a Welcome Tab', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await expect(activeTab(page)).toHaveText('UnitA')

  await tab(page, 'Bem-vindo').locator('.tab-close').click()
  expect(await tabTitles(page)).toEqual(['UnitA'])

  await page.keyboard.press('Meta+w')
  expect(await tabTitles(page)).toEqual(['Bem-vindo'])
  await expect(activeTab(page)).toHaveText('Bem-vindo')
})

test('Ctrl+Tab e Ctrl+Shift+Tab navegam em ciclo pela posição na barra', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await openRootUnit(page, 'UnitB')

  await page.keyboard.press('Control+Tab')
  await expect(activeTab(page)).toHaveText('Bem-vindo')
  await page.keyboard.press('Control+Shift+Tab')
  await expect(activeTab(page)).toHaveText('UnitB')
  await page.keyboard.press('Control+Shift+Tab')
  await expect(activeTab(page)).toHaveText('UnitA')
})

test('atalhos de Tab não fazem nada com a Command Palette aberta', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await emit(page, 'app:show-command-palette')

  await page.keyboard.press('Meta+w')
  await page.keyboard.press('Control+Tab')

  expect(await tabTitles(page)).toEqual(['Bem-vindo', 'UnitA'])
  await expect(activeTab(page)).toHaveText('UnitA')
})

test('Bem-vindo reabre a Welcome Tab no fim da barra, ou só a ativa', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await expect(activeTab(page)).toHaveText('UnitA')

  await emit(page, 'app:show-welcome')
  await expect(activeTab(page)).toHaveText('Bem-vindo')
  expect(await tabTitles(page)).toEqual(['Bem-vindo', 'UnitA'])

  await tab(page, 'Bem-vindo').locator('.tab-close').click()
  await emit(page, 'app:show-welcome')
  expect(await tabTitles(page)).toEqual(['UnitA', 'Bem-vindo'])
  await expect(activeTab(page)).toHaveText('Bem-vindo')
})

test('carregar um Project fecha as Graph Tabs e ativa a Welcome Tab', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await openRootUnit(page, 'UnitB')
  await tab(page, 'Bem-vindo').locator('.tab-close').click()

  await loadProject(page)

  expect(await tabTitles(page)).toEqual(['Bem-vindo'])
  await expect(activeTab(page)).toHaveText('Bem-vindo')
  await expect(page.locator('.network-container')).toHaveCount(0)
})

test('a barra rola na horizontal até a Tab ativa quando há muitas Tabs', async ({ page }) => {
  await page.setViewportSize({ width: 300, height: 700 })
  await loadProject(page)
  await pickRootUnit(page, 'UnitPrincipal')
  await openRootUnit(page, 'UnitA')
  await openRootUnit(page, 'UnitB')

  const bar = page.locator('.tab-bar')
  const { scrollWidth, clientWidth, height } = await bar.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    height: el.getBoundingClientRect().height,
  }))
  expect(scrollWidth).toBeGreaterThan(clientWidth)
  expect(height).toBeLessThan(60)
  await expect(tab(page, 'UnitB')).toBeInViewport({ ratio: 0.9 })

  await page.keyboard.press('Control+Tab')
  await expect(tab(page, 'Bem-vindo')).toBeInViewport({ ratio: 0.9 })
})

test('Graph Tab inativa preenche a área ao ser ativada depois de redimensionar a janela', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await openRootUnit(page, 'UnitB')

  await page.setViewportSize({ width: 1200, height: 900 })
  await tab(page, 'UnitA').click()

  const { canvasHeight, contentHeight } = await page.evaluate(() => ({
    canvasHeight: Math.round(document.querySelector('.tab-panel.active .network-container canvas')!.getBoundingClientRect().height),
    contentHeight: Math.round(document.querySelector('.tab-content')!.getBoundingClientRect().height),
  }))
  expect(canvasHeight).toBe(contentHeight)
})

test('voltar a uma Graph Tab mantém zoom e posições do grafo', async ({ page }) => {
  test.slow()
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await expect(activeTab(page)).toHaveText('UnitA')

  const canvas = page.locator('.tab-panel.active .network-container canvas')
  const snapshot = () => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
  let stable = false
  for (let i = 0; i < 30 && !stable; i++) {
    const first = await snapshot()
    await page.waitForTimeout(500)
    stable = first === (await snapshot())
  }
  // Às vezes a física da vis-network não para (acontece também na `main`, com
  // uma Graph Tab só); sem grafo parado não há como comparar o canvas.
  test.skip(!stable, 'a física da vis-network não estabilizou')

  const settled = await snapshot()
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -300)
  await page.waitForTimeout(500)
  const zoomed = await snapshot()
  expect(zoomed).not.toBe(settled)

  await openRootUnit(page, 'UnitB')
  await tab(page, 'UnitA').click()
  await expect(activeTab(page)).toHaveText('UnitA')
  await page.waitForTimeout(300)

  expect(await snapshot()).toBe(zoomed)
})

test('reabrir uma Root Unit depois de fechar sua Graph Tab volta o View Filter ao padrão', async ({ page }) => {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await expect(activeTab(page)).toHaveText('UnitA')
  await page.locator('.tab-panel.active .viewFilterExternal').check()

  await tab(page, 'UnitA').locator('.tab-close').click()
  await openRootUnit(page, 'UnitA')

  expect(await tabTitles(page)).toEqual(['Bem-vindo', 'UnitA'])
  await expect(page.locator('.tab-panel.active .viewFilterExternal')).not.toBeChecked()
})

test('grafo que chega depois de outro Project ser carregado não abre Graph Tab', async ({ page }) => {
  await loadProject(page)
  await page.evaluate(() => {
    const w = window as any
    w.__expandGate = new Promise((resolve) => { w.__releaseExpand = resolve })
  })
  await pickRootUnit(page, 'UnitA')
  await expect.poll(() => expandCalls(page)).toBe(1)

  await loadProject(page)
  await page.evaluate(() => (window as any).__releaseExpand())
  await page.waitForTimeout(300)

  expect(await tabTitles(page)).toEqual(['Bem-vindo'])
  await expect(activeTab(page)).toHaveText('Bem-vindo')
})

test('falha ao gerar o grafo avisa o usuário e não abre Graph Tab', async ({ page }) => {
  await loadProject(page)
  await page.evaluate(() => { (window as any).__expandFail = 'UnitA' })
  const dialog = page.waitForEvent('dialog')
  const pick = pickRootUnit(page, 'UnitA')

  const shown = await dialog
  expect(shown.message()).toContain('UnitA')
  await shown.accept()
  await pick

  expect(await tabTitles(page)).toEqual(['Bem-vindo'])
})
