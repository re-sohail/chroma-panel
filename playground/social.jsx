import { createRoot } from 'react-dom/client';
import { ChromaPanel } from 'chroma-panel';

// GitHub's repository social preview, captured by `npm run readme:images`.
function Panels() {
  return (
    <>
      <ChromaPanel
        defaultValue="#e8a33a"
        modes={['image']}
        size="expanded"
        imageOptions={{ maxColors: 10 }}
        className="hero-image"
        onClose={() => {}}
      />
      <ChromaPanel defaultValue="#e0643f" modes={['wheel']} onClose={() => {}} />
    </>
  );
}
createRoot(document.getElementById('panels')).render(<Panels />);
