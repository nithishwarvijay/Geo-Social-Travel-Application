import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';

import App from './App';
import './index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const disableClerk = String(import.meta.env.VITE_DISABLE_CLERK || '').toLowerCase() === 'true';

function ConfigError({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-xl rounded-lg border border-red-300 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-red-700">Configuration Error</h1>
        <p className="text-sm text-slate-700">{message}</p>
      </div>
    </div>
  );
}

if (disableClerk) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} else if (!publishableKey || publishableKey.includes('xxxxxxxx')) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ConfigError message="Set a valid VITE_CLERK_PUBLISHABLE_KEY in client/.env, then restart the Vite server." />
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={publishableKey}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
    </React.StrictMode>
  );
}
