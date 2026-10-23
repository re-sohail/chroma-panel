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

  it('honours injectStyles={false} for every chunk of an inline panel', async () => {
    const doc = await renderIsolated(
      <ChromaPanel modes={['wheel', 'sliders', 'image']} injectStyles={false} />,
    );
    expect(doc.querySelector('style[data-chroma-panel]')).toBeNull();
  });
});

const chunkIds = (doc: Document): string[] =>
  [...doc.querySelectorAll('style[data-chroma-panel]')]
    .map((style) => style.getAttribute('data-chroma-panel')!)
    .sort();

describe('a panel injects only the styles it renders', () => {
  it('a palettes-only panel gets the shell and its own chunk, nothing else', async () => {
    const doc = await renderIsolated(<ChromaPanel modes={['palettes']} />);
    expect(chunkIds(doc)).toEqual(['v4', 'v4-card', 'v4-palette']);
  });

  it('keeps visually hidden inputs hidden whatever modes are loaded', async () => {
    for (const modes of [['wheel'], ['sliders'], ['classic'], ['image']]) {
      const doc = await renderIsolated(<ChromaPanel modes={modes} />);
      const hidden = Array.from(doc.querySelectorAll<HTMLElement>('.cp-visually-hidden'));
      expect(hidden.length, `${modes[0]}: nothing to check`).toBeGreaterThan(0);
      for (const el of hidden) {
        const box = el.getBoundingClientRect();
        expect(Math.max(box.width, box.height), `${modes[0]}: a hidden control is visible`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('a wheel-only panel adds the disc, field and slider chunks', async () => {
    const doc = await renderIsolated(<ChromaPanel modes={['wheel']} />);
    expect(chunkIds(doc)).toEqual(['v4', 'v4-disc', 'v4-field', 'v4-slider']);
    const disc = doc.querySelector<HTMLElement>('.cp-disc')!;
    expect(doc.defaultView!.getComputedStyle(disc).borderRadius).toBe('50%');
  });

  it('an image-only panel adds the image chunk', async () => {
    const doc = await renderIsolated(<ChromaPanel modes={['image']} />);
    expect(chunkIds(doc)).toEqual(['v4', 'v4-image']);
    const dropzone = doc.querySelector<HTMLElement>('.cp-dropzone')!;
    expect(doc.defaultView!.getComputedStyle(dropzone).borderStyle).toBe('dashed');
  });

  it('a closed ColorInput adds the trigger and popover chunks', async () => {
    const doc = await renderIsolated(<ColorInput />);
    expect(chunkIds(doc)).toEqual(['v4', 'v4-popover', 'v4-trigger']);
  });
});
