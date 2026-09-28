import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ColorInput } from '../src/index';

// Its own file on purpose: each browser test file gets a fresh page, so this is
// the first picker in the document and no stylesheet exists before it opens.
describe('a popover opened on first render', () => {
  it('sits under its trigger, not pinned to the page margin', async () => {
    // Regression: the popover styles were injected after Popover measured
    // itself, so an unstyled, full-width .cp-popover was placed at the margin.
    expect(document.querySelector('style[data-chroma-panel]'), 'not a fresh page').toBeNull();

    render(
      <div style={{ paddingLeft: 200, paddingTop: 20 }}>
        <ColorInput defaultValue="#3366cc" defaultOpen />
      </div>,
    );

    const deadline = Date.now() + 3000;
    let popover: HTMLElement | null = null;
    while (Date.now() < deadline) {
      popover = document.querySelector<HTMLElement>('.cp-popover');
      if (popover !== null && popover.style.visibility === 'visible') break;
      await new Promise((r) => requestAnimationFrame(r));
    }
    expect(popover, 'popover never became visible').not.toBeNull();

    const trigger = document.querySelector<HTMLElement>('.cp-trigger')!.getBoundingClientRect();
    const box = popover!.getBoundingClientRect();
    expect(getComputedStyle(popover!).position).toBe('absolute');
    expect(Math.round(box.width)).toBeLessThan(500);
    expect(Math.abs(box.left - trigger.left)).toBeLessThan(2);
  });
});
