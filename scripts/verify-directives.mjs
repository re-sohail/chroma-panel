/**
 * Assert that "use client" survived the build, in BOTH module formats.
 *
 * Rollup-family bundlers strip module-level directives when they concatenate
 * modules, and directive preservation has regressed more than once upstream.
 * A silent regression here is invisible until a user files a Next.js bug, so
 * it is checked on every build rather than trusted.
 */
import { readFileSync, existsSync } from 'node:fs';

// Files that must carry the directive: anything using hooks, refs or the DOM.
const REQUIRED = [
  'index',
  'components/ChromaPanel',
  'components/ColorInput',
  'components/Popover',
  'components/ModeToolbar',
  'components/PanelFooter',
  'primitives/ColorDisc',
  'primitives/ColorArea',
  'primitives/ChannelSlider',
  'primitives/ColorField',
  'primitives/NumberField',
  'primitives/AxisInput',
  'primitives/SwatchGrid',
  'primitives/useEyedropper',
  'core/context',
  'core/useColorStore',
  'core/usePointerDrag',
];

const DIRECTIVE = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*['"]use client['"]/;

const failures = [];
let checked = 0;

for (const base of REQUIRED) {
  for (const ext of ['js', 'cjs']) {
    const file = `dist/${base}.${ext}`;
    if (!existsSync(file)) {
      failures.push(`${file} is missing from the build`);
      continue;
    }
    checked++;
    if (!DIRECTIVE.test(readFileSync(file, 'utf8'))) {
      failures.push(`${file} lost its "use client" directive`);
    }
  }
}

if (failures.length > 0) {
  console.error('verify-directives: FAILED\n  ' + failures.join('\n  '));
  process.exit(1);
}

console.log(`verify-directives: ok (${checked} files carry "use client")`);
