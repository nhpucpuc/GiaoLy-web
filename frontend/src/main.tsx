import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  navigatorWithStandalone.standalone === true;
const isIOS =
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
  (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);

document.documentElement.classList.toggle('pwa-standalone', isStandalone);
document.documentElement.classList.toggle('ios-pwa-standalone', isStandalone && isIOS);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
