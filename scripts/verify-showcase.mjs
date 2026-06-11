import puppeteer from "puppeteer-core"

// Visual pass of the /showcase feature tour: loads the page, walks every
// section, clicks every chip (exercising each scene swap and codegen block),
// screenshots along the way, and fails loudly on console/page errors.
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const URL = process.env.SHOWCASE_URL || "http://localhost:5173/showcase"
const SHOTS = process.env.SHOTS_DIR || "/tmp"

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--enable-webgl","--ignore-gpu-blocklist","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1400, height: 900 })

const errors = []
page.on("console", m => { if (m.type() === "error") errors.push(m.text()) })
page.on("pageerror", e => errors.push(String(e)))

await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 })
await new Promise(r => setTimeout(r, 1500))
await page.screenshot({ path: `${SHOTS}/showcase-hero.png` })

for (const id of ["view", "scroll", "animation", "families", "config"]) {
  await page.evaluate((id) => document.getElementById(id)?.scrollIntoView(), id)
  await new Promise(r => setTimeout(r, 900))
  const count = await page.$$eval(`#${id} .sc-chip`, els => els.length)
  for (let i = 0; i < count; i++) {
    // Re-query and click in-page: state changes re-render the chips, and the
    // sticky scroll section can move them out of puppeteer's clickable zone.
    await page.evaluate((id, i) => document.querySelectorAll(`#${id} .sc-chip`)[i]?.dispatchEvent(new MouseEvent('click', { bubbles: true })), id, i)
    await new Promise(r => setTimeout(r, 250))
  }
  await page.screenshot({ path: `${SHOTS}/showcase-${id}.png` })
}

const codes = await page.$$eval(".sc-code code", els => els.map(e => e.textContent.trim().length))
console.log("code blocks:", codes.length, "min length:", Math.min(...codes))
if (!codes.length || Math.min(...codes) === 0) errors.push("empty code block on the page")

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await new Promise(r => setTimeout(r, 800))
await page.screenshot({ path: `${SHOTS}/showcase-footer.png` })
await browser.close()

if (errors.length) {
  console.log("ERRORS:\n" + [...new Set(errors)].slice(0, 8).join("\n"))
  process.exit(1)
}
console.log("Showcase verified: no console errors, all sections interactive.")
