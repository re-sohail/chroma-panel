import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { minifyCss } from './minify-css.mjs';

const source = readFileSync(resolve('src/styles/css.ts'), 'utf8');

const match = source.match(/export const css: string = `([\s\S]*?)`;/);
if (match === null) {
  console.error('emit-css: could not find the css template literal in src/styles/css.ts');
  process.exit(1);
}

const raw = match[1].replace(/\\`/g, '`').replace(/\\\$/g, '$');
const css = minifyCss(raw);

const out = resolve('dist/style.css');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `/* chroma-panel — see https://www.npmjs.com/package/chroma-panel */\n${css}\n`, 'utf8');

console.log(`emit-css: wrote dist/style.css (${raw.length} -> ${css.length} bytes)`);
