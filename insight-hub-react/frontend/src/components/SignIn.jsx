import { useState } from 'react';
import { useAuth } from '../auth.jsx';

// The first screen people see before they sign in.
export default function SignIn() {
  const auth = useAuth();
  const [name, setName] = useState('');

  return (
    <div className="signin-screen">
      <div className="signin-card">
        <div className="kicker">Tata Steel · Research &amp; Development</div>
        <h1>INSIGHT HUB</h1>
        <p>BT²i · Core Scanning Channels · Institute Knowledge Repository</p>

        {auth.mode === 'entra' ? (
          <button className="btn" onClick={() => auth.signIn()}>Sign in with Microsoft</button>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); auth.signIn(name); }}>
            <input
              autoFocus
              placeholder="Type your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="btn" type="submit" disabled={!name.trim()}>Continue</button>
            <div className="dev-note">Test mode: no Microsoft sign-in. Switch to single sign-on before real use.</div>
          </form>
        )}
      </div>
    </div>
  );
}
