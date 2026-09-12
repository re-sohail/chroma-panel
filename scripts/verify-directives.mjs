import { readFileSync, existsSync } from 'node:fs';

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
