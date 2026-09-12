import { useRef, useState } from 'react';
import {
  ColorInput,
  defaultPalettes,
  defaultPencils,
  registerNamedColors,
  readableTextColor,
  contrastRatio,
} from 'chroma-panel';
import { namedColors } from 'chroma-panel/named-colors';

// Opt in to the 148 CSS colour names, so named input is exercised too.
registerNamedColors(namedColors);

const PALETTES = defaultPalettes();
const PENCILS = defaultPencils();

export default function App() {
  const [color, setColor] = useState('#3366cc');
  const [committed, setCommitted] = useState('#3366cc');
  const [recents, setRecents] = useState([]);
  const theme = 'dark';
  const [submitted, setSubmitted] = useState(null);

  // Instrumentation: counts how often each callback fires.
  const changes = useRef(0);
  const commits = useRef(0);
  const [, force] = useState(0);

  const onChange = (c) => {
    changes.current++;
    setColor(c.hex);
  };
  const onChangeComplete = (c) => {
    commits.current++;
    setCommitted(c.hex);
    force((n) => n + 1);
  };

  const ratio = contrastRatio(color, '#ffffff').toFixed(2);

  return (
    <main>
      <header>
        <h1>chroma-panel playground</h1>
        <p className="sub">
          Plain JavaScript. Installed from the packed tarball, so this is exactly
          what an npm user gets.
        </p>
      </header>

      <section className="grid">
        {/* ---------------- 1. popover form ---------------- */}
        <article>
          <h2>1 · ColorInput in a form</h2>
          <p className="hint">
            Click the swatch. Check the popover positions correctly, closes on
            Escape, and returns focus to the swatch.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(new FormData(e.currentTarget).get('brandColor'));
            }}
          >
            <div className="row">
              <ColorInput
                value={color}
                onChange={onChange}
                onChangeComplete={onChangeComplete}
                modes={['wheel', 'sliders', 'palettes', 'image', 'pencils']}
                palettes={PALETTES}
                pencils={PENCILS}
                recentColors={recents}
                onRecentColorsChange={setRecents}
                theme={theme}
                name="brandColor"
                format="hex"
                showAlpha
              />
              <code className="chip" style={{ background: color, color: readableTextColor(color) }}>
                {color}
              </code>
              <button type="submit" className="demo-button">Submit form</button>
            </div>
          </form>

          {submitted && <p className="ok">Form submitted with: <code>{submitted}</code></p>}

          <dl className="stats">
            <div><dt>onChange fired</dt><dd>{changes.current}</dd></div>
            <div><dt>onChangeComplete fired</dt><dd>{commits.current}</dd></div>
            <div><dt>last committed</dt><dd><code>{committed}</code></dd></div>
            <div><dt>contrast vs white</dt><dd>{ratio}:1</dd></div>
          </dl>
          <p className="hint">
            Drag a slider around, then release. onChange should climb a lot;
            onChangeComplete should go up by exactly one.
          </p>
        </article>

      </section>

      <footer>
        <p>
          Also worth checking: resize the window narrow, try it on a phone, and
          confirm the eyedropper button is present in Chrome but absent in
          Firefox and Safari.
        </p>
      </footer>
    </main>
  );
}
