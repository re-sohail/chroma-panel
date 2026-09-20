import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import { rolldown } from 'rolldown';

const BUDGETS = [
  { entry: 'dist/core.js', label: 'core (color engine, no React)', limit: 2.5 },
  { entry: 'dist/wheel.js', label: 'wheel mode only', limit: 5.0 },
  { entry: 'dist/sliders.js', label: 'sliders mode only', limit: 6.0 },
  { entry: 'dist/palettes.js', label: 'palettes mode only', limit: 4.0 },
  { entry: 'dist/image.js', label: 'image mode only', limit: 8.5 },
  { entry: 'dist/pencils.js', label: 'pencils mode only', limit: 4.0 },
  { entry: 'dist/named-colors.js', label: 'named colors only', limit: 2.0 },
  { entry: 'dist/contrast.js', label: 'contrast utilities only', limit: 2.0 },

  {
    label: 'what you ship: ColorInput, all modes',
    limit: 21.0,
    source:
      "import { ColorInput } from './dist/index.js';\n" +
      "export { ColorInput };\n",
  },
  {
    label: 'what you ship: panel + one mode',
    limit: 13.25,
    source:
      "import { ChromaPanel } from './dist/panel.js';\n" +
      "import './dist/wheel.js';\n" +
      "export { ChromaPanel };\n",
  },
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
  const brotli = brotliCompressSync(code, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
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
      `${kb.toFixed(2).padStart(6)} KB gzip  ` +
      `${(brotli / 1024).toFixed(2).padStart(6)} KB br  (${note})`,
  );
}

console.log('\nBundle size\n' + rows.join('\n') + '\n');
if (failed) {
  console.error('size-report: over budget.');
  process.exit(1);
}
