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
