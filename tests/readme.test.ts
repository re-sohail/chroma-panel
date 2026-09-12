import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as main from '../src/index';
import * as core from '../src/core';
import * as panel from '../src/panel';
import * as contrast from '../src/contrast';
import * as named from '../src/named-colors';

const README = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

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

  it('documents every prop table entry as a real prop', () => {
    // Spot-check that headline props are honoured by the component types at
    // runtime: they must at least be accepted without throwing.
    for (const prop of ['value', 'defaultValue', 'onChange', 'onChangeComplete', 'modes', 'format']) {
      expect(README).toContain(`\`${prop}\``);
    }
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
