import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App.tsx';
import TestApp from './TestApp.tsx';
import './index.css';

const USE_TEST_APP = false;

console.log('=== GrapLnk Starting ===');
console.log('Environment:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  testMode: USE_TEST_APP
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      console.log('Service worker not supported');
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  document.body.innerHTML = '<div style="color: red; padding: 20px; font-size: 20px; font-family: sans-serif;">ERROR: Root element #root not found in DOM!</div>';
  throw new Error('Root element not found');
}

console.log('Root element found, rendering app...');

try {
  if (USE_TEST_APP) {
    createRoot(rootElement).render(
      <StrictMode>
        <TestApp />
      </StrictMode>
    );
  } else {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </StrictMode>
    );
  }
  console.log('App rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px; font-size: 20px; font-family: monospace; white-space: pre-wrap;">ERROR: ${error}\n\n${error instanceof Error ? error.stack : ''}</div>`;
}
