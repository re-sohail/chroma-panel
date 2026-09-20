import { defineConfig } from 'tsdown';
import { minifyCss } from './scripts/minify-css.mjs';

const minifyInlinedCss = {
  name: 'chroma-panel:minify-inlined-css',
  transform(code: string, id: string) {
    if (!id.replace(/\\/g, '/').endsWith('src/styles/css.ts')) return null;
    const match = code.match(/export const css: string = `([\s\S]*?)`;/);
    if (match === null) return null;
    const next = code.replace(
      match[0],
      'export const css: string = `' + minifyCss(match[1] as string) + '`;',
    );
    return { code: next, map: null };
  },
};

const library = defineConfig({
  plugins: [minifyInlinedCss],
  entry: [
    'src/index.ts',
    'src/core.ts',
    'src/color.ts',
    'src/panel.ts',
    'src/wheel.ts',
    'src/sliders.ts',
    'src/palettes.ts',
    'src/image.ts',
    'src/pencils.ts',
    'src/named-colors.ts',
    'src/contrast.ts',
    'src/gradient.ts',
    'src/modes.ts',
    'src/export.ts',
  ],

  format: ['esm', 'cjs'],
  unbundle: true,
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  deps: {
    neverBundle: ['react', 'react-dom', /^react\//, /^react-dom\//],
  },
  exports: false,
  treeshake: true,
  sourcemap: false,
  clean: true,
});

const worker = defineConfig({
  entry: ['src/image-worker.ts'],
  format: ['esm'],        // `new Worker(url, { type: 'module' })` needs ESM.
  unbundle: false,        // Self-contained: no relative imports to resolve.
  platform: 'browser',
  target: 'es2020',
  treeshake: false,
  dts: false,             // Nothing to type; also avoids an `export {}` stub.
  sourcemap: false,
  exports: false,
  clean: false,
});

export default [library, worker];
