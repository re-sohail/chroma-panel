import { defineConfig } from 'tsdown';
import { minifyCss } from './scripts/minify-css.mjs';

/**
 * Strip the stylesheet's comments and whitespace before it is inlined into
 * the JS. src/styles/css.ts stays fully commented for maintainers; consumers
 * receive only the rules.
 */
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
    // One self-contained string literal is rewritten; no mapping to preserve.
    return { code: next, map: null };
  },
};

const library = defineConfig({
  plugins: [minifyInlinedCss],
  entry: [
    'src/index.ts',
    'src/core.ts',
    'src/panel.ts',
    'src/wheel.ts',
    'src/sliders.ts',
    'src/palettes.ts',
    'src/image.ts',
    'src/pencils.ts',
    'src/named-colors.ts',
    'src/contrast.ts',
  ],

  // ESM is canonical; CJS is kept for older webpack/Jest setups.
  format: ['esm', 'cjs'],

  // One output file per source file. This is what makes the module graph
  // shakeable for consumers, and it is also what makes per-file "use client"
  // directives meaningful — bundling would concatenate them away.
  unbundle: true,

  // Not node-specific: no builtin polyfills, portable across Vite, webpack,
  // Next.js and Remix.
  platform: 'neutral',

  // ES2020 keeps the output readable by older bundlers and browsers while
  // still allowing optional chaining and nullish coalescing.
  target: 'es2020',

  dts: true,

  // dependencies/peerDependencies are external by default; the jsx-runtime
  // subpaths are not listed in package.json, so name them explicitly.
  deps: {
    neverBundle: ['react', 'react-dom', /^react\//, /^react-dom\//],
  },

  // The exports map in package.json is written by hand and reviewed; letting
  // the tool rewrite it would churn a file that governs consumer resolution.
  exports: false,

  treeshake: true,
  sourcemap: true,
  clean: true,

  // publint and attw run from the `build` script rather than here, because
  // both need dist/style.css to exist and that file is emitted after tsdown
  // (which cleans dist on every run). The build script orders them correctly
  // and still fails on any packaging mistake.
});

/**
 * The worker is built in its own pass, and every option here differs from the
 * library build for a reason.
 *
 * A worker is fetched by URL, not imported. Unbundled output would emit
 * `import "./image/mmcq.js"`, which breaks the moment a consumer copies the
 * single file and makes Blob-URL instantiation impossible — so it must be
 * self-contained.
 *
 * `treeshake: false` is scoped to this entry and costs nothing: the whole file
 * is one side-effectful listener, and tree-shaking it is what emptied the
 * artifact in the first place.
 */
const worker = defineConfig({
  entry: ['src/image-worker.ts'],
  format: ['esm'],        // `new Worker(url, { type: 'module' })` needs ESM.
  unbundle: false,        // Self-contained: no relative imports to resolve.
  platform: 'browser',
  target: 'es2020',
  treeshake: false,
  dts: false,             // Nothing to type; also avoids an `export {}` stub.
  sourcemap: true,
  exports: false,

  // MANDATORY. The default `clean: true` would wipe dist/ and delete the
  // entire library build that ran before this one.
  clean: false,
});

export default [library, worker];
