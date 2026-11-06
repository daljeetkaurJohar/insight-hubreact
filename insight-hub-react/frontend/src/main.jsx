// Starting point of the React app.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AUTH_MODE, createMsal, EntraAuthProvider, DevAuthProvider } from './auth.jsx';
import './styles.css';

const root = createRoot(document.getElementById('root'));

async function start() {
  if (AUTH_MODE === 'dev') {
    root.render(
      <StrictMode>
        <DevAuthProvider><App /></DevAuthProvider>
      </StrictMode>
    );
    return;
  }
  try {
    const msal = await createMsal();
    root.render(
      <StrictMode>
        <EntraAuthProvider msal={msal}><App /></EntraAuthProvider>
      </StrictMode>
    );
  } catch (err) {
    root.render(
      <div className="signin-screen"><div className="signin-card">
        <h1>Sign-in problem</h1>
        <p>{err.message}</p>
        <p>Check VITE_AZURE_TENANT_ID and VITE_AZURE_CLIENT_ID in frontend\.env</p>
      </div></div>
    );
  }
}

start();
