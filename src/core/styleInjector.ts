/**
 * Stylesheet injection.
 *
 * The panel's CSS ships inside the JS and is injected on first mount, so a
 * consumer never has to remember `import 'chroma-panel/styles.css'` — a
 * forgotten import is one of the most common bug reports filed against
 * CSS-shipping component libraries, and in an RSC app the import has to be
 * reachable from a client boundary to be collected at all.
 *
 * Consumers who prefer the stylesheet can pass `injectStyles={false}` and
 * import `chroma-panel/styles.css` themselves.
 */

let nonceProvider: (() => string | undefined) | null = null;

/**
 * Supply a CSP nonce for the injected <style> element.
 *
 * Sites with a strict `style-src` need this; without it the injected styles
 * are blocked. Call once, before the first panel mounts.
 */
export function setStyleNonce(provider: string | (() => string | undefined)): void {
  nonceProvider = typeof provider === 'function' ? provider : () => provider;
}

/**
 * One record of injected ids per root node.
 *
 * Keying on `getRootNode()` rather than `document` is what makes the panel
 * work inside a shadow root or an iframe: styles in the outer document do not
 * cross a shadow boundary, so each root needs its own copy.
 */
const injectedByRoot = new WeakMap<Node, Set<string>>();

function containerFor(root: Node): Node | null {
  // ShadowRoot: append directly.
  if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) return root;

  const doc = (root as Document).head !== undefined ? (root as Document) : document;
  // Some documents genuinely have no <head> (srcdoc iframes, hand-built
  // documents). Fall back rather than throwing.
  return doc.head ?? doc.documentElement ?? null;
}

/**
 * Inject `css` into the root that owns `node`, at most once per root per id.
 * No-op during server rendering.
 */
export function injectStyles(css: string, id: string, node?: Node | null): void {
  if (typeof document === 'undefined') return; // SSR

  const root = node?.getRootNode?.() ?? document;
  let seen = injectedByRoot.get(root);
  if (seen === undefined) {
    seen = new Set<string>();
    injectedByRoot.set(root, seen);
  }
  if (seen.has(id)) return;

  const container = containerFor(root);
  if (container === null) return;

  // Another instance of the library (a duplicated dependency) may have
  // already injected this exact sheet; don't stack a second copy.
  const existing = (container as Element).querySelector?.(`style[data-chroma-panel="${id}"]`);
  if (existing !== null && existing !== undefined) {
    seen.add(id);
    return;
  }

  const style = document.createElement('style');
  style.setAttribute('data-chroma-panel', id);

  const nonce = nonceProvider?.();
  if (nonce !== undefined && nonce !== '') style.setAttribute('nonce', nonce);

  style.appendChild(document.createTextNode(css));
  container.appendChild(style);
  seen.add(id);
}
