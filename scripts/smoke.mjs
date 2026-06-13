import puppeteer from "puppeteer-core"

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const URL = process.env.SMOKE_URL || "http://localhost:5173/"

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--enable-webgl","--ignore-gpu-blocklist","--use-gl=angle","--use-angle=swiftshader","--no-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1200, height: 800 })

let errors = []
page.on("console", (m) => {
  const t = m.text()
  if (/error|fail|undefined is not|cannot read|WebGLProgram|compile|shader|glsl/i.test(t) && m.type() !== "warning") {
    errors.push(t)
  }
})
page.on("pageerror", (e) => errors.push(String(e)))

await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 })
await new Promise(r => setTimeout(r, 800))

// The sidebar is collapsed by default now — expand it so the effect list is
// clickable. The "show sidebar" rail is only present while collapsed.
await page.evaluate(() => {
  const rail = document.querySelector(".sidebar-rail")
  if (rail) rail.click()
})
await new Promise(r => setTimeout(r, 600))
// Wait for the effect list to actually render before reading it.
await page.waitForSelector(".item", { timeout: 5000 })

const items = await page.$$eval(".item", els => els.map(e => e.textContent.trim()))
console.log("Found", items.length, "effects")

// The info/actions dock is collapsed by default; the Docs button lives in the
// actions card revealed by the dock toggle. Open it once — the Docs panel then
// stays open across effect switches, exercising the live code generator
// (an empty snippet = failure) for every effect.
await page.evaluate(() => {
  const t = document.querySelector(".dock-toggle")
  if (t) t.click()
})
await new Promise(r => setTimeout(r, 250))
await page.evaluate(() => {
  const btn = [...document.querySelectorAll(".copy-config")].find(b => b.textContent.trim() === "Docs")
  if (btn) btn.click()
})
await new Promise(r => setTimeout(r, 200))

const results = []
for (let i = 0; i < items.length; i++) {
  errors = []
  const handles = await page.$$(".item")
  await handles[i].click()
  await new Promise(r => setTimeout(r, 450))
  const code = await page.$eval(".docs-code code", el => el.textContent.trim()).catch(() => "")
  if (!code) errors.push("docs panel: empty or missing usage snippet")
  if (!code.includes("from 'easy-3dkit'")) errors.push("docs panel: snippet missing easy-3dkit import")
  results.push({ name: items[i], errs: [...new Set(errors)].slice(0,3) })
}
await browser.close()

const failed = results.filter(r => r.errs.length)
console.log(`\n=== SMOKE: PASS ${results.length-failed.length}/${results.length} ===`)
for (const f of failed) {
  console.log(`  X ${f.name}`)
  for (const e of f.errs) console.log(`      ${e.slice(0,180)}`)
}
if (!failed.length) console.log("All effects rendered with no errors.")
