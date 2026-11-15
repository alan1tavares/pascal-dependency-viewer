import { test, expect, type Page } from '@playwright/test'
import { emit, loadProject, pickRootUnit, stubPreload } from './support/rendererHarness'

const activeTab = (page: Page) => page.locator('.tab-bar .tab.active .tab-title')
const tab = (page: Page, title: string) => page.locator('.tab-bar .tab', { hasText: title })

test.beforeEach(async ({ page }) => {
  await stubPreload(page)
  await page.setViewportSize({ width: 1000, height: 700 })
  await page.goto('/')
})

async function openMethodTab(page: Page) {
  await loadProject(page)
  await pickRootUnit(page, 'UnitA')
  await expect(activeTab(page)).toHaveText('UnitA')
  await emit(page, 'app:show-method-selection')
  await page.locator('#commandPaletteList .commandItem', { hasText: 'TCliente.Salvar' }).click()
  await expect(activeTab(page)).toHaveText('TCliente.Salvar')
}

test('voltar a uma Method Tab mantém zoom e enquadramento do Caller Graph', async ({ page }) => {
  await openMethodTab(page)
  const canvas = page.locator('.tab-panel.active .caller-graph canvas')
  const snapshot = () => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())
  // Sem física: o desenho fica estável logo depois de montado.
  await page.waitForTimeout(300)
  const initial = await snapshot()

  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + 40, box.y + 40)
  await page.mouse.wheel(0, -300)
  await page.mouse.down()
  await page.mouse.move(box.x + 140, box.y + 90, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  const changed = await snapshot()
  expect(changed).not.toBe(initial)

  await tab(page, 'UnitA').click()
  await expect(activeTab(page)).toHaveText('UnitA')
  await tab(page, 'TCliente.Salvar').click()
  await expect(activeTab(page)).toHaveText('TCliente.Salvar')
  await page.waitForTimeout(300)

  expect(await snapshot()).toBe(changed)
})

test('reabrir o Project fecha a Method Tab', async ({ page }) => {
  await openMethodTab(page)
  await loadProject(page)
  await page.keyboard.press('Escape')
  expect(await page.locator('.tab-bar .tab .tab-title').allTextContents()).toEqual(['Bem-vindo'])
})
