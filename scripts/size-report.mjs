/**
 * Bundle-size budget.
 *
 * "Lightweight" is the whole premise of this package, so it is enforced in CI
 * rather than checked occasionally by hand. Sizes are measured by bundling
 * each entry the way a consumer would, with React external.
 */
import { gzipSync } from 'node:zlib';
import { rolldown } from 'rolldown';

/**
 * Budgets are the measured size plus a little headroom, so any real
 * regression trips the build. They are NOT aspirational targets -- moving one
 * up should be a deliberate, reviewed decision.
 *
 * For context, measured the same way on the same day:
 *   react-colorful              4.8 KB gzip, 0 deps, one mode
 *   @uiw/react-color           15.7 KB gzip, 20 deps
 *   @rc-component/color-picker  6.6 KB gzip, 3 deps, one mode
 *   react-color                37.5 KB gzip, 7 deps, unmaintained since 2020
 *
 * Raised once, deliberately, for the production UI rebuild: a real design
 * system, a segmented control, responsive rules and the mobile sheet cost
 * about 2 KB gzip over the first pass.
 *
 * About 3.5 KB gzip of the full bundle is the stylesheet, which is inlined so
 * that the picker works with no CSS import. Consumers who prefer the separate
 * file can pass injectStyles={false} and import 'chroma-panel/styles.css'.
 */
const BUDGETS = [
  { entry: 'dist/core.js', label: 'core (colour engine, no React)', limit: 2.5 },
  { entry: 'dist/wheel.js', label: 'wheel mode only', limit: 5.0 },
  { entry: 'dist/sliders.js', label: 'sliders mode only', limit: 6.0 },
  { entry: 'dist/index.js', label: 'full package, all five modes', limit: 19.5 },
];

const EXTERNAL = [/^react$/, /^react-dom$/, /^react\//, /^react-dom\//];

let failed = false;
const rows = [];

for (const { entry, label, limit } of BUDGETS) {
  const bundle = await rolldown({
    input: entry,
    external: EXTERNAL,
    // Match what a consumer's production build does.
    treeshake: true,
    logLevel: 'silent',
  });
  const { output } = await bundle.generate({ format: 'esm', minify: true });
  await bundle.close();

  const code = output.filter((c) => c.type === 'chunk').map((c) => c.code).join('');
  const raw = Buffer.byteLength(code);
  const gzip = gzipSync(code, { level: 9 }).length;
  const kb = gzip / 1024;
  const over = kb > limit;
  if (over) failed = true;

  rows.push(
    `${over ? 'FAIL' : 'ok  '}  ${label.padEnd(34)} ` +
      `${(raw / 1024).toFixed(1).padStart(6)} KB min  ` +
      `${kb.toFixed(2).padStart(6)} KB gzip  (budget ${limit} KB)`,
  );
}

console.log('\nBundle size\n' + rows.join('\n') + '\n');
if (failed) {
  console.error('size-report: over budget.');
  process.exit(1);
}
