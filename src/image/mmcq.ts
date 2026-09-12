const SIGBITS = 5;
const RSHIFT = 8 - SIGBITS;
const HIST_SIZE = 1 << (3 * SIGBITS); 
const MAX_ITERATIONS = 1000;
const FRACT_BY_POPULATIONS = 0.75;

function histIndex(r: number, g: number, b: number): number {
  return (r << (2 * SIGBITS)) + (g << SIGBITS) + b;
}

interface Histogram {
  counts: Int32Array;
  rSum: Int32Array;
  gSum: Int32Array;
  bSum: Int32Array;
}

interface VBox {
  r1: number; r2: number;
  g1: number; g2: number;
  b1: number; b2: number;
  count: number;
  countValid: boolean;
}

export interface QuantizedSwatch {
  hex: string;
  rgb: [number, number, number];
  population: number;
}

function makeVBox(r1: number, r2: number, g1: number, g2: number, b1: number, b2: number): VBox {
  return { r1, r2, g1, g2, b1, b2, count: 0, countValid: false };
}

function copyVBox(v: VBox): VBox {
  return makeVBox(v.r1, v.r2, v.g1, v.g2, v.b1, v.b2);
}

function volume(v: VBox): number {
  return (v.r2 - v.r1 + 1) * (v.g2 - v.g1 + 1) * (v.b2 - v.b1 + 1);
}

function count(v: VBox, histo: Int32Array): number {
  if (v.countValid) return v.count;
  let total = 0;
  for (let r = v.r1; r <= v.r2; r++) {
    for (let g = v.g1; g <= v.g2; g++) {
      for (let b = v.b1; b <= v.b2; b++) {
        total += histo[histIndex(r, g, b)] as number;
      }
    }
  }
  v.count = total;
  v.countValid = true;
  return total;
}

function average(v: VBox, h: Histogram): [number, number, number] {
  const mult = 1 << RSHIFT;
  let total = 0;
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;

  for (let r = v.r1; r <= v.r2; r++) {
    for (let g = v.g1; g <= v.g2; g++) {
      for (let b = v.b1; b <= v.b2; b++) {
        const index = histIndex(r, g, b);
        const hval = h.counts[index] as number;
        if (hval === 0) continue;
        total += hval;
        rSum += h.rSum[index] as number;
        gSum += h.gSum[index] as number;
        bSum += h.bSum[index] as number;
      }
    }
  }

  if (total === 0) {
    return [
      Math.min(255, Math.round((mult * (v.r1 + v.r2 + 1)) / 2)),
      Math.min(255, Math.round((mult * (v.g1 + v.g2 + 1)) / 2)),
      Math.min(255, Math.round((mult * (v.b1 + v.b2 + 1)) / 2)),
    ];
  }

  return [
    Math.min(255, Math.round(rSum / total)),
    Math.min(255, Math.round(gSum / total)),
    Math.min(255, Math.round(bSum / total)),
  ];
}

function medianCut(histo: Int32Array, vbox: VBox): VBox[] {
  if (count(vbox, histo) === 0) return [];
  if (count(vbox, histo) === 1) return [copyVBox(vbox)];

  const rw = vbox.r2 - vbox.r1 + 1;
  const gw = vbox.g2 - vbox.g1 + 1;
  const bw = vbox.b2 - vbox.b1 + 1;
  const maxw = Math.max(rw, gw, bw);

  const partial = new Int32Array(33);
  let total = 0;

  const axis: 'r' | 'g' | 'b' = maxw === rw ? 'r' : maxw === gw ? 'g' : 'b';

  if (axis === 'r') {
    for (let r = vbox.r1; r <= vbox.r2; r++) {
      let sum = 0;
      for (let g = vbox.g1; g <= vbox.g2; g++)
        for (let b = vbox.b1; b <= vbox.b2; b++) sum += histo[histIndex(r, g, b)] as number;
      total += sum;
      partial[r] = total;
    }
  } else if (axis === 'g') {
    for (let g = vbox.g1; g <= vbox.g2; g++) {
      let sum = 0;
      for (let r = vbox.r1; r <= vbox.r2; r++)
        for (let b = vbox.b1; b <= vbox.b2; b++) sum += histo[histIndex(r, g, b)] as number;
      total += sum;
      partial[g] = total;
    }
  } else {
    for (let b = vbox.b1; b <= vbox.b2; b++) {
      let sum = 0;
      for (let r = vbox.r1; r <= vbox.r2; r++)
        for (let g = vbox.g1; g <= vbox.g2; g++) sum += histo[histIndex(r, g, b)] as number;
      total += sum;
      partial[b] = total;
    }
  }

  const lo = axis === 'r' ? vbox.r1 : axis === 'g' ? vbox.g1 : vbox.b1;
  const hi = axis === 'r' ? vbox.r2 : axis === 'g' ? vbox.g2 : vbox.b2;

  for (let i = lo; i <= hi; i++) {
    if ((partial[i] as number) <= total / 2) continue;

    const left = i - lo;
    const right = hi - i;

    let d2 = left <= right
      ? Math.min(hi - 1, Math.trunc(i + right / 2))
      : Math.max(lo, Math.trunc(i - 1 - left / 2));

    while (d2 < hi && (partial[d2] as number) === 0) d2++;
    let count2 = total - (partial[d2] as number);
    while (count2 === 0 && d2 > lo && (partial[d2 - 1] as number) > 0) {
      d2--;
      count2 = total - (partial[d2] as number);
    }

    const a = copyVBox(vbox);
    const b = copyVBox(vbox);
    if (axis === 'r') { a.r2 = d2; b.r1 = d2 + 1; }
    else if (axis === 'g') { a.g2 = d2; b.g1 = d2 + 1; }
    else { a.b2 = d2; b.b1 = d2 + 1; }
    return [a, b];
  }

  return [copyVBox(vbox)];
}

export function quantize(
  data: Uint8ClampedArray,
  maxColors: number,
  alphaThreshold: number = 128,
): QuantizedSwatch[] {
  const target = Math.max(2, Math.min(256, Math.round(maxColors)));
  const hist: Histogram = {
    counts: new Int32Array(HIST_SIZE),
    rSum: new Int32Array(HIST_SIZE),
    gSum: new Int32Array(HIST_SIZE),
    bSum: new Int32Array(HIST_SIZE),
  };
  const histo = hist.counts;

  let rMin = 1e9, rMax = -1, gMin = 1e9, gMax = -1, bMin = 1e9, bMax = -1;
  let used = 0;

  for (let i = 0; i < data.length; i += 4) {
    if ((data[i + 3] as number) < alphaThreshold) continue;
    const r8 = data[i] as number;
    const g8 = data[i + 1] as number;
    const b8 = data[i + 2] as number;
    const r = r8 >> RSHIFT;
    const g = g8 >> RSHIFT;
    const b = b8 >> RSHIFT;
    const bin = histIndex(r, g, b);
    histo[bin] = (histo[bin] as number) + 1;
    hist.rSum[bin] = (hist.rSum[bin] as number) + r8;
    hist.gSum[bin] = (hist.gSum[bin] as number) + g8;
    hist.bSum[bin] = (hist.bSum[bin] as number) + b8;
    used++;
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }

  if (used === 0) return [];

  let boxes: VBox[] = [makeVBox(rMin, rMax, gMin, gMax, bMin, bMax)];

  const split = (limit: number, byVolume: boolean): void => {
    let iterations = 0;
    while (iterations++ < MAX_ITERATIONS) {
      if (boxes.length >= limit) return;

      boxes.sort((a, b) =>
        byVolume
          ? count(a, histo) * volume(a) - count(b, histo) * volume(b)
          : count(a, histo) - count(b, histo),
      );

      const biggest = boxes.pop();
      if (biggest === undefined) return;
      if (count(biggest, histo) === 0) {
        boxes.unshift(biggest);
        return;
      }

      const parts = medianCut(histo, biggest);
      if (parts.length === 0) return;
      boxes.push(...parts);
      if (parts.length === 1) return; 
    }
  };

  split(Math.max(2, Math.round(target * FRACT_BY_POPULATIONS)), false);
  split(target, true);

  return boxes
    .map((box) => {
      const rgb = average(box, hist);
      return {
        rgb,
        population: count(box, histo),
        hex:
          '#' +
          rgb.map((c) => c.toString(16).padStart(2, '0')).join(''),
      };
    })
    .filter((s) => s.population > 0)
    .sort((a, b) => b.population - a.population);
}
