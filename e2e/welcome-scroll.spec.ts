import { test, expect } from '@playwright/test'
import { stubPreload } from './support/rendererHarness'

test.beforeEach(async ({ page }) => {
  await stubPreload(page)
})

test('rola a Welcome até os atalhos quando a janela é baixa', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 500 })
  await page.goto('/')

  const welcome = page.locator('.welcome')
  await expect(welcome).toBeVisible()

  const { scrollHeight, clientHeight } = await welcome.evaluate((el) => ({
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
  }))
  const tabBarHeight = await page.locator('.tab-bar').evaluate((el) => el.getBoundingClientRect().height)
  expect(clientHeight).toBe(500 - tabBarHeight)
  expect(scrollHeight).toBeGreaterThan(clientHeight)

  const lastShortcut = page.locator('.keyboard-shortcuts li').last()
  await expect(lastShortcut).not.toBeInViewport()

  await welcome.hover()
  await page.mouse.wheel(0, scrollHeight)

  await expect(lastShortcut).toBeInViewport()
  expect(await welcome.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
})

test('não cria rolagem na página fora da Welcome', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 500 })
  await page.goto('/')
  await expect(page.locator('.welcome')).toBeVisible()

  expect(await page.evaluate(() => document.body.scrollHeight)).toBe(500)
})

test('não mostra rolagem quando a Welcome cabe na janela', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 1400 })
  await page.goto('/')

  const welcome = page.locator('.welcome')
  await expect(welcome).toBeVisible()

  const overflows = await welcome.evaluate((el) => el.scrollHeight > el.clientHeight)
  expect(overflows).toBe(false)
})
