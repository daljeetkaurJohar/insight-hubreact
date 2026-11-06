import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './auth.jsx';
import { makeApi } from './api.js';
import { CHANNEL_NAMES } from './channels.js';
import { monthKey, monthSortVal } from './utils.js';
import SignIn from './components/SignIn.jsx';
import Header from './components/Header.jsx';
import Slideshow from './components/Slideshow.jsx';
import Stats from './components/Stats.jsx';
import LatestStrip from './components/LatestStrip.jsx';
import EntryCard from './components/EntryCard.jsx';
import EntryForm from './components/EntryForm.jsx';
import Lightbox from './components/Lightbox.jsx';

export default function App() {
  const auth = useAuth();
  if (!auth.signedIn) return <SignIn />;
  return <Hub />;
}

// The main Insight Hub page, shown after sign-in.
function Hub() {
  const auth = useAuth();
  const api = useMemo(() => makeApi(auth.authHeaders), [auth.authHeaders]);

  const [me, setMe] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [month, setMonth] = useState('');

  const [formEntry, setFormEntry] = useState(null); // null = closed, {} = new, entry = edit
  const [lightbox, setLightbox] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [user, list] = await Promise.all([api.me(), api.listEntries()]);
      setMe(user);
      setEntries(list);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  // Replace one entry in the list after the server sends back its new version.
  const replaceEntry = (updated) => setEntries((list) => list.map((e) => (e.id === updated.id ? updated : e)));

  const handleSave = async (fields, files, removeIds) => {
    if (formEntry && formEntry.id) {
      replaceEntry(await api.updateEntry(formEntry.id, fields, files, removeIds));
    } else {
      const created = await api.createEntry(fields, files);
      setEntries((list) => [created, ...list]);
    }
    setFormEntry(null);
  };

  const handleRate = async (id, stars) => {
    try { replaceEntry(await api.rate(id, stars)); } catch (err) { setError('Could not save rating: ' + err.message); }
  };

  const handleComment = async (id, text) => {
    try { replaceEntry(await api.addComment(id, text)); return true; } catch (err) { setError('Could not save comment: ' + err.message); return false; }
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    try {
      await api.deleteEntry(entry.id);
      setEntries((list) => list.filter((e) => e.id !== entry.id));
    } catch (err) {
      setError('Could not delete entry: ' + err.message);
    }
  };

  // Filters
  const months = useMemo(() => {
    const byKey = {};
    entries.forEach((e) => { byKey[monthKey(e.date)] = monthSortVal(e.date); });
    return Object.keys(byKey).sort((a, b) => byKey[b] - byKey[a]);
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => {
        if (tab === 'ideas' && e.nature === 'Observation') return false;
        if (channel && e.channel !== channel) return false;
        if (month && monthKey(e.date) !== month) return false;
        if (q) {
          const hay = [e.contributor.name, e.title, e.description, e.channel, e.source, e.subType, e.location].join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [entries, tab, search, channel, month]);

  const groups = useMemo(() => {
    const g = [];
    for (const e of filtered) {
      const k = monthKey(e.date);
      const last = g[g.length - 1];
      if (last && last.key === k) last.items.push(e);
      else g.push({ key: k, items: [e] });
    }
    return g;
  }, [filtered]);

  const reset = () => { setSearch(''); setChannel(''); setMonth(''); };

  return (
    <>
      <Header userName={me ? me.name : auth.displayName} onAdd={() => setFormEntry({})} onSignOut={auth.signOut} />
      <Slideshow entries={entries} />

      <div className="container">
        {error && (
          <div className="banner">
            <span>{error}</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button onClick={load} title="Try again">↻</button>
              <button onClick={() => setError('')} title="Close">×</button>
            </span>
          </div>
        )}

        <Stats entries={entries} />
        <LatestStrip entries={entries} />

        <div className="tabs">
          <div className={'tab' + (tab === 'all' ? ' active' : '')} onClick={() => setTab('all')}>All Entries</div>
          <div className={'tab' + (tab === 'ideas' ? ' active' : '')} onClick={() => setTab('ideas')}>Ideas &amp; Problems</div>
        </div>

        <div className="filters">
          <input type="text" placeholder="Search by name, title, keyword…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">All channels</option>
            {CHANNEL_NAMES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">All months</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="btn ghost" onClick={reset}>Reset</button>
        </div>

        {loading ? (
          <div className="loading-box"><div className="spinner" />Loading entries…</div>
        ) : groups.length === 0 ? (
          tab === 'ideas' ? (
            <div className="empty">
              💡 <strong>No Ideas or Problems logged yet.</strong><br /><br />
              When researchers add entries with Nature = <em>Idea</em> or <em>Problem</em>, they will appear here.
            </div>
          ) : (
            <div className="empty">{entries.length ? 'No entries match your filters.' : 'No entries yet. Click + Add Entry to add the first one.'}</div>
          )
        ) : (
          groups.map((g) => (
            <div className="month-group" key={g.key}>
              <div className="month-head"><h2>{g.key}</h2><span className="count">{g.items.length}</span><hr /></div>
              <div className="cards">
                {g.items.map((e) => (
                  <EntryCard
                    key={e.id}
                    entry={e}
                    onRate={handleRate}
                    onComment={handleComment}
                    onEdit={setFormEntry}
                    onDelete={handleDelete}
                    onOpenImage={setLightbox}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <footer>Tata Steel R&amp;D Insight Hub · BT²i Core Scanning Channels</footer>
      <footer>Created by Dr Sudeshna Das Chakraborty</footer>

      {formEntry && (
        <EntryForm
          userName={me ? me.name : auth.displayName}
          entry={formEntry.id ? formEntry : null}
          onSave={handleSave}
          onClose={() => setFormEntry(null)}
        />
      )}
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}
