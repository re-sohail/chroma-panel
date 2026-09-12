import { createRoot } from 'react-dom/client';
import { ChromaPanel, defaultPencils, defaultPalettes } from 'chroma-panel';

function Hero() {
  return (
    <>
      {/* onClose makes the close control live, which is how the panel looks
          in the popover — the primary use. Without it the red dot renders
          dimmed, which reads as a defect in a still image. */}
      <ChromaPanel defaultValue="#e0643f" modes={['wheel']} onClose={() => {}} />
      <ChromaPanel defaultValue="#3d7de0" modes={['sliders']} defaultMode="sliders" onClose={() => {}} />
      <ChromaPanel defaultValue="#25c07a" modes={['pencils']} pencils={defaultPencils()} onClose={() => {}} />
    </>
  );
}
createRoot(document.getElementById('stage')).render(<Hero />);
