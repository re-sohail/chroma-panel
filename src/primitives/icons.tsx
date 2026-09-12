'use client';

import * as React from 'react';

type Shape =
  | string
  | ['circle', number, number, number]
  | ['dot', number, number, number]
  | ['rect', number, number, number, number, number];

export type IconName =
  | 'palette'
  | 'sliders'
  | 'swatches'
  | 'image'
  | 'brush'
  | 'pipette'
  | 'x';

const ICONS: Record<IconName, Shape[]> = {
  palette: [
    'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
    ['dot', 13.5, 6.5, 0.5],
    ['dot', 17.5, 10.5, 0.5],
    ['dot', 6.5, 12.5, 0.5],
    ['dot', 8.5, 7.5, 0.5],
  ],
  sliders: [
    'M10 5H3', 'M12 19H3', 'M14 3v4', 'M16 17v4',
    'M21 12h-9', 'M21 19h-5', 'M21 5h-7', 'M8 10v4', 'M8 12H3',
  ],
  swatches: [
    'M11 17a4 4 0 0 1-8 0V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2Z',
    'M16.7 13H19a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H7',
    'M7 17h.01',
    'm11 8 2.3-2.3a2.4 2.4 0 0 1 3.404.004L18.6 7.6a2.4 2.4 0 0 1 .026 3.434L9.9 19.8',
  ],
  image: [
    ['rect', 3, 3, 18, 18, 2],
    ['circle', 9, 9, 2],
    'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21',
  ],
  brush: [
    'm14.622 17.897-10.68-2.913',
    'M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z',
    'M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15',
  ],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  pipette: [
    'm12 9-8.414 8.414A2 2 0 0 0 3 18.828v1.344a2 2 0 0 1-.586 1.414A2 2 0 0 1 3.828 21h1.344a2 2 0 0 0 1.414-.586L15 12',
    'm18 9 .4.4a1 1 0 1 1-3 3l-3.8-3.8a1 1 0 1 1 3-3l.4.4 3.4-3.4a1 1 0 1 1 3 3z',
    'm2 22 .414-.414',
  ],
};

export interface IconProps {
  name: IconName;
  className?: string;
}

export function Icon(props: IconProps): React.ReactElement {
  const { name, className } = props;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name].map((shape, index) => {
        if (typeof shape === 'string') return <path key={index} d={shape} />;
        if (shape[0] === 'rect') {
          return (
            <rect key={index} x={shape[1]} y={shape[2]} width={shape[3]} height={shape[4]} rx={shape[5]} />
          );
        }
        return (
          <circle
            key={index}
            cx={shape[1]}
            cy={shape[2]}
            r={shape[3]}
            fill={shape[0] === 'dot' ? 'currentColor' : undefined}
          />
        );
      })}
    </svg>
  );
}

const make = (name: IconName): (() => React.ReactElement) => {
  const Component = (): React.ReactElement => <Icon name={name} />;
  Component.displayName = `ChromaIcon(${name})`;
  return Component;
};

const GLYPHS = {
  close: 'M2.4 2.4 5.6 5.6M5.6 2.4 2.4 5.6',
  collapse: 'M2.1 4h3.8',
  expand: 'M2.2 4.6v1.2h1.2M5.8 3.4V2.2H4.6',
} as const;

export type WindowGlyphName = keyof typeof GLYPHS;

export function WindowGlyph(props: { name: WindowGlyphName }): React.ReactElement {
  return (
    <svg
      className="cp-light-glyph"
      viewBox="0 0 8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={GLYPHS[props.name]} />
    </svg>
  );
}

export const WheelIcon: () => React.ReactElement = make('palette');
export const SlidersIcon: () => React.ReactElement = make('sliders');
export const PalettesIcon: () => React.ReactElement = make('swatches');
export const ImageIcon: () => React.ReactElement = make('image');
export const PencilsIcon: () => React.ReactElement = make('brush');
export const EyedropperIcon: () => React.ReactElement = make('pipette');
