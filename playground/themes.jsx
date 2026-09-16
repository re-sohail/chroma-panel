import { createRoot } from 'react-dom/client';
import { ChromaPanel } from 'chroma-panel';

// The README theming image, captured by `npm run readme:images`.
function Themes() {
  return (
    <>
      <ChromaPanel defaultValue="#e0643f" modes={['wheel']} theme="light" onClose={() => {}} />
      <ChromaPanel defaultValue="#3d7de0" modes={['sliders']} theme="dark" onClose={() => {}} />
    </>
  );
}
createRoot(document.getElementById('stage')).render(<Themes />);
