// Sign-in. Two modes, chosen by VITE_AUTH_MODE in frontend/.env:
//   entra -> Microsoft single sign-on (Tata Steel Office 365 account) using MSAL
//   dev   -> TEST ONLY: you type your name; no Microsoft account needed
import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';

export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || 'entra').toLowerCase();
const TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID;
const CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID;

// The permission ("scope") the app asks Microsoft for, so the backend can check who you are.
// It is created in the Azure app registration under "Expose an API".
const API_SCOPE = `api://${CLIENT_ID}/access_as_user`;

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ── Microsoft single sign-on ────────────────────────────────
export async function createMsal() {
  const msal = new PublicClientApplication({
    auth: {
      clientId: CLIENT_ID,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: { cacheLocation: 'sessionStorage' },
  });
  await msal.initialize();
  const result = await msal.handleRedirectPromise();
  if (result && result.account) msal.setActiveAccount(result.account);
  else if (!msal.getActiveAccount() && msal.getAllAccounts().length) msal.setActiveAccount(msal.getAllAccounts()[0]);
  return msal;
}

function EntraBridge({ children }) {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = instance.getActiveAccount() || instance.getAllAccounts()[0] || null;

  const authHeaders = useCallback(async () => {
    const request = { scopes: [API_SCOPE], account };
    try {
      const r = await instance.acquireTokenSilent(request);
      return { Authorization: `Bearer ${r.accessToken}` };
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect(request);
      }
      throw err;
    }
  }, [instance, account]);

  const value = useMemo(() => ({
    mode: 'entra',
    signedIn: isAuthenticated && !!account,
    displayName: account ? account.name || account.username : '',
    signIn: () => instance.loginRedirect({ scopes: [API_SCOPE] }),
    signOut: () => instance.logoutRedirect({ account }),
    authHeaders,
  }), [isAuthenticated, account, instance, authHeaders]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function EntraAuthProvider({ msal, children }) {
  return (
    <MsalProvider instance={msal}>
      <EntraBridge>{children}</EntraBridge>
    </MsalProvider>
  );
}

// ── Test mode (no Microsoft account) ────────────────────────
const DEV_KEY = 'insighthub_dev_user';
function readDevName() {
  try { return localStorage.getItem(DEV_KEY) || ''; } catch { return ''; }
}

export function DevAuthProvider({ children }) {
  const [name, setName] = useState(readDevName);
  const value = useMemo(() => ({
    mode: 'dev',
    signedIn: !!name,
    displayName: name,
    signIn: (typed) => {
      const n = (typed || '').trim();
      if (!n) return;
      try { localStorage.setItem(DEV_KEY, n); } catch { /* storage blocked: keep for this visit only */ }
      setName(n);
    },
    signOut: () => {
      try { localStorage.removeItem(DEV_KEY); } catch { /* ignore */ }
      setName('');
    },
    authHeaders: async () => ({ 'X-Dev-User': encodeURIComponent(name) }),
  }), [name]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
