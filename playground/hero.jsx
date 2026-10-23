import { createRoot } from 'react-dom/client';
import { ChromaPanel } from 'chroma-panel';

// The README hero, captured by `npm run readme:images`. The image panel starts
// empty; the capture script loads public/autumn-park.webp into its file input.
const AUTUMN = ['#e0643f', '#e8a33a', '#c9461f', '#6f8f3a', '#2f5d5a', '#9db4c0', '#f1d3a8', '#3c2a21'];

function Hero() {
  return (
    <>
      <ChromaPanel defaultValue="#e0643f" defaultMode="wheel" defaultRecentColors={AUTUMN} onClose={() => {}} />
      <ChromaPanel
        defaultValue="#e8a33a"
        defaultMode="image"
        size="expanded"
        imageOptions={{ maxColors: 10 }}
        className="hero-image"
        defaultRecentColors={AUTUMN.slice(1)}
        onClose={() => {}}
      />
      <ChromaPanel defaultValue="#2f8f6a" defaultMode="sliders" defaultRecentColors={AUTUMN.slice(2)} onClose={() => {}} />
    </>
  );
}
createRoot(document.getElementById('stage')).render(<Hero />);
