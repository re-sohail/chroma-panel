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
 * Raised twice, deliberately. First for the production UI rebuild (design
 * system, segmented control, responsive rules, mobile sheet): about 2 KB.
 * Then for the pre-release correctness pass — native form semantics, the
 * honest contrast API and per-mode props: about 0.9 KB.
 *
 * 20.5 -> 21.5 for a real image drop zone (the native file control was
 * replaced with a hidden input behind a label, a preview that shows the whole
 * image, and a remove button), plus scroll-edge fades and the horizontal bleed
 * that stops the scroll port slicing a slider thumb in half: about 0.8 KB.
 * Trimming the dead -webkit-mask- prefix and backdrop-filter first recovered
 * only 0.03 KB, so the rest is genuinely new behaviour, not slack.
 *
 * THEN EVERY NUMBER ABOVE TURNED OUT TO BE MEASURED AGAINST A BROKEN BUILD.
 * The rows used to bundle `dist/index.js` as a barrel, retaining every export.
 * That is not what a consumer imports, and — worse — it hid the fact that the
 * five `registerMode()` calls were being tree-shaken out of real consumer
 * builds, because package.json's `sideEffects` array is a whitelist that did
 * not list the entries making them. A production build of
 * `import { ColorInput } from "chroma-panel"` rendered a picker with no tabs
 * and no panel.
 *
 * The rows below now bundle the way a consumer imports, so the numbers mean
 * something and a mode that fails to register shows up as a size cliff.
 * Fixing the bug moved the headline figure from a fictional 12.5 KB to a real
 * 19 KB; the ceiling is not chasing new features, it is admitting what the
 * working package has always cost.
 *
 * Raising a ceiling should always be a reviewed decision with a reason
 * attached, never a reflex when a build goes red.
 *
 * About 3.5 KB gzip of the full bundle is the stylesheet, which is inlined so
 * that the picker works with no CSS import. Consumers who prefer the separate
 * file can pass injectStyles={false} and import 'chroma-panel/styles.css'.
 */
/**
 * Every budget here is a ceiling. A zero-byte artifact clears a ceiling
 * trivially, which is exactly how an empty worker shipped unnoticed — so
 * entries may also declare a `floor`.
 */
const BUDGETS = [
  { entry: 'dist/core.js', label: 'core (colour engine, no React)', limit: 2.5 },
  { entry: 'dist/wheel.js', label: 'wheel mode only', limit: 5.0 },
  { entry: 'dist/sliders.js', label: 'sliders mode only', limit: 6.0 },

  // Written as source, not as a path: these bundle what a consumer's import
  // pulls in, which is the only figure that means anything to them. The
  // barrel-as-entry row they replaced counted every export, including ones
  // any real build drops.
  {
    label: 'what you ship: ColorInput, all modes',
    limit: 19.5,
    source:
      "import { ColorInput } from './dist/index.js';\n" +
      "export { ColorInput };\n",
  },
  {
    label: 'what you ship: panel + one mode',
    limit: 13.0,
    source:
      "import { ChromaPanel } from './dist/panel.js';\n" +
      "import './dist/wheel.js';\n" +
      "export { ChromaPanel };\n",
  },
  // Not bundled here — it is already self-contained and is loaded by URL, so
  // the point is the floor, not the ceiling.
  { entry: 'dist/image-worker.js', label: 'image worker (standalone)', limit: 6, floor: 1 },
];

const EXTERNAL = [/^react$/, /^react-dom$/, /^react\//, /^react-dom\//];

let failed = false;
const rows = [];

const VIRTUAL = '\0chroma-size-entry';

for (const { entry, label, limit, floor, source } of BUDGETS) {
  const bundle = await rolldown({
    input: source === undefined ? entry : VIRTUAL,
    external: EXTERNAL,
    // Match what a consumer's production build does.
    treeshake: true,
    logLevel: 'silent',
    plugins: source === undefined ? [] : [{
      name: 'virtual-entry',
      resolveId: (id) => (id === VIRTUAL ? id : null),
      load: (id) => (id === VIRTUAL ? source : null),
    }],
  });
  const { output } = await bundle.generate({ format: 'esm', minify: true });
  await bundle.close();

  const code = output.filter((c) => c.type === 'chunk').map((c) => c.code).join('');
  const raw = Buffer.byteLength(code);
  const gzip = gzipSync(code, { level: 9 }).length;
  const kb = gzip / 1024;
  const over = kb > limit;
  const under = floor !== undefined && kb < floor;
  if (over || under) failed = true;

  const note = under
    ? `SUSPICIOUSLY SMALL — expected at least ${floor} KB`
    : `budget ${limit} KB${floor !== undefined ? `, floor ${floor} KB` : ''}`;

  rows.push(
    `${over || under ? 'FAIL' : 'ok  '}  ${label.padEnd(34)} ` +
      `${(raw / 1024).toFixed(1).padStart(6)} KB min  ` +
      `${kb.toFixed(2).padStart(6)} KB gzip  (${note})`,
  );
}

console.log('\nBundle size\n' + rows.join('\n') + '\n');
if (failed) {
  console.error('size-report: over budget.');
  process.exit(1);
}
