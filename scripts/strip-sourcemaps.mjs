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
