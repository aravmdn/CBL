import { expect, test } from '@playwright/test'

test('starts the bowl session and renders a nonblank visual stage', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('CBL')).toBeVisible()
  const controls = page.getByRole('complementary', { name: 'Controls' })
  const micButton = page.getByRole('button', { name: 'Start bowl microphone' })
  await page.mouse.move(24, 24)
  await expect(controls).not.toHaveClass(/hidden/)
  await expect(micButton).toBeVisible()

  await micButton.click()
  await expect(page.getByRole('button', { name: 'Stop bowl microphone' })).toBeVisible()
  await expect(page.locator('[aria-label^="Detected signal:"]')).toBeVisible()
  await expect(page.locator('[aria-label^="Dominant frequency:"]')).toBeVisible()
  await expect(page.getByText('Poem')).toHaveCount(0)

  const canvasBox = await page.getByTestId('effects-canvas').boundingBox()
  expect(canvasBox?.width).toBeGreaterThan(300)
  expect(canvasBox?.height).toBeGreaterThan(300)

  const pixelSample = await page.getByTestId('effects-canvas').evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d')
    if (!context) {
      return 0
    }

    const { data } = context.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1)
    return data[0] + data[1] + data[2] + data[3]
  })

  expect(pixelSample).toBeGreaterThan(0)
})
