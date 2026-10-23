import { describe, expect, it } from 'vitest';
import { minifyCss } from '../scripts/minify-css.mjs';

describe('minifyCss', () => {
  it('keeps the descendant space before a pseudo-class', () => {
    expect(minifyCss(':where(.dark) :is(.a, .b) { color: red; }')).toBe(':where(.dark) :is(.a,.b){color:red}');
    expect(minifyCss('.a ::selection { color: red }')).toBe('.a ::selection{color:red}');
  });

  it('copies quoted strings untouched', () => {
    expect(minifyCss('[style*="color-scheme: dark"] { content: "a  b" }'))
      .toBe('[style*="color-scheme: dark"]{content:"a  b"}');
  });

  it('drops comments and collapses whitespace', () => {
    expect(minifyCss('/* x */ @media (pointer: coarse) {\n  .a > .b { top: 0; }\n}'))
      .toBe('@media (pointer:coarse){.a>.b{top:0}}');
  });
});
