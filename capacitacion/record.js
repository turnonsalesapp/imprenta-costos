// Graba capacitacion.html a video (webm) reproduciéndolo en Chromium headless.
// Uso:  PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node capacitacion/record.js
// Requiere playwright-core y el Chromium de Playwright.
const { chromium } = require("playwright-core");
const path = require("path");

// Ejecutable de Chromium de Playwright (evita el emparejamiento de versión).
const CHROME =
  process.env.CHROME_PATH ||
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

(async () => {
  const dir = __dirname;
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: path.join(dir, "video"), size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  await page.goto("file://" + path.join(dir, "capacitacion.html"));
  const video = page.video();
  await page.waitForFunction(() => window.__done === true, { timeout: 150000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await context.close();
  console.log("Video:", await video.path());
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
