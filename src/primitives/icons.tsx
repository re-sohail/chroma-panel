'use client';

import * as React from 'react';

const base = {
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function WheelIcon(): React.ReactElement {
  return (
    <svg {...base}>
      <circle cx="8" cy="8" r="6" />
      <circle cx="8" cy="8" r="2" />
      <path d="M8 2v4M8 10v4M2 8h4M10 8h4" />
    </svg>
  );
}

export function SlidersIcon(): React.ReactElement {
  return (
    <svg {...base}>
      <path d="M2 4.5h12M2 8h12M2 11.5h12" />
      <circle cx="5.5" cy="4.5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="10" cy="8" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="11.5" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PalettesIcon(): React.ReactElement {
  return (
    <svg {...base}>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

export function ImageIcon(): React.ReactElement {
  return (
    <svg {...base}>
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <circle cx="5.75" cy="6.5" r="1.15" />
      <path d="M2.5 11.5 6 8.5l2.5 2 2-1.5 3 2.5" />
    </svg>
  );
}

export function PencilsIcon(): React.ReactElement {
  return (
    <svg {...base}>
      <path d="M4 13V6l1.75-3L7.5 6v7a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1Z" />
      <path d="M10 13V6l1.75-3L13.5 6v7a1 1 0 0 1-1 1H11a1 1 0 0 1-1-1Z" />
      <path d="M4 7h3.5M10 7h3.5" />
    </svg>
  );
}

export function EyedropperIcon(): React.ReactElement {
  return (
    <svg {...base}>
      <path d="m10.5 2.5 3 3M12 4 6.5 9.5 4 10l-.5 2.5L6 12l.5-2.5L12 4Z" />
      <path d="M2.5 13.5 4 12" />
    </svg>
  );
}
