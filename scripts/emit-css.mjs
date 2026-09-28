import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { minifyCss } from './minify-css.mjs';

const source = readFileSync(resolve('src/styles/css.ts'), 'utf8');

// The runtime injects the stylesheet in chunks (the shell plus one per component);
// style.css is for apps that turn injection off, so it carries every chunk.
const chunks = [...source.matchAll(/export const (\w+): string = `([\s\S]*?)`;/g)];
if (chunks.length === 0 || chunks[0][1] !== 'css') {
  console.error('emit-css: expected `css` as the first template literal in src/styles/css.ts');
  process.exit(1);
}

const raw = chunks
  .map(([, , body]) => body.replace(/\\`/g, '`').replace(/\\\$/g, '$'))
  .join('\n');
const css = minifyCss(raw);

const out = resolve('dist/style.css');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `/* chroma-panel — see https://www.npmjs.com/package/chroma-panel */\n${css}\n`, 'utf8');

console.log(`emit-css: wrote dist/style.css (${raw.length} -> ${css.length} bytes)`);
