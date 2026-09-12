// Deliberately plain JavaScript (.jsx) with no TypeScript anywhere,
// to prove the package works without it.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './app.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
