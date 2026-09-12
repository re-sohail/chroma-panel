import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as main from '../src/index';
import * as core from '../src/core';
import * as panel from '../src/panel';
import * as contrast from '../src/contrast';
import * as named from '../src/named-colors';

/**
 * Every piece of prose that documents the API — the README plus the guides it
 * links to. When reference content moved out of the README into docs/, this
 * had to follow it, or the check would silently stop covering the very tables
 * most likely to drift.
 */
const DOC_FILES = ['../README.md', '../docs/api.md', '../docs/guides.md'];
const README = DOC_FILES.map((f) =>
  readFileSync(new URL(f, import.meta.url), 'utf8'),
).join('\n\n');

const MODULES: Record<string, Record<string, unknown>> = {
  'chroma-panel': main,
  'chroma-panel/core': core,
  'chroma-panel/panel': panel,
  'chroma-panel/contrast': contrast,
  'chroma-panel/named-colors': named,
};

/** Every `import { a, b } from 'chroma-panel...'` in the README. */
function documentedImports(): { specifier: string; names: string[] }[] {
  const out: { specifier: string; names: string[] }[] = [];
  const re = /import\s*\{([^}]+)\}\s*from\s*'(chroma-panel[^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(README)) !== null) {
    const names = (m[1] as string)
      .split(',')
      .map((s) => s.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0] as string)
      .filter(Boolean);
    out.push({ specifier: m[2] as string, names });
  }
  return out;
}

describe('the README does not document things that do not exist', () => {
  const imports = documentedImports();

  it('finds import statements to check', () => {
    expect(imports.length).toBeGreaterThan(5);
  });

  it('only imports from entry points that exist', () => {
    for (const { specifier } of imports) {
      // Non-JS entries are covered by the exports-map test below.
      if (specifier.endsWith('.css') || specifier.endsWith('image-worker')) continue;
      expect(Object.keys(MODULES), specifier).toContain(specifier);
    }
  });

  it('only names exports that actually exist', () => {
    for (const { specifier, names } of imports) {
      const mod = MODULES[specifier];
      if (mod === undefined) continue;
      for (const name of names) {
        expect(mod, `${specifier} does not export "${name}"`).toHaveProperty(name);
      }
    }
  });

  it('documents every headline prop somewhere in the docs', () => {
    for (const prop of ['value', 'defaultValue', 'onChange', 'onChangeComplete', 'modes', 'format']) {
      expect(README, `${prop} is undocumented`).toContain(`\`${prop}\``);
    }
  });

  it('keeps the README itself short enough to read', () => {
    // The README is the npm package page and the first thing anyone sees.
    // Deep reference belongs in docs/; this guards against it creeping back.
    const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
    expect(readme.length, 'README has grown past the point of being scannable')
      .toBeLessThan(6000);
  });

  it('points at images with absolute URLs', () => {
    const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
    const images = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1] as string);
    const local = images.filter((u) => !u.startsWith('http'));
    // Relative paths depend on npm rewriting them via the repository field,
    // which has a history of failing. Absolute raw URLs always work.
    expect(local, `relative image paths: ${local.join(', ')}`).toHaveLength(0);
  });

  it('lists every published entry point in package.json exports', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    for (const { specifier } of imports) {
      const subpath = specifier === 'chroma-panel' ? '.' : './' + specifier.slice('chroma-panel/'.length);
      expect(Object.keys(pkg.exports), subpath).toContain(subpath);
    }
  });
});
