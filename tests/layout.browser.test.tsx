import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel, ColorInput, defaultPalettes, defaultPencils } from '../src/index';

const DESKTOP = { width: 1280, height: 900 };
const ALL_MODES = ['wheel', 'sliders', 'palettes', 'image', 'pencils'] as const;

async function waitFor<T extends Element>(selector: string, timeout = 3000): Promise<T> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = document.querySelector<T>(selector);
    if (el !== null) return el;
    if (Date.now() > deadline) throw new Error(`timed out waiting for "${selector}"`);
    await new Promise((r) => requestAnimationFrame(r));
  }
}

const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 60));

function panel(extra: Record<string, unknown> = {}): React.ReactElement {
  return (
    <ChromaPanel
      defaultValue="#3366cc"
      modes={[...ALL_MODES]}
      palettes={defaultPalettes()}
      pencils={defaultPencils()}
      {...extra}
    />
  );
}

async function acrossModes<T>(
  scope: string,
  measure: () => T,
): Promise<Array<{ mode: string; value: T }>> {
  const out: Array<{ mode: string; value: T }> = [];
  for (const mode of ALL_MODES) {
    const tab = document.querySelector<HTMLElement>(`${scope} [role="tab"][data-cp-mode="${mode}"]`)
      ?? Array.from(document.querySelectorAll<HTMLElement>(`${scope} [role="tab"]`))
        .find((t) => t.getAttribute('aria-controls')?.endsWith(`-panel-${mode}`) === true);
    if (tab === undefined || tab === null) throw new Error(`no tab for mode "${mode}"`);
    tab.click();
    await settle();
    out.push({ mode, value: measure() });
  }
  return out;
}

afterEach(async () => {
  await page.viewport(DESKTOP.width, DESKTOP.height);
});

describe('the panel is the same size in every mode', () => {
  for (const [w, h] of [[1280, 900], [390, 844], [360, 640]] as const) {
    it(`holds one panel height across all five modes at ${w}x${h}`, async () => {
      await page.viewport(w, h);
      render(panel({ showTitleBar: false }));
      await waitFor('.cp-panel-host');

      const heights = await acrossModes('.cp-root', () =>
        Math.round(document.querySelector('.cp-panel-host')!.getBoundingClientRect().height));

      const unique = new Set(heights.map((r) => r.value));
      expect(
        unique.size,
        `panel height varies by mode: ${heights.map((r) => `${r.mode}=${r.value}`).join(' ')}`,
      ).toBe(1);
    });
  }

  it('keeps the whole panel one size, not just the tab panel', async () => {
    render(panel());
    await waitFor('.cp-root');

    const boxes = await acrossModes('.cp-root', () => {
      const r = document.querySelector('.cp-root')!.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    });

    expect(new Set(boxes.map((b) => b.value)).size,
      `panel box varies: ${boxes.map((b) => `${b.mode}=${b.value}`).join(' ')}`).toBe(1);
  });

  it('every mode fits the reserved height without a scrollbar', async () => {
    render(panel());
    const host = await waitFor<HTMLElement>('.cp-panel-host');

    const overflow = await acrossModes('.cp-root', () => host.scrollHeight - host.clientHeight);

    for (const { mode, value } of overflow) {
      if (mode === 'palettes') continue;
      expect(value, `"${mode}" overflows --cp-panel-h by ${value}px`).toBeLessThanOrEqual(1);
    }
  });

  it('does not reserve a fixed height when there is only one mode', async () => {
    render(<ChromaPanel defaultValue="#3366cc" modes={['sliders']} showTitleBar={false} />);
    const host = await waitFor<HTMLElement>('.cp-panel-host');
    await settle();

    expect(document.querySelector('.cp-root')!.getAttribute('data-cp-modes')).toBe('1');
    expect(host.getBoundingClientRect().height).toBeLessThan(332);
  });
});

describe('the bottom sheet stays put', () => {
  it('does not move its top edge when the mode changes', async () => {
    await page.viewport(390, 844);
    render(<ColorInput defaultValue="#3366cc" modes={[...ALL_MODES]}
      palettes={defaultPalettes()} pencils={defaultPencils()} />);
    (await waitFor<HTMLButtonElement>('.cp-trigger')).click();
    await waitFor('.cp-sheet');
    await settle();

    const tops = await acrossModes('.cp-sheet', () =>
      Math.round(document.querySelector('.cp-sheet')!.getBoundingClientRect().top));

    expect(new Set(tops.map((t) => t.value)).size,
      `sheet top edge moves: ${tops.map((t) => `${t.mode}=${t.value}`).join(' ')}`).toBe(1);
  });
});

describe('scrolling', () => {
  it('scrolls the palette list on a phone', async () => {
    await page.viewport(360, 640);
    render(<ColorInput defaultValue="#3366cc" modes={[...ALL_MODES]}
      palettes={defaultPalettes()} pencils={defaultPencils()} />);
    (await waitFor<HTMLButtonElement>('.cp-trigger')).click();
    const sheet = await waitFor<HTMLElement>('.cp-sheet');
    await settle();

    await acrossModes('.cp-sheet', () => null);   // ends on pencils
    const palettesTab = Array.from(sheet.querySelectorAll<HTMLElement>('[role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-palettes') === true)!;
    palettesTab.click();
    await settle();

    const host = sheet.querySelector<HTMLElement>('.cp-panel-host')!;
    expect(host.scrollHeight, 'nothing to scroll — test is not exercising the bug')
      .toBeGreaterThan(host.clientHeight + 1);

    host.scrollTop = 120;
    await settle();
    expect(host.scrollTop, 'the panel refused to scroll').toBeGreaterThan(0);
  });

  it('has exactly one scroll container inside the panel', async () => {
    await page.viewport(360, 640);
    render(panel());
    await waitFor('.cp-panel-host');
    await settle();

    const ports = await acrossModes('.cp-root', () =>
      Array.from(document.querySelectorAll<HTMLElement>('.cp-root *'))
        .filter((el) => {
          const overflow = getComputedStyle(el).overflowY;
          return overflow === 'auto' || overflow === 'scroll';
        })
        .map((el) => el.className));

    for (const { mode, value } of ports) {
      expect(value, `"${mode}" has ${value.length} vertical scroll ports`).toHaveLength(1);
      expect(value[0]).toContain('cp-panel-host');
    }
  });
});

describe('the sheet passes its height constraint all the way down', () => {
  for (const [w, h] of [[320, 568], [320, 480], [360, 640]] as const) {
    it(`keeps the footer inside the sheet at ${w}x${h}`, async () => {
      await page.viewport(w, h);
      render(<ColorInput defaultValue="#3366cc" modes={[...ALL_MODES]}
        palettes={defaultPalettes()} pencils={defaultPencils()} />);
      (await waitFor<HTMLButtonElement>('.cp-trigger')).click();
      const sheet = await waitFor<HTMLElement>('.cp-sheet');
      await settle();

      const seen = await acrossModes('.cp-sheet', () => {
        const footer = sheet.querySelector('.cp-footer')!.getBoundingClientRect();
        return Math.round(footer.bottom);
      });

      const sheetBottom = Math.round(sheet.getBoundingClientRect().bottom);
      for (const { mode, value } of seen) {
        expect(value, `"${mode}" pushes the footer past the sheet edge`)
          .toBeLessThanOrEqual(sheetBottom + 1);
        expect(value, `"${mode}" pushes the footer off screen`)
          .toBeLessThanOrEqual(window.innerHeight + 1);
      }
    });
  }
});

const PNG_8x4 =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAIAAAA8r+mnAAAAFElEQVR4nGP4z8AARwwN/xGIeh' +
  'IAmo0n4TFWVi0AAAAASUVORK5CYII=';

function pngFile(name = 'fixture.png'): File {
  const binary = atob(PNG_8x4);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], name, { type: 'image/png' });
}

function attach(input: HTMLInputElement, file: File): void {
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('slider thumbs are not clipped by the scroll port', () => {
  it('keeps every thumb inside the port at both extremes', async () => {
    render(panel({ defaultValue: '#ff0000' }));
    const host = await waitFor<HTMLElement>('.cp-panel-host');

    const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-sliders') === true)!;
    tab.click();
    await settle();

    const port = host.getBoundingClientRect();
    const thumbs = Array.from(host.querySelectorAll<HTMLElement>('.cp-thumb'));
    expect(thumbs.length, 'no thumbs found — test is not exercising anything')
      .toBeGreaterThan(0);

    for (const thumb of thumbs) {
      const box = thumb.getBoundingClientRect();
      expect(Math.round(box.right), 'thumb clipped on the right')
        .toBeLessThanOrEqual(Math.round(port.right));
      expect(Math.round(box.left), 'thumb clipped on the left')
        .toBeGreaterThanOrEqual(Math.round(port.left));
    }

    expect(host.scrollWidth, 'the panel scrolls horizontally').toBe(host.clientWidth);
  });
});

describe('scroll fades', () => {
  it('marks only the edge that has more content, and clears at both ends', async () => {
    render(panel());
    const host = await waitFor<HTMLElement>('.cp-panel-host');

    const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-palettes') === true)!;
    tab.click();
    await settle();
    expect(host.scrollHeight, 'nothing to scroll — test is not exercising the fade')
      .toBeGreaterThan(host.clientHeight + 1);

    expect(host.getAttribute('data-cp-fade'), 'at the top').toBe('end');

    host.scrollTop = Math.round((host.scrollHeight - host.clientHeight) / 2);
    await settle();
    expect(host.getAttribute('data-cp-fade'), 'in the middle').toBe('both');

    host.scrollTop = host.scrollHeight;
    await settle();
    expect(host.getAttribute('data-cp-fade'), 'at the bottom').toBe('start');

    host.scrollTop = 0;
    await settle();
    expect(host.getAttribute('data-cp-fade'), 'back at the top').toBe('end');
  });

  it('applies no mask at all in a mode that fits', async () => {
    render(panel());
    const host = await waitFor<HTMLElement>('.cp-panel-host');
    await settle();

    const seen = await acrossModes('.cp-root', () => ({
      fade: host.getAttribute('data-cp-fade'),
      overflows: host.scrollHeight > host.clientHeight + 1,
    }));

    for (const { mode, value } of seen) {
      if (value.overflows) continue;
      expect(value.fade, `"${mode}" fits but still carries a fade`).toBeNull();
    }
  });
});

describe('the image mode', () => {
  it('hides the native file control behind its own drop zone', async () => {
    render(panel());
    await waitFor('.cp-panel-host');

    const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-image') === true)!;
    tab.click();
    await settle();

    const input = document.querySelector<HTMLInputElement>('.cp-panel-host input[type="file"]')!;
    const zone = document.querySelector<HTMLLabelElement>('.cp-dropzone')!;

    expect(zone, 'no drop zone rendered').not.toBeNull();
    expect(zone.htmlFor, 'the label does not drive the input').toBe(input.id);
    expect(Math.round(input.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    expect(getComputedStyle(input).display, 'display:none breaks Safari autofill')
      .not.toBe('none');
  });

  it('shows a large preview with a working remove control', async () => {
    render(panel());
    await waitFor('.cp-panel-host');
    const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-image') === true)!;
    tab.click();
    await settle();

    const input = document.querySelector<HTMLInputElement>('.cp-panel-host input[type="file"]')!;
    attach(input, pngFile());

    const preview = await waitFor<HTMLElement>('.cp-image-preview');
    const img = preview.querySelector<HTMLImageElement>('img')!;
    if (!img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; });
    await settle();

    expect(Math.round(preview.getBoundingClientRect().height)).toBeGreaterThan(90);
    expect(getComputedStyle(img).objectFit).toBe('contain');

    // The preview replaces the drop zone, which was the input's <label>.
    expect(document.querySelector(`label[for="${input.id}"]`)).toBeNull();
    expect(input.getAttribute('aria-label'), 'file input lost its accessible name')
      .toBe('Choose a different image');
    expect(input.tabIndex, 'an invisible input stayed in the tab order').toBe(-1);

    const remove = document.querySelector<HTMLButtonElement>('.cp-image-remove')!;
    expect(remove, 'no remove control').not.toBeNull();
    expect(remove.getAttribute('aria-label')).toBe('Remove image');

    remove.click();
    await settle();
    expect(document.querySelector('.cp-image-preview'), 'preview survived remove').toBeNull();
    expect(document.querySelector('.cp-dropzone'), 'drop zone did not come back').not.toBeNull();
    expect(input.value, 're-picking the same file would fire no change event').toBe('');
    // Back to the visible label, which names the input by the text on screen.
    expect(document.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    expect(input.hasAttribute('aria-label')).toBe(false);
    expect(input.tabIndex).toBe(0);
  });

  it('keeps the image when the popover closes and reopens', async () => {
    // The popover unmounts the whole panel on close, so ImagePanel's state died
    // with it AND its unmount cleanup revoked the object URL -- meaning even a
    // cached src would have pointed at a dead blob.
    render(
      <ColorInput modes={[...ALL_MODES]} palettes={defaultPalettes()} pencils={defaultPencils()} />,
    );
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');

    const openOnImage = async (): Promise<void> => {
      trigger.click();
      await waitFor('.cp-popover');
      await settle();
      const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-popover [role="tab"]'))
        .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-image') === true)!;
      tab.click();
      await settle();
    };
    const loaded = async (): Promise<HTMLImageElement> => {
      const img = (await waitFor<HTMLElement>('.cp-image-preview')).querySelector('img')!;
      if (!img.complete) await new Promise((r) => { img.onload = r; img.onerror = r; });
      await settle();
      return img;
    };

    await openOnImage();
    attach(document.querySelector<HTMLInputElement>('.cp-popover input[type="file"]')!, pngFile());
    await loaded();
    const before = document.querySelectorAll('.cp-popover .cp-swatch-grid .cp-swatch').length;
    expect(before, 'nothing was extracted — test is not exercising the bug')
      .toBeGreaterThan(0);

    trigger.click();
    await settle();
    expect(document.querySelector('.cp-popover'), 'the popover did not close').toBeNull();

    await openOnImage();
    expect(document.querySelector('.cp-image-preview'), 'the image was discarded on close')
      .not.toBeNull();
    expect(document.querySelectorAll('.cp-popover .cp-swatch-grid .cp-swatch'))
      .toHaveLength(before);
    const img = await loaded();
    expect(img.naturalWidth, 'the object URL was revoked, so the img is broken')
      .toBeGreaterThan(0);
  });

  it('forgets the image once you remove it, across a close', async () => {
    render(<ColorInput modes={['image']} />);
    const trigger = await waitFor<HTMLButtonElement>('.cp-trigger');

    const open = async (): Promise<void> => {
      trigger.click();
      await waitFor('.cp-popover');
      await settle();
    };

    await open();
    attach(document.querySelector<HTMLInputElement>('.cp-popover input[type="file"]')!, pngFile());
    await waitFor('.cp-image-preview');
    await settle();

    document.querySelector<HTMLButtonElement>('.cp-image-remove')!.click();
    await settle();
    trigger.click();
    await settle();

    await open();
    expect(document.querySelector('.cp-image-preview'), 'a removed image came back').toBeNull();
    expect(document.querySelector('.cp-dropzone')).not.toBeNull();
  });

  it('accepts a dropped file', async () => {
    render(panel());
    await waitFor('.cp-panel-host');
    const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-image') === true)!;
    tab.click();
    await settle();

    const target = document.querySelector<HTMLElement>('.cp-panel-host .cp-panel')!;
    const transfer = new DataTransfer();
    transfer.items.add(pngFile());
    target.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));

    await waitFor('.cp-image-preview');
    expect(document.querySelector('.cp-image-preview')).not.toBeNull();
  });
});

describe('control heights agree', () => {
  for (const coarse of [false, true]) {
    it(`draws the tab bar and a text input at one height (${coarse ? 'touch' : 'mouse'})`, async () => {
      if (coarse) await page.viewport(390, 844);
      render(panel());
      await waitFor('.cp-panel-host');

      const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
        .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-palettes') === true)!;
      tab.click();
      await settle();

      const bar = document.querySelector<HTMLElement>('.cp-toolbar')!;
      const input = document.querySelector<HTMLElement>('.cp-panel-host .cp-input')!;

      const barH = bar.getBoundingClientRect().height;
      const inputH = input.getBoundingClientRect().height;
      expect(inputH, `tab bar ${barH}px vs input ${inputH}px`).toBe(barH);

      const preview = document.querySelector<HTMLElement>('.cp-preview')!;
      expect(preview.getBoundingClientRect().height)
        .toBe(preview.getBoundingClientRect().width);
    });
  }
});

describe('the popover never exceeds the viewport', () => {
  it('stays on screen and keeps the footer reachable in a short viewport', async () => {
    await page.viewport(900, 420);
    render(<ColorInput defaultValue="#3366cc" modes={[...ALL_MODES]}
      palettes={defaultPalettes()} pencils={defaultPencils()} />);
    (await waitFor<HTMLButtonElement>('.cp-trigger')).click();
    await waitFor('.cp-popover');
    await settle();

    const seen = await acrossModes('.cp-popover', () => {
      const box = document.querySelector('.cp-popover')!.getBoundingClientRect();
      const footer = document.querySelector('.cp-popover .cp-footer')!.getBoundingClientRect();
      return {
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        footerBottom: Math.round(footer.bottom),
      };
    });

    for (const { mode, value } of seen) {
      expect(value.top, `"${mode}" starts above the viewport`).toBeGreaterThanOrEqual(0);
      expect(value.bottom, `"${mode}" runs past the bottom edge`).toBeLessThanOrEqual(420);
      expect(value.footerBottom, `"${mode}" hides its footer`).toBeLessThanOrEqual(420);
    }
  });
});

describe('the selection ring', () => {
  it('is never clipped by the scroll port', async () => {
    // outline is drawn outside the border box and does NOT contribute to
    // scrollable overflow, so a swatch flush with the port's edge loses its
    // ring -- and overflow-y: auto clips even when nothing needs to scroll.
    render(panel());
    const host = await waitFor<HTMLElement>('.cp-panel-host');

    const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-palettes') === true)!;
    tab.click();
    await settle();

    const swatches = Array.from(
      document.querySelectorAll<HTMLElement>('.cp-swatch-grid:not([data-cp-variant="mosaic"]) .cp-swatch'),
    );
    expect(swatches.length, 'no spaced swatches — test is not exercising anything')
      .toBeGreaterThan(0);

    // Scroll to the very end: the last row sits flush against the port's edge,
    // which is where an outward ring gets cut.
    host.scrollTop = host.scrollHeight;
    await settle();
    swatches[swatches.length - 1]!.click();
    await settle();

    const selected = document.querySelector<HTMLElement>('.cp-swatch[aria-pressed="true"]')!;
    const style = getComputedStyle(selected);
    const reach = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    expect(reach, 'the ring is drawn inside — this test assumes an outward ring')
      .toBeGreaterThan(0);

    const grid = selected.closest('.cp-swatch-grid') as HTMLElement;
    const reserved = parseFloat(getComputedStyle(grid).paddingBottom);
    expect(reserved, `ring reaches ${reach}px past the swatch but only ${reserved}px is reserved`)
      .toBeGreaterThanOrEqual(reach);

    const box = selected.getBoundingClientRect();
    const port = host.getBoundingClientRect();
    expect(box.bottom + reach, 'the ring is cut off at the bottom edge')
      .toBeLessThanOrEqual(port.bottom + 0.5);
  });
});

describe('the footer', () => {
  it('shows the current color once, not twice', async () => {
    render(panel());
    await waitFor('.cp-panel-host');

    const tab = Array.from(document.querySelectorAll<HTMLElement>('.cp-root [role="tab"]'))
      .find((t) => t.getAttribute('aria-controls')?.endsWith('-panel-pencils') === true)!;
    tab.click();
    await settle();

    const swatches = document.querySelectorAll<HTMLElement>('.cp-panel-host button');
    swatches[25]!.click();
    await settle();

    const preview = getComputedStyle(document.querySelector('.cp-preview')!)
      .getPropertyValue('--cp-preview-color').trim();
    const rendered = Array.from(document.querySelectorAll<HTMLElement>('.cp-recents .cp-swatch'))
      .map((el) => el.style.getPropertyValue('--cp-swatch-color').trim().toLowerCase());

    expect(preview, 'the preview is not painted').not.toBe('');
    expect(rendered, 'the current color is repeated in the history')
      .not.toContain('#002875');

    swatches[40]!.click();
    await settle();
    const after = Array.from(document.querySelectorAll<HTMLElement>('.cp-recents .cp-swatch'))
      .map((el) => el.style.getPropertyValue('--cp-swatch-color').trim().toLowerCase());
    expect(after).toContain('#002875');
  });

  it('fades the history row on the side that has more swatches', async () => {
    const recents = [
      '#111111', '#222222', '#333333', '#444444', '#555555',
      '#666666', '#777777', '#888888', '#999999', '#aaaaaa',
    ];
    render(panel({ recentColors: recents, onRecentColorsChange: () => {} }));
    const row = await waitFor<HTMLElement>('.cp-recents');
    await settle();

    expect(row.scrollWidth, 'nothing overflows — test is not exercising the fade')
      .toBeGreaterThan(row.clientWidth);

    expect(row.getAttribute('data-cp-fade'), 'at the left end').toBe('end');

    row.scrollLeft = Math.round((row.scrollWidth - row.clientWidth) / 2);
    await settle();
    expect(row.getAttribute('data-cp-fade'), 'mid-scroll').toBe('both');

    row.scrollLeft = row.scrollWidth;
    await settle();
    expect(row.getAttribute('data-cp-fade'), 'at the right end').toBe('start');
  });

  it('applies no mask to a history row that fits', async () => {
    render(panel({ recentColors: ['#111111', '#222222'], onRecentColorsChange: () => {} }));
    const row = await waitFor<HTMLElement>('.cp-recents');
    await settle();

    expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth + 1);
    expect(row.getAttribute('data-cp-fade'), 'a row that fits should carry no fade').toBeNull();
  });

  it('lets every recent color be reached rather than clipping them', async () => {
    const recents = [
      '#111111', '#222222', '#333333', '#444444', '#555555',
      '#666666', '#777777', '#888888', '#999999', '#aaaaaa',
    ];
    render(panel({ recentColors: recents, onRecentColorsChange: () => {} }));
    await waitFor('.cp-recents');
    await settle();

    const row = document.querySelector<HTMLElement>('.cp-recents')!;
    expect(row.querySelectorAll('li')).toHaveLength(recents.length);
    expect(getComputedStyle(row).overflowX).toBe('auto');
    expect(row.scrollWidth, 'nothing to scroll — test is not exercising the bug')
      .toBeGreaterThan(row.clientWidth);

    row.scrollLeft = row.scrollWidth;
    await settle();
    expect(row.scrollLeft, 'the row clips instead of scrolling').toBeGreaterThan(0);
  });
});
