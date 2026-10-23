import { createRoot } from 'react-dom/client';
import { ChromaPanel } from 'chroma-panel';

// The README theming image, captured by `npm run readme:images`.
const RECENTS = ['#3d7de0', '#e0643f', '#f2b134', '#2fb67c', '#8e5cf0', '#e6487a', '#1f2a44', '#f4f1ea'];

function Themes() {
  return (
    <>
      <ChromaPanel defaultValue="#e0643f" defaultMode="classic" theme="light"
        defaultRecentColors={RECENTS} onClose={() => {}} />
      <ChromaPanel defaultValue="#3d7de0" defaultMode="harmony" theme="dark"
        modeProps={{ harmony: { defaultRule: 'triadic' } }}
        defaultRecentColors={RECENTS.slice(1)} onClose={() => {}} />
    </>
  );
}
createRoot(document.getElementById('stage')).render(<Themes />);
