'use client';

import * as React from 'react';
import type { Hsva } from '../../color/types';
import { usePanel } from '../../core/context';
import { ChannelSlider } from '../../primitives/ChannelSlider';
import { ColorDisc } from '../../primitives/ColorDisc';
import { ColorField } from '../../primitives/ColorField';
import { WheelIcon } from '../../primitives/icons';
import { alphaTrack, brightnessTrack } from '../gradients';
import type { PickerMode } from '../registry';

export function WheelPanel(): React.ReactElement {
  const { options } = usePanel();

  return (
    <div className="cp-panel">
      <ColorDisc />
      <ChannelSlider
        label="Brightness"
        shortLabel="B"
        min={0}
        max={100}
        read={(c: Hsva) => c.v}
        write={(v: number, c: Hsva) => ({ ...c, v })}
        gradient={brightnessTrack}
        channel="brightness"
        formatValue={(v) => `${Math.round(v)} percent`}
      />
      {options.showAlpha && (
        <ChannelSlider
          label="Opacity"
          shortLabel="A"
          min={0}
          max={100}
          read={(c: Hsva) => c.a * 100}
          write={(v: number, c: Hsva) => ({ ...c, a: v / 100 })}
          gradient={alphaTrack}
          channel="alpha"
          formatValue={(v) => `${Math.round(v)} percent`}
        />
      )}
      <div className="cp-fields">
        <ColorField withAlpha={options.showAlpha} />
      </div>
    </div>
  );
}

export const wheelMode: PickerMode = {
  id: 'wheel',
  label: 'Color wheel',
  icon: WheelIcon,
  Panel: WheelPanel,
};
