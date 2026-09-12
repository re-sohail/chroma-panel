import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ColorInput, ChromaPanel } from '../src/index';

/**
 * Renders into a FRESH iframe document.
 *
 * The main document is shared across tests, and injectStyles is idempotent per
 * root -- so once anything has mounted a panel, a trigger-only assertion in
 * that document passes whether or not ColorInput injects anything itself.
 * An iframe gives each case its own root and its own answer.
 */
async function renderIsolated(node: React.ReactElement): Promise<Document> {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'width:400px;height:300px;border:0';
  document.body.appendChild(frame);
  await new Promise((r) => {
    if (frame.contentDocument?.readyState === 'complete') r(null);
    else frame.addEventListener('load', () => r(null));
  });

  const doc = frame.contentDocument!;
  const host = doc.createElement('div');
  doc.body.appendChild(host);

  await act(async () => {
    createRoot(host).render(node);
  });
  await new Promise((r) => setTimeout(r, 120));
  return doc;
}

describe('the stylesheet reaches the trigger', () => {
  it('styles a closed ColorInput, with no panel ever mounted', async () => {
    const doc = await renderIsolated(<ColorInput />);

    expect(doc.querySelector('.cp-popover'), 'a panel mounted — not an isolated test')
      .toBeNull();
    expect(
      doc.querySelector('style[data-chroma-panel]'),
      'no stylesheet: the trigger renders as a bare UA button until first click',
    ).not.toBeNull();

    const trigger = doc.querySelector<HTMLElement>('.cp-trigger')!;
    const box = trigger.getBoundingClientRect();
    // Unstyled, an empty button collapses to about 16x6 in Chrome.
    expect(Math.round(box.width)).toBeGreaterThanOrEqual(30);
    expect(Math.round(box.height)).toBeGreaterThanOrEqual(20);
    expect(doc.defaultView!.getComputedStyle(trigger).backgroundColor)
      .toBe('rgba(0, 0, 0, 0)');
  });

  it('still styles an inline ChromaPanel on its own', async () => {
    const doc = await renderIsolated(<ChromaPanel modes={['wheel']} />);
    expect(doc.querySelector('style[data-chroma-panel]')).not.toBeNull();
    const host = doc.querySelector<HTMLElement>('.cp-panel-host')!;
    expect(Math.round(host.getBoundingClientRect().height)).toBeGreaterThan(100);
  });

  it('honours injectStyles={false} on a closed ColorInput', async () => {
    const doc = await renderIsolated(<ColorInput injectStyles={false} />);
    expect(doc.querySelector('style[data-chroma-panel]')).toBeNull();
  });
});
