'use client';

import * as React from 'react';
import { gradientToCss, normalizeGradient, type GradientStop, type GradientValue } from './model';

export interface GradientEditorProps {
  value?: GradientValue;
  defaultValue?: GradientValue;
  onChange?: (value: GradientValue) => void;
  onChangeComplete?: (value: GradientValue) => void;
  disabled?: boolean;
  minStops?: number;
  maxStops?: number;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

const DEFAULT_GRADIENT: GradientValue = {
  type: 'linear', angle: 90,
  stops: [{ id: 'start', color: '#7c3aed', position: 0 }, { id: 'end', color: '#06b6d4', position: 100 }],
};

export function GradientEditor(props: GradientEditorProps): React.ReactElement {
  const {
    value, defaultValue = DEFAULT_GRADIENT, onChange, onChangeComplete,
    disabled = false, minStops = 2, maxStops = 12, className, style,
    'aria-label': ariaLabel = 'Gradient editor',
  } = props;
  const [internal, setInternal] = React.useState(() => normalizeGradient(defaultValue));
  const current = normalizeGradient(value ?? internal);
  const currentRef = React.useRef(current);
  currentRef.current = current;

  const update = (next: GradientValue, complete = false): void => {
    const normalized = normalizeGradient(next);
    currentRef.current = normalized;
    if (value === undefined) setInternal(normalized);
    onChange?.(normalized);
    if (complete) onChangeComplete?.(normalized);
  };

  const patchStop = (id: string, patch: Partial<GradientStop>, complete = false): void => {
    update({ ...current, stops: current.stops.map((stop) => stop.id === id ? { ...stop, ...patch } : stop) }, complete);
  };

  const addStop = (): void => {
    if (current.stops.length >= maxStops) return;
    const position = 50;
    const id = `stop-${Date.now().toString(36)}`;
    update({ ...current, stops: [...current.stops, { id, color: '#808080', position }] }, true);
  };

  const removeStop = (id: string): void => {
    if (current.stops.length <= minStops) return;
    update({ ...current, stops: current.stops.filter((stop) => stop.id !== id) }, true);
  };

  return (
    <div className={className} style={style} aria-label={ariaLabel} data-cp-gradient-editor="">
      <div
        role="img"
        aria-label={`Gradient preview with ${current.stops.length} color stops`}
        style={{ height: 48, borderRadius: 8, background: gradientToCss(current) }}
      />
      <div style={{ display: 'flex', gap: 8, paddingBlock: 8 }}>
        <label>
          Type{' '}
          <select disabled={disabled} value={current.type} onChange={(event) => update({ ...current, type: event.currentTarget.value as GradientValue['type'] }, true)}>
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </label>
        {current.type === 'linear' && (
          <label>
            Angle{' '}
            <input
              type="number" min={0} max={359} step={1} disabled={disabled}
              value={current.angle ?? 90}
              onChange={(event) => update({ ...current, angle: event.currentTarget.valueAsNumber })}
              onBlur={() => onChangeComplete?.(currentRef.current)}
            />
          </label>
        )}
      </div>
      <div role="list" aria-label="Gradient color stops">
        {current.stops.map((stop, index) => (
          <fieldset key={stop.id} disabled={disabled} style={{ display: 'flex', gap: 8, alignItems: 'center', border: 0, padding: '8px 0', margin: 0 }}>
            <legend style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>Stop {index + 1}</legend>
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(stop.color) ? stop.color : '#000000'}
              aria-label={`Stop ${index + 1} color`}
              onChange={(event) => patchStop(stop.id, { color: event.currentTarget.value })}
              onBlur={() => onChangeComplete?.(currentRef.current)}
            />
            <input
              type="text" value={stop.color} aria-label={`Stop ${index + 1} CSS color`}
              onChange={(event) => patchStop(stop.id, { color: event.currentTarget.value })}
              onBlur={() => onChangeComplete?.(currentRef.current)}
            />
            <input
              type="range" min={0} max={100} step={1} value={stop.position}
              aria-label={`Stop ${index + 1} position`}
              aria-valuetext={`${stop.position} percent`}
              onChange={(event) => patchStop(stop.id, { position: event.currentTarget.valueAsNumber })}
              onPointerUp={() => onChangeComplete?.(currentRef.current)}
              onKeyUp={(event) => { if (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') onChangeComplete?.(currentRef.current); }}
            />
            <output aria-live="off">{Math.round(stop.position)}%</output>
            <button type="button" disabled={disabled || current.stops.length <= minStops} onClick={() => removeStop(stop.id)} aria-label={`Remove stop ${index + 1}`}>Remove</button>
          </fieldset>
        ))}
      </div>
      <button type="button" disabled={disabled || current.stops.length >= maxStops} onClick={addStop}>Add color stop</button>
    </div>
  );
}
