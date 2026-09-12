/**
 * Development-only warnings.
 *
 * `process.env.NODE_ENV` is written out literally so that bundlers can
 * substitute it and drop these branches from production builds. The
 * `typeof` guard keeps the library safe in a plain-ESM browser context where
 * `process` does not exist at all, and the declaration is module-scoped so we
 * do not need @types/node leaking into the published types.
 */
declare const process: { env?: { NODE_ENV?: string } } | undefined;

export const isDev: boolean =
  typeof process !== 'undefined' && typeof process.env === 'object'
    ? process.env.NODE_ENV !== 'production'
    : false;

const warned = new Set<string>();

/** Warn at most once per message, so a warning inside render cannot spam. */
export function warnOnce(message: string): void {
  if (!isDev || warned.has(message)) return;
  warned.add(message);
  console.warn(`chroma-panel: ${message}`);
}
