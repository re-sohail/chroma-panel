export function minifyCss(input) {
  let out = '';
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < input.length && !(input[j] === quote && input[j - 1] !== '\\')) j++;
      out += input.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    if (ch === '/' && input[i + 1] === '*') {
      const end = input.indexOf('*/', i + 2);
      i = end === -1 ? input.length : end + 2;
      out += ' ';
      continue;
    }

    out += ch;
    i++;
  }

  return out
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}
