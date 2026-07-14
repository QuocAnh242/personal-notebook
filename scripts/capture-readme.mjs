import { chromium } from 'playwright'

/**
 * Capture live screenshots for README into public/readme/
 * Prerequisite: `npm run dev` on http://localhost:3000
 *
 * Usage: node scripts/capture-readme.mjs
 *
 * All desktop shots use 1440×900 viewport (no fullPage) so the gallery stays even.
 */
const OUT = 'public/readme'

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false })
  console.log('saved', name)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  const email = `readme.demo.${Date.now()}@mailinator.com`
  const password = 'ReadmeDemo123!'

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await shot(page, '01-landing.png')

  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' })
  await shot(page, '02-login.png')

  await page.goto('http://localhost:3000/auth/sign-up', { waitUntil: 'networkidle' })
  await shot(page, '03-signup.png')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' })
  await shot(page, '04-landing-mobile.png')
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto('http://localhost:3000/auth/sign-up', { waitUntil: 'domcontentloaded' })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.fill('#repeat-password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(2500)

  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'domcontentloaded' })
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type=submit]')
  await page.waitForTimeout(4500)

  await page.goto('http://localhost:3000/journal/new', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  if (!page.url().includes('/journal')) {
    console.warn('Auth failed — skipping authenticated screens')
    await browser.close()
    return
  }

  await page.getByPlaceholder(/Give this page a title/i).fill('Morning light')
  await page
    .getByPlaceholder(/Pour it out here/i)
    .fill(
      'A quiet page for becoming. Soft light on the desk, a song looping, and a small plan for who I want to be tomorrow.',
    )
  await page.getByRole('button', { name: /^Calm$/i }).click()
  await page.waitForTimeout(300)
  await shot(page, '07-editor.png')

  await page.getByRole('button', { name: /Publish to notebook/i }).click()
  await page.waitForTimeout(4000)
  if (page.url().match(/\/journal\/[0-9a-f-]+/i)) {
    await page.getByText('Back to notebook').waitFor({ timeout: 10000 }).catch(() => {})
    await shot(page, '10-entry-detail.png')
  }

  await page.goto('http://localhost:3000/journal', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  await shot(page, '06-journal.png')

  await page.goto('http://localhost:3000/explore', { waitUntil: 'networkidle' })
  await shot(page, '08-explore.png')

  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' })
  await shot(page, '09-profile.png')

  await browser.close()
  console.log('done →', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
