// Regenerates the README screenshots and the GitHub social preview from the
// playground, so they always show what the published package renders.
//
//   cd playground && npm run relink   # install the current build
//   cd .. && npm run readme:images
//
// The image panels start as empty drop zones. The sample photo goes in through
// the panel's own file input, the same path a user's upload takes.
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('..', import.meta.url));
const playground = fileURLToPath(new URL('../playground/', import.meta.url));
const sample = fileURLToPath(new URL('../playground/public/autumn-park.webp', import.meta.url));

const SHOTS = [
  { page: 'hero.html', selector: '#stage', out: 'assets/hero.png', panels: 3 },
  { page: 'themes.html', selector: '#stage', out: 'assets/themes.png', panels: 2 },
  { page: 'social.html', selector: '#stage', out: 'assets/social-preview.png', panels: 2, scale: 1 },
];

// Vite and sharp are dependencies of the playground, not of the package.
const fromPlayground = createRequire(`${playground}package.json`);
const load = (name) => import(pathToFileURL(fromPlayground.resolve(name)).href);
const { createServer } = await load('vite');
const { default: sharp } = await load('sharp');

const server = await createServer({ root: playground, logLevel: 'warn', server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];

const browser = await chromium.launch();
try {
  for (const shot of SHOTS) {
    const page = await browser.newPage({
      viewport: { width: 1600, height: 900 },
      deviceScaleFactor: shot.scale ?? 2,
      colorScheme: 'dark',
    });
    await page.goto(new URL(shot.page, base).href);
    await page.locator('.cp-root').nth(shot.panels - 1).waitFor();

    const inputs = page.locator('input[type="file"]');
    for (let i = 0; i < (await inputs.count()); i++) {
      await inputs.nth(i).setInputFiles(sample);
    }
    if ((await inputs.count()) > 0) {
      await page.locator('.cp-swatch-grid[aria-label="Extracted colors"]').first().waitFor();
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.cp-image-preview img')].every((img) => img.complete),
      );
    }

    // Let the thumbs and fades settle, and keep focus rings out of the shot.
    await page.evaluate(() => document.activeElement?.blur());
    await page.waitForTimeout(300);

    const raw = await page.locator(shot.selector).screenshot({ animations: 'disabled' });
    // Lossless: a palette PNG would shift the very colors the images show off.
    const png = await sharp(raw).png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 }).toBuffer();
    await writeFile(`${root}${shot.out}`, png);
    const { width, height } = await sharp(png).metadata();
    console.log(`${shot.out}  ${width}x${height}  ${Math.round(png.length / 1024)} KB`);
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
