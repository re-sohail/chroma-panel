declare const process: { env?: { NODE_ENV?: string } } | undefined;

export const isDev: boolean =
  typeof process !== 'undefined' && typeof process.env === 'object'
    ? process.env.NODE_ENV !== 'production'
    : false;

const warned = new Set<string>();

export function warnOnce(message: string): void {
  if (!isDev || warned.has(message)) return;
  warned.add(message);
  console.warn(`chroma-panel: ${message}`);
}
