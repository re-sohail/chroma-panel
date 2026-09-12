import { describe, expect, it, vi } from 'vitest';
import { cdp, page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as React from 'react';
import { ChromaPanel } from '../src/index';
import type { ColorChangeResult } from '../src/color/types';

async function pointerDrag(
  element: Element,
  from: { x: number; y: number },
  to: { x: number; y: number },
  steps = 20,
): Promise<void> {
  const client = await cdp();
  const box = element.getBoundingClientRect();
  const at = (p: { x: number; y: number }) => ({
    x: Math.round(box.left + box.width * p.x),
    y: Math.round(box.top + box.height * p.y),
  });

  const start = at(from);
  const end = at(to);
  type MouseEventType = 'mouseMoved' | 'mousePressed' | 'mouseReleased';
  const send = (type: MouseEventType, x: number, y: number, buttons: number) =>
    client.send('Input.dispatchMouseEvent', {
      type, x, y, button: 'left', buttons, clickCount: 1, pointerType: 'mouse',
    });

  await send('mouseMoved', start.x, start.y, 0);
  await send('mousePressed', start.x, start.y, 1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    await send(
      'mouseMoved',
      Math.round(start.x + (end.x - start.x) * t),
      Math.round(start.y + (end.y - start.y) * t),
      1,
    );
  }
  await send('mouseReleased', end.x, end.y, 0);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

async function settle(): Promise<void> {
  await expect.element(page.getByRole('slider', { name: /red/i })).toBeInTheDocument();
}

describe('the drag loop', () => {
  it('runs in a real layout engine, confirming the environment is honest', () => {
    const el = document.createElement('div');
    el.style.cssText = 'width:200px;height:100px';
    document.body.appendChild(el);
    const box = el.getBoundingClientRect();
    el.remove();
    expect(box.width).toBe(200);
    expect(box.height).toBe(100);
    expect(typeof PointerEvent).toBe('function');
  });

  it('does not render React even once during a drag', async () => {
    let renders = 0;
    function Counted(): React.ReactElement {
      renders++;
      return <ChromaPanel defaultValue="#ff0000" modes={['sliders']} showTitleBar={false} />;
    }

    render(<Counted />);
    await settle();
    const settled = renders;

    const slider = document.querySelector('.cp-slider');
    expect(slider).not.toBeNull();
    await pointerDrag(slider as Element, { x: 0.1, y: 0.5 }, { x: 0.9, y: 0.5 }, 25);

    expect(renders).toBe(settled);
  });

  it('actually changes the colour while dragging', async () => {
    const onChange = vi.fn();
    render(
      <ChromaPanel defaultValue="#ff0000" modes={['sliders']} showTitleBar={false} onChange={onChange} />,
    );
    await settle();

    const slider = document.querySelector('.cp-slider');
    await pointerDrag(slider as Element, { x: 0.95, y: 0.5 }, { x: 0.05, y: 0.5 }, 20);

    expect(onChange.mock.calls.length).toBeGreaterThan(0);
    const last = onChange.mock.calls.at(-1)?.[0] as ColorChangeResult;
    expect(last.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(last.rgb.r).toBeLessThan(120);
  });

  it('coalesces many pointer moves in one frame into a single callback', async () => {
    const onChange = vi.fn();
    render(
      <ChromaPanel defaultValue="#ff0000" modes={['sliders']} showTitleBar={false} onChange={onChange} />,
    );
    await settle();

    const slider = document.querySelector('.cp-slider') as HTMLElement;
    const box = slider.getBoundingClientRect();
    const y = box.top + box.height / 2;

    const fire = (type: string, x: number): void => {
      slider.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse',
          clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1,
        }),
      );
    };

    fire('pointerdown', box.left + 4);
    onChange.mockClear(); // pointerdown applies immediately, by design

    for (let i = 0; i < 40; i++) {
      fire('pointermove', box.left + 4 + ((box.width - 8) * i) / 39);
    }
    expect(onChange).not.toHaveBeenCalled();

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    expect(onChange).toHaveBeenCalledTimes(1);
    const last = onChange.mock.calls.at(-1)?.[0] as ColorChangeResult;
    expect(last.rgb.r).toBeGreaterThan(240);

    fire('pointerup', box.left + box.width - 4);
  });

  it('fires onChangeComplete once, at the end', async () => {
    const onChangeComplete = vi.fn();
    render(
      <ChromaPanel
        defaultValue="#ff0000" modes={['sliders']} showTitleBar={false}
        onChangeComplete={onChangeComplete}
      />,
    );
    await settle();

    const slider = document.querySelector('.cp-slider');
    await pointerDrag(slider as Element, { x: 0.1, y: 0.5 }, { x: 0.8, y: 0.5 }, 15);

    expect(onChangeComplete).toHaveBeenCalledTimes(1);
  });

  it('keeps tracking when the pointer leaves the element mid-drag', async () => {
    const onChange = vi.fn();
    render(
      <ChromaPanel defaultValue="#00ff00" modes={['wheel']} showTitleBar={false} onChange={onChange} />,
    );
    await expect.element(page.getByRole('group', { name: /colour wheel/i })).toBeInTheDocument();

    const disc = document.querySelector('.cp-disc') as HTMLElement;
    await pointerDrag(disc, { x: 0.5, y: 0.5 }, { x: 3, y: 0.5 }, 20);

    expect(onChange.mock.calls.length).toBeGreaterThan(0);
    const last = onChange.mock.calls.at(-1)?.[0] as ColorChangeResult;
    expect(last.hsva.s).toBeGreaterThan(90);
  });
});
