import { initials } from '../utils.js';

export default function Header({ userName, onAdd, onSignOut }) {
  return (
    <header>
      <div>
        <h1>Tata Steel R&amp;D Insight Hub</h1>
        <p>BT²i · Core Scanning Channels · Institute Knowledge Repository</p>
      </div>
      <div className="toolbar">
        {userName && (
          <div className="user-chip">
            <div className="uc-av">{initials(userName)}</div>
            <div>
              <div>{userName}</div>
              <button className="signout" onClick={onSignOut}>Sign out</button>
            </div>
          </div>
        )}
        <button className="btn" onClick={onAdd}>+ Add Entry</button>
      </div>
    </header>
  );
}
