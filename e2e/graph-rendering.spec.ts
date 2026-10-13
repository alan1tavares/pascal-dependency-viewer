import { test, expect } from '@playwright/test'
import {
  loadProject,
  networkContainerHeight,
  stubPreload,
} from './support/rendererHarness'

/** Conta pixels desenhados no canvas da vis-network (fundo é transparente). */
function drawnPixelCount(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('.network-container canvas') as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let drawn = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) drawn++
    }
    return drawn
  })
}

test.beforeEach(async ({ page }) => {
  await stubPreload(page)
  await page.setViewportSize({ width: 1000, height: 700 })
  await page.goto('/')
  await loadProject(page)
  await expect(page.locator('#commandPaletteOverlay')).toBeVisible()
})

async function selectRootUnit(page) {
  await page.locator('#commandPaletteInput').fill('UnitPrincipal')
  await page.locator('#commandPaletteList .commandItem').first().click()
  await expect(page.locator('#commandPaletteOverlay')).toHaveCount(0)
}

test('desenha o Dependency Graph após escolher a Root Unit', async ({ page }) => {
  await selectRootUnit(page)

  const canvas = page.locator('.network-container canvas')
  await expect(canvas).toBeVisible()

  await expect.poll(() => drawnPixelCount(page), { timeout: 10000 }).toBeGreaterThan(0)
})

test('mantém a altura do grafo estável (sem loop de layout)', async ({ page }) => {
  await selectRootUnit(page)

  const initial = await networkContainerHeight(page)
  expect(initial).toBeGreaterThan(0)
  expect(initial).toBeLessThanOrEqual(700)

  await page.waitForTimeout(2000)

  expect(await networkContainerHeight(page)).toBe(initial)
  expect(await page.evaluate(() => document.body.scrollHeight)).toBe(700)
})

test('não registra erros de console durante o fluxo', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await selectRootUnit(page)
  await page.waitForTimeout(1000)

  expect(errors).toEqual([])
})
