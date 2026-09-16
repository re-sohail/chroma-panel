import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = (p: string): string => resolve(__dirname, '..', 'dist', p);
const built = existsSync(dist('index.js'));

describe.skipIf(!built)('the built worker', () => {
  const file = dist('image-worker.js');

  it('exists and is not empty', () => {
    expect(existsSync(file), 'run `npm run build` first').toBe(true);
    expect(statSync(file).size).toBeGreaterThan(500);
  });

  it('is not a hollow stub', () => {
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
    expect(src).toMatch(/histIndex|medianCut|SIGBITS/);
    const relative = [...src.matchAll(/from\s*["'](\.[^"']+)["']/g)];
    expect(relative.map((m) => m[1]), 'worker must be self-contained').toEqual([]);
  });

  it('has no CommonJS twin', () => {
    expect(existsSync(dist('image-worker.cjs'))).toBe(false);
  });
});

describe.skipIf(!built)('the built library', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    );

  it('imports the extensionless JSX runtime specifier', () => {
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

describe.skipIf(!built)('tree-shaking survival', () => {
  const MODES: Record<string, string> = {
    wheel: 'Color wheel',
    sliders: 'HSB',
    palettes: 'Name or hex',
    image: 'Drop an image here',
    pencils: 'No pencils configured',
  };

  const EXTERNAL = [/^react$/, /^react-dom$/, /^react\//, /^react-dom\//];

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
    const modes = await survivingModes(
      `import { ChromaPanel } from '${dist('panel.js')}';` +
      `import '${dist('wheel.js')}';` +
      `export { ChromaPanel };`,
    );
    expect(modes).toEqual(['wheel']);
  }, 60_000);
});
