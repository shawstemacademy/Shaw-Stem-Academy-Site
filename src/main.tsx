import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.tsx';
import './index.css';

// Force Chrome / browser tab to refresh favicon with Shaw STEM Academy logo
const setFavicon = () => {
  const iconUrls = [
    { rel: 'icon', type: 'image/png', href: '/favicon-32x32.png?v=' + Date.now() },
    { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico?v=' + Date.now() },
    { rel: 'apple-touch-icon', type: 'image/png', href: '/apple-touch-icon.png?v=' + Date.now() }
  ];

  iconUrls.forEach(({ rel, type, href }) => {
    let link: HTMLLinkElement | null = document.querySelector(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.type = type;
    link.href = href;
  });
};

try {
  setFavicon();
} catch (e) {
  console.warn('Favicon refresh warning:', e);
}

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <SpeedInsights />
  </StrictMode>,
);
