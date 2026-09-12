import { quantize, type QuantizedSwatch } from './image/mmcq';

interface QuantizeRequest {
  id: string;
  data: Uint8ClampedArray;
  maxColors: number;
  alphaThreshold: number;
}

interface QuantizeResponse {
  id: string;
  swatches?: QuantizedSwatch[];
  error?: string;
}

const post = (message: QuantizeResponse): void => {
  (self as unknown as Worker).postMessage(message);
};

self.addEventListener('message', (event: MessageEvent) => {
  const request = event.data as QuantizeRequest | null;
  if (request === null || typeof request !== 'object') return;

  const { id, data, maxColors, alphaThreshold } = request;

  try {
    post({ id, swatches: quantize(data, maxColors, alphaThreshold) });
  } catch (error) {
    post({ id, error: error instanceof Error ? error.message : String(error) });
  }
});
