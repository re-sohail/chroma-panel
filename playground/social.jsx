import { createRoot } from 'react-dom/client';
import { ChromaPanel } from 'chroma-panel';

// GitHub's repository social preview, captured by `npm run readme:images`.
const AUTUMN = ['#e0643f', '#e8a33a', '#c9461f', '#6f8f3a', '#2f5d5a', '#9db4c0', '#f1d3a8', '#3c2a21'];

function Panels() {
  return (
    <>
      <ChromaPanel
        defaultValue="#e8a33a"
        defaultMode="image"
        size="expanded"
        imageOptions={{ maxColors: 10 }}
        className="hero-image"
        showRecentColors={false}
        onClose={() => {}}
      />
      <ChromaPanel defaultValue="#e0643f" defaultMode="harmony"
        modeProps={{ harmony: { defaultRule: 'triadic' } }}
        defaultRecentColors={AUTUMN.slice(2)} onClose={() => {}} />
    </>
  );
}
createRoot(document.getElementById('panels')).render(<Panels />);
