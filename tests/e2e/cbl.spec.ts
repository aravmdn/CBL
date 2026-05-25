import { expect, test } from '@playwright/test'

test('starts the bowl session, generates poetry, and renders a nonblank canvas', async ({ page }) => {
  await page.route('**/api/poem', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        lines: ['first light', 'finds the room', 'under your breath', 'the sample turns', 'into weather'],
        moodWords: ['soft', 'bright'],
        palette: { primary: '#8ee8ff', accent: '#f4c979' },
      }),
    })
  })

  await page.goto('/')
  await expect(page.getByText('CBL')).toBeVisible()
  const controls = page.getByRole('complementary', { name: 'Controls' })
  const micButton = page.getByRole('button', { name: 'Start bowl microphone' })
  await page.mouse.move(24, 24)
  await expect(controls).not.toHaveClass(/hidden/)
  await expect(micButton).toBeVisible()

  await micButton.click()
  await expect(page.getByText('Bowl session active')).toBeVisible()
  await page.mouse.move(24, 24)
  await expect(controls).not.toHaveClass(/hidden/)
  await controls.getByRole('button', { name: 'Generate poem', exact: true }).click()
  await expect(page.getByText('first light')).toBeVisible()
  await expect(page.getByText('Poem ready')).toBeVisible()

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
