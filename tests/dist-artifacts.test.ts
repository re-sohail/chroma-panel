import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Assertions about the BUILT OUTPUT, not the source.
 *
 * These exist because `dist/image-worker.js` shipped at zero bytes and every
 * gate passed: publint and are-the-types-wrong check packaging shape, not
 * artifact content, and every size budget was a ceiling that an empty file
 * clears trivially.
 *
 * Requires `npm run build` first.
 */

const dist = (p: string): string => resolve(__dirname, '..', 'dist', p);
const built = existsSync(dist('index.js'));

describe.skipIf(!built)('the built worker', () => {
  const file = dist('image-worker.js');

  it('exists and is not empty', () => {
    expect(existsSync(file), 'run `npm run build` first').toBe(true);
    expect(statSync(file).size).toBeGreaterThan(500);
  });

  it('is not a hollow stub', () => {
    // tsdown can emit a syntactically valid but semantically empty entry;
    // a size check alone would pass that.
    const src = readFileSync(file, 'utf8');
    expect(src.trim()).not.toBe('export {}');
    expect(src.trim()).not.toBe('');
  });

  it('actually listens and replies', () => {
    const src = readFileSync(file, 'utf8');
    expect(src).toMatch(/addEventListener\(\s*["']message["']/);
    expect(src).toMatch(/postMessage/);
  });

  it('carries the quantizer inline rather than importing it', () => {
    const src = readFileSync(file, 'utf8');
    // Built with unbundle:false, so the quantizer must be in the file. A
    // worker is fetched by URL; a relative import would break the moment
    // anyone copies or inlines it.
    expect(src).toMatch(/histIndex|medianCut|SIGBITS/);
    const relative = [...src.matchAll(/from\s*["'](\.[^"']+)["']/g)];
    expect(relative.map((m) => m[1]), 'worker must be self-contained').toEqual([]);
  });

  it('has no CommonJS twin', () => {
    // A module worker needs ESM, and a classic worker cannot require().
    expect(existsSync(dist('image-worker.cjs'))).toBe(false);
  });
});

describe.skipIf(!built)('the built library', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    );

  it('imports the extensionless JSX runtime specifier', () => {
    // React 18/19 map "./jsx-runtime" but NOT "./jsx-runtime.js", so the
    // extensioned form throws ERR_PACKAGE_PATH_NOT_EXPORTED under Node16
    // resolution. We emit the right one; this stops a toolchain upgrade
    // silently flipping it.
    const offenders = walk(dist('.'))
      .filter((f) => f.endsWith('.js') || f.endsWith('.cjs'))
      .filter((f) => readFileSync(f, 'utf8').includes('react/jsx-runtime.js'));
    expect(offenders).toEqual([]);
  });

  it('ships no empty JavaScript files at all', () => {
    const empty = walk(dist('.'))
      .filter((f) => /\.(js|cjs)$/.test(f))
      .filter((f) => statSync(f).size === 0);
    expect(empty).toEqual([]);
  });
});

/**
 * Tree-shaking survival.
 *
 * A production build of the documented first example rendered a picker with no
 * tabs and no panel — just the title bar and the footer. `src/index.ts`
 * registers the five modes with top-level `registerMode()` calls, which are
 * side effects, while `package.json` declared
 *
 *     "sideEffects": ["**\/*.css", "./dist/image-worker.js"]
 *
 * The ARRAY FORM IS A WHITELIST, not an addition: every other file is declared
 * side-effect-free, so bundlers were entitled to drop those calls, and they
 * did. Same root cause as the 0-byte worker above.
 *
 * Nothing caught it because the playground runs `vite dev`, which does not
 * tree-shake, and every other test renders from `src/` rather than from a
 * bundled build.
 *
 * The markers below are strings unique to each mode's JAVASCRIPT. Do NOT use
 * `cp-` class names: the stylesheet is inlined into every build and contains
 * every class, so a class-name probe reports all five modes present even when
 * none of them survived. That false pass is the whole trap.
 */
describe.skipIf(!built)('tree-shaking survival', () => {
  const MODES: Record<string, string> = {
    wheel: 'Colour wheel',
    sliders: 'HSB',
    palettes: 'Name or hex',
    image: 'Drop an image here',
    pencils: 'No pencils configured',
  };

  const EXTERNAL = [/^react$/, /^react-dom$/, /^react\//, /^react-dom\//];

  /** Bundles `code` as a consumer's bundler would, and reports surviving modes. */
  async function survivingModes(code: string): Promise<string[]> {
    const { rolldown } = await import('rolldown');
    const ENTRY = '\0chroma-entry';
    const bundle = await rolldown({
      input: ENTRY,
      external: EXTERNAL,
      plugins: [{
        name: 'virtual-entry',
        resolveId: (id: string) => (id === ENTRY ? id : null),
        load: (id: string) => (id === ENTRY ? code : null),
      }],
    });
    const { output } = await bundle.generate({ format: 'esm', minify: true });
    const js = output.map((o) => ('code' in o ? o.code : '')).join('');
    return Object.keys(MODES).filter((id) => js.includes(MODES[id] as string));
  }

  it('keeps all five modes when importing from the package root', async () => {
    const modes = await survivingModes(
      `import { ColorInput } from '${dist('index.js')}'; export { ColorInput };`,
    );
    expect(modes.sort(), 'the picker would render with an empty toolbar')
      .toEqual(['image', 'palettes', 'pencils', 'sliders', 'wheel']);
  }, 60_000);

  it('ships only the modes you ask for via the subpath entries', async () => {
    // The mirror assertion. Without it, "mark everything side-effectful" would
    // pass the test above while quietly destroying the documented way to ship
    // a smaller bundle.
    const modes = await survivingModes(
      `import { ChromaPanel } from '${dist('panel.js')}';` +
      `import '${dist('wheel.js')}';` +
      `export { ChromaPanel };`,
    );
    expect(modes).toEqual(['wheel']);
  }, 60_000);
});
