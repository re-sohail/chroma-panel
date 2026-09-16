import { describe, expect, it } from 'vitest';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import * as React from 'react';
import { ChromaPanel, ColorInput, defaultPalettes, defaultPencils } from '../src/index';

describe('server rendering', () => {
  it('has no DOM available, confirming the environment is honest', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  it('renders the panel without throwing', () => {
    const html = renderToString(<ChromaPanel defaultValue="#3366cc" />);
    expect(html).toContain('cp-root');
    expect(html).toContain('cp-toolbar');
  });

  it('renders the trigger without throwing', () => {
    const html = renderToString(<ColorInput defaultValue="#3366cc" name="brand" />);
    expect(html).toContain('cp-trigger');
    expect(html).not.toContain('cp-popover');
  });

  it('renders every mode server-side', () => {
    for (const mode of ['wheel', 'sliders', 'palettes', 'image', 'pencils'] as const) {
      const html = renderToStaticMarkup(
        <ChromaPanel
          defaultValue="#3366cc"
          modes={[mode]}
          defaultMode={mode}
          palettes={defaultPalettes()}
          pencils={defaultPencils()}
        />,
      );
      expect(html, mode).toContain('cp-root');
    }
  });

  it('emits the color as CSS custom properties, so the first paint is correct', () => {
    const html = renderToStaticMarkup(<ChromaPanel defaultValue="#ff0000" showTitleBar={false} />);
    expect(html).toContain('--cp-h:0');
    expect(html).toContain('--cp-s:100%');
    expect(html).toContain('--cp-v:100%');
  });

  it('serialises the form value for a no-JS submit', () => {
    const html = renderToStaticMarkup(<ColorInput defaultValue="#3366cc" name="brand" format="hex" />);
    expect(html).toContain('name="brand"');
    expect(html).toContain('value="#3366cc"');
  });

  it('does not inject styles on the server', () => {
    const html = renderToStaticMarkup(<ChromaPanel defaultValue="#fff" />);
    expect(html).not.toContain('<style');
  });

  it('falls back to white for an unparseable value instead of crashing', () => {
    const html = renderToStaticMarkup(<ChromaPanel defaultValue="not-a-color" />);
    expect(html).toContain('cp-root');
  });
});
