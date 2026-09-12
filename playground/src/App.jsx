import { useRef, useState } from 'react';
import {
  ColorInput,
  ChromaPanel,
  defaultPalettes,
  defaultPencils,
  registerNamedColors,
  readableTextColor,
  contrastRatio,
  parse,
  toHex,
} from 'chroma-panel';
import { namedColors } from 'chroma-panel/named-colors';

// Opt in to the 148 CSS colour names so `parse('rebeccapurple')` works.
registerNamedColors(namedColors);

const PALETTES = defaultPalettes();
const PENCILS = defaultPencils();

export default function App() {
  const [color, setColor] = useState('#3366cc');
  const [committed, setCommitted] = useState('#3366cc');
  const [recents, setRecents] = useState([]);
  const [theme, setTheme] = useState('dark');
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
              <button type="submit">Submit form</button>
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

        {/* ---------------- 2. inline panel ---------------- */}
        <article>
          <h2>2 · Inline ChromaPanel</h2>
          <p className="hint">
            Uncontrolled, always open. Try every mode in the toolbar.
          </p>
          <ChromaPanel
            defaultValue="#e07a3f"
            modes={['wheel', 'sliders', 'palettes', 'image', 'pencils']}
            palettes={PALETTES}
            pencils={PENCILS}
            theme={theme}
            title="Colours"
          />
        </article>

        {/* ---------------- 3. the hue-loss test ---------------- */}
        <article>
          <h2>3 · The bug other pickers have</h2>
          <p className="hint">
            Switch to <b>Sliders → HSB</b>. Note the Hue value. Drag
            <b> Brightness</b> to 0 (the colour goes black), then back up.
            The hue must come back unchanged — not red.
          </p>
          <ChromaPanel
            defaultValue="#7a3fe0"
            modes={['sliders']}
            defaultMode="sliders"
            theme={theme}
            showTitleBar={false}
          />
        </article>

        {/* ---------------- 4. theming ---------------- */}
        <article>
          <h2>4 · Theming &amp; sizing</h2>
          <p className="hint">
            Themed purely with CSS custom properties — no build step.
          </p>
          <div className="row">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              Theme: {theme}
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <ChromaPanel
              defaultValue="hsl(160 70% 45%)"
              modes={['wheel']}
              showTitleBar={false}
              theme={theme}
              style={{
                '--cp-radius-lg': '6px',
                '--cp-width': '260px',
                '--cp-accent': '#10b981',
                '--cp-focus': '#10b981',
              }}
            />
          </div>
        </article>

        {/* ---------------- 5. parsing ---------------- */}
        <article>
          <h2>5 · Input formats</h2>
          <p className="hint">
            Each of these is parsed by the same engine. Named colours work
            because this app called <code>registerNamedColors</code>.
          </p>
          <ul className="swatches">
            {[
              '#f43f5e', '#0ea5e9cc', 'rgb(34 197 94)', 'rgba(168, 85, 247, 0.6)',
              'hsl(45 93% 47%)', 'hwb(200 20% 10%)', 'rebeccapurple', 'tomato',
            ].map((input) => {
              const parsed = parse(input);
              return (
                <li key={input}>
                  <span
                    className="dot"
                    style={{ background: parsed ? toHex(parsed) : 'transparent' }}
                  />
                  <code>{input}</code>
                  <b>{parsed ? toHex(parsed) : 'FAILED TO PARSE'}</b>
                </li>
              );
            })}
          </ul>
        </article>

        {/* ---------------- 6. keyboard ---------------- */}
        <article>
          <h2>6 · Keyboard only</h2>
          <p className="hint">
            Put the mouse down. Tab into this panel. Arrow keys move a value,
            Shift+Arrow moves by 10, Home/End jump to the ends, and Left/Right
            arrows switch modes while the toolbar has focus.
          </p>
          <ChromaPanel
            defaultValue="#3fe07a"
            modes={['wheel', 'sliders']}
            theme={theme}
            showTitleBar={false}
          />
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
