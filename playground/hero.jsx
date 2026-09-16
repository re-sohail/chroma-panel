import { createRoot } from 'react-dom/client';
import { ChromaPanel, defaultPencils } from 'chroma-panel';

// The README hero, captured by `npm run readme:images`. The image panel starts
// empty; the capture script loads public/autumn-park.webp into its file input.
function Hero() {
  return (
    <>
      {/* onClose makes the close control live, which is how the panel looks
          in the popover — the primary use. Without it the red dot renders
          dimmed, which reads as a defect in a still image. */}
      <ChromaPanel defaultValue="#e0643f" modes={['wheel']} onClose={() => {}} />
      <ChromaPanel
        defaultValue="#e8a33a"
        modes={['image']}
        size="expanded"
        imageOptions={{ maxColors: 10 }}
        className="hero-image"
        onClose={() => {}}
      />
      <ChromaPanel defaultValue="#25c07a" modes={['pencils']} pencils={defaultPencils()} onClose={() => {}} />
    </>
  );
}
createRoot(document.getElementById('stage')).render(<Hero />);
