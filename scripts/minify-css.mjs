/**
 * A small, conservative CSS minifier.
 *
 * The stylesheet is inlined into the JS bundle for runtime injection, so its
 * explanatory comments would otherwise be shipped to every user. They are for
 * maintainers reading src/, not for the wire.
 *
 * Deliberately conservative: it only strips comments and collapses whitespace
 * around syntax it can see unambiguously, and it leaves quoted strings alone
 * so `content: ""` survives.
 */
export function minifyCss(input) {
  let out = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Preserve quoted strings verbatim.
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < input.length && !(input[j] === quote && input[j - 1] !== '\\')) j++;
      out += input.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Drop comments.
    if (ch === '/' && input[i + 1] === '*') {
      const end = input.indexOf('*/', i + 2);
      i = end === -1 ? input.length : end + 2;
      // A comment between tokens becomes a single space, then collapses below.
      out += ' ';
      continue;
    }

    out += ch;
    i++;
  }

  return out
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    // Restore the space CSS needs after a colon inside media/supports queries
    // and in selectors like `a:hover` (harmless) — only `;}` is unambiguous.
    .replace(/;}/g, '}')
    .trim();
}
