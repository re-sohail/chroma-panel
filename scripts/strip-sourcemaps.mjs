/**
 * Removes sourcemaps from dist, and the comments that point at them.
 *
 * Why this exists rather than just `sourcemap: false` in tsdown.config.ts:
 * that option is set, and tsdown 0.23.0 honours it for the CJS output but
 * still writes `.js.map` beside every ESM file. Six of those references also
 * pointed at maps that were never written. Doing the removal here is
 * deterministic and does not depend on the bundler's option handling.
 *
 * Why remove them at all: they were 629 KB of a 1096 KB unpacked tarball —
 * 57%, across 169 files — with the whole TypeScript source inlined via
 * `sourcesContent`. `dist` is unbundled and unminified, so stepping into the
 * package in devtools still shows real, readable code; only the original
 * TypeScript is lost.
 *
 * The declaration maps go too. They carry no `sourcesContent` and point at
 * `../../src/*.ts`, which `files` has never shipped — so they resolve to
 * nothing in an installed package and are pure weight.
 *
 * Delete this script and flip `sourcemap: true` to put them all back.
 */
import { readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve(import.meta.dirname, '..', 'dist');

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );

const files = walk(DIST);
let removed = 0;
let bytes = 0;
let stripped = 0;

for (const file of files) {
  if (file.endsWith('.map')) {
    bytes += statSync(file).size;
    rmSync(file);
    removed++;
    continue;
  }
  if (!/\.(js|cjs|mjs|d\.ts|d\.cts|d\.mts)$/.test(file)) continue;

  const code = readFileSync(file, 'utf8');
  // Only the trailing annotation, and only at the very end — a
  // "sourceMappingURL" inside a string literal is none of our business.
  const next = code.replace(/\n?\/\/# sourceMappingURL=.*\s*$/, '\n');
  if (next !== code) {
    writeFileSync(file, next);
    stripped++;
  }
}

console.log(
  `strip-sourcemaps: removed ${removed} map files (${(bytes / 1024).toFixed(0)} KB), ` +
  `stripped ${stripped} sourceMappingURL comments`,
);
