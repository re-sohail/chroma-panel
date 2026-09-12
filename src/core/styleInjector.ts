let nonceProvider: (() => string | undefined) | null = null;

export function setStyleNonce(provider: string | (() => string | undefined)): void {
  nonceProvider = typeof provider === 'function' ? provider : () => provider;
}

const injectedByRoot = new WeakMap<Node, Set<string>>();

function containerFor(root: Node): Node | null {
  if (typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) return root;

  const doc = (root as Document).head !== undefined ? (root as Document) : document;
  return doc.head ?? doc.documentElement ?? null;
}

export function injectStyles(css: string, id: string, node?: Node | null): void {
  if (typeof document === 'undefined') return; 

  const root = node?.getRootNode?.() ?? document;
  let seen = injectedByRoot.get(root);
  if (seen === undefined) {
    seen = new Set<string>();
    injectedByRoot.set(root, seen);
  }
  if (seen.has(id)) return;

  const container = containerFor(root);
  if (container === null) return;

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
