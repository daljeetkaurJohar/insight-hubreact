// Insight Hub - LAYOUT ONLY version (step 1).
// Uses sample data kept in memory: no server, no database yet.
// Anything you add disappears when you refresh the page - that is expected for now.
import { useEffect, useMemo, useState } from 'react';
import './App.css';

// ───────── utils ─────────
// Small helper functions used across the app.
const AVATAR_COLORS = ['#0f8b8d', '#13294b', '#e8a33d', '#c1495a', '#5b6fb0', '#2e9e6c', '#a25bc4', '#b84c1a', '#3a5ba8'];

function initials(name = '') {
  return name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarColor(name = '') {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

const asDate = (d) => new Date(d + 'T00:00:00');

function monthKey(d) {
  return asDate(d).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function monthSortVal(d) {
  const dt = asDate(d);
  return dt.getFullYear() * 12 + dt.getMonth();
}

function fmtDate(d) {
  return asDate(d).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
  return new Date(iso).toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysAgo(d) {
  return Math.floor((Date.now() - asDate(d).getTime()) / 864e5);
}

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

// ───────── channels ─────────
// The 9 scanning channels, their colours and sub-types (from the BRD / original page).
const CHANNELS = {
  'Literature Sources': { cls: 'lit', icon: '📄', color: '#1c5fa8', bg: '#e6f0fa',
    subtypes: ['In-depth patents & research papers', 'Corporate technical reports & white papers', 'Annual reports from competitors'] },
  'Conferences & Workshops': { cls: 'conf', icon: '🎤', color: '#2e7d52', bg: '#e4f5ec',
    subtypes: ['National conference', 'International conference', 'Targeted micro-conference', 'Archiving conference brochures', 'Post-conference summary distribution'] },
  'Digital Portals': { cls: 'dig', icon: '🌐', color: '#3a5ba8', bg: '#eaefff',
    subtypes: ['ANRF', 'SRTMI', 'DST', 'NITI Aayog', 'Ministry of Steel', 'Ministry of Energy & Environment', 'MNRE', 'Other national portal'] },
  'Customer Insights': { cls: 'cust', icon: '💬', color: '#b84c1a', bg: '#fdeee6',
    subtypes: ['Tech discussion', 'Shop floor experience', 'Customer complaints', 'Supply chain', 'Others'] },
  'Field Exposure-Visits': { cls: 'fld', icon: '🏭', color: '#b5780a', bg: '#fff3e0',
    subtypes: ['Pilot plants & outer industrial sites', 'Global university & Centre of Excellence', 'Tata Steel plants', 'Workshop with plant'] },
  'Market Insights': { cls: 'mkt', icon: '📊', color: '#7c3fa8', bg: '#f0eaff',
    subtypes: ['Comprehensive market research analysis', 'BT²i — Business Technology Intelligence for Innovation', 'TWatch — Multi-partner Technology Intelligence'] },
  'Experiential Learning': { cls: 'exp', icon: '🎓', color: '#0f8b8d', bg: '#e0f5f5',
    subtypes: ['Consultation', 'Training', 'Actionable lessons from failed trials', 'Pan-industry expert panels', 'Startup & Venture Capital ecosystem'] },
  'Specialized Domain': { cls: 'spc', icon: '🔬', color: '#a25bc4', bg: '#f5eaff',
    subtypes: ['Material Next', 'Mind over Matter', 'Women of Mettle'] },
  Others: { cls: 'oth', icon: '🌍', color: '#c1495a', bg: '#fdeaec',
    subtypes: ['Regulatory / Geopolitical policy tracking', 'Joint Development & Supplier Technology Roadmap', 'Linkedin', 'Other'] },
};

const CHANNEL_NAMES = Object.keys(CHANNELS);

const NATURES = [
  { value: 'Observation', label: '🔵 Observation / Experience', cls: 'sel-obs' },
  { value: 'Idea', label: '💡 Research Idea', cls: 'sel-idea' },
  { value: 'Problem', label: '⚠️ Problem Statement', cls: 'sel-problem' },
];

// ───────── Header ─────────
function Header({ userName, onAdd, onSignOut }) {
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

// ───────── Slideshow ─────────
const SLIDE_MS = 5000;

// Banner at the top: cycles through every image attached to an entry.
function Slideshow({ entries }) {
  const slides = useMemo(() => {
    const s = [];
    for (const e of entries) {
      for (const img of e.images) {
        s.push({ key: img.id, src: img.url, title: e.title, author: e.contributor.name, channel: e.channel, date: e.date });
      }
    }
    return s;
  }, [entries]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const current = slides.length ? index % slides.length : 0;

  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    const t = setTimeout(() => { setIndex((i) => (i + 1) % slides.length); setCycle((c) => c + 1); }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [paused, slides.length, current, cycle]);

  const go = (i) => { setIndex((i + slides.length) % slides.length); setCycle((c) => c + 1); };

  if (!slides.length) {
    return (
      <div id="slideshow">
        <div className="slide active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#0a1628 0%,#13294b 55%,#0c3460 100%)' }}>
          <div style={{ textAlign: 'center', padding: '0 24px' }}>
            <div style={{ fontSize: 11, letterSpacing: '.25em', color: '#0f8b8d', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>
              Tata Steel · Research &amp; Development
            </div>
            <div style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 800, color: '#fff', letterSpacing: '.06em', lineHeight: 1.1 }}>INSIGHT HUB</div>
            <div style={{ width: 56, height: 3, background: 'linear-gradient(90deg,#0f8b8d,#1c5fa8)', margin: '18px auto', borderRadius: 2 }} />
            <div style={{ fontSize: 12, color: '#7a90b0', letterSpacing: '.12em' }}>BT²i · CORE SCANNING CHANNELS</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="slideshow" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((s, i) => (
        <div key={s.key} className={'slide' + (i === current ? ' active' : '')}>
          <img src={s.src} alt={s.title} loading="lazy" />
          <div className="slide-caption">
            <div className="s-ch">{s.channel}</div>
            <div className="s-title">{s.title}</div>
            <div className="s-meta">{s.author} · {fmtDate(s.date)}</div>
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <button className="slide-nav prev" onClick={() => go(current - 1)} aria-label="Previous">&#8249;</button>
          <button className="slide-nav next" onClick={() => go(current + 1)} aria-label="Next">&#8250;</button>
          <div className="slide-dots">
            {slides.map((s, i) => (
              <button key={s.key} className={'slide-dot' + (i === current ? ' active' : '')} onClick={() => go(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
          {!paused && <div id="slideProgress" key={`${current}-${cycle}`} style={{ animation: `slideProg ${SLIDE_MS}ms linear forwards` }} />}
        </>
      )}
      <div id="slideCount">{current + 1} / {slides.length}</div>
    </div>
  );
}

// ───────── Stats ─────────
// The row of number tiles under the slideshow.
function Stats({ entries }) {
  const now = new Date();
  const m = now.getMonth(), y = now.getFullYear();
  const d = (e) => new Date(e.date + 'T00:00:00');
  const thisMonth = entries.filter((e) => d(e).getMonth() === m && d(e).getFullYear() === y);
  const yearCount = entries.filter((e) => d(e).getFullYear() === y).length;

  // Top rated post (highest average stars)
  const rated = entries.filter((e) => e.ratings.count > 0);
  const top = rated.length ? rated.reduce((a, b) => (a.ratings.average >= b.ratings.average ? a : b)) : null;

  // Top contributor this month (BRD suggestion)
  const counts = {};
  thisMonth.forEach((e) => { counts[e.contributor.name] = (counts[e.contributor.name] || 0) + 1; });
  const topPerson = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="stats">
      <div className="stat highlight"><div className="num">{thisMonth.length}</div><div className="lbl">{now.toLocaleString('default', { month: 'long' })}</div></div>
      <div className="stat highlight"><div className="num">{yearCount}</div><div className="lbl">In {y}</div></div>
      <div className="stat"><div className="num">{entries.length}</div><div className="lbl">Total entries</div></div>
      <div className="stat"><div className="num">{new Set(entries.map((e) => e.channel)).size}</div><div className="lbl">Channels active</div></div>
      <div className="stat"><div className="num">{entries.filter((e) => e.nature !== 'Observation').length}</div><div className="lbl">Ideas &amp; problems</div></div>
      <div className="stat"><div className="num">{new Set(entries.map((e) => e.contributor.id)).size}</div><div className="lbl">Contributors</div></div>
      <div className="stat highlight">
        <div className="stat-top-name" title={top ? top.contributor.name : ''}>{top ? top.contributor.name : '—'}</div>
        <div className="num" style={{ fontSize: 15, marginTop: 2, color: '#f4c430' }}>
          {top ? '★'.repeat(Math.round(top.ratings.average)) + ' ' + top.ratings.average.toFixed(1) : 'No ratings yet'}
        </div>
        <div className="lbl">Top rated post by</div>
      </div>
      <div className="stat highlight">
        <div className="stat-top-name" title={topPerson ? topPerson[0] : ''}>{topPerson ? topPerson[0] : '—'}</div>
        <div className="num" style={{ fontSize: 15, marginTop: 2 }}>{topPerson ? `${topPerson[1]} entr${topPerson[1] > 1 ? 'ies' : 'y'}` : 'None yet'}</div>
        <div className="lbl">Top contributor this month</div>
      </div>
    </div>
  );
}

// ───────── LatestStrip ─────────
// "Latest Entries": the 3 newest entries.
function LatestStrip({ entries }) {
  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 3);
  const newCount = entries.filter((e) => daysAgo(e.date) <= 7).length;
  if (!latest.length) return null;

  return (
    <div className="latest-section">
      <div className="latest-head">
        <h2>Latest Entries</h2>
        <span className={'pill-new' + (newCount ? ' visible' : '')}>{newCount} new this week</span>
        <hr />
      </div>
      <div className="latest-cards">
        {latest.map((e) => {
          const cfg = CHANNELS[e.channel] || { color: '#555', bg: '#eee' };
          return (
            <div className="lc" key={e.id}>
              {daysAgo(e.date) <= 7 && <span className="lc-new">NEW</span>}
              <span className="lc-ch" style={{ '--cc': cfg.color, '--cb': cfg.bg }}>{e.channel}</span>
              <div className="lc-meta">{e.contributor.name} · {fmtDate(e.date)}</div>
              <div className="lc-title">{e.title}</div>
              <div className="lc-desc">{e.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ───────── EntryCard ─────────
function StarRating({ entry, onRate }) {
  const { average, count, mine } = entry.ratings;
  const [busy, setBusy] = useState(false);
  const rate = async (n) => {
    if (busy) return;
    setBusy(true);
    await onRate(entry.id, n);
    setBusy(false);
  };
  return (
    <div className="rating-row">
      <div className="star-group">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            className={'star-btn' + (i <= mine ? ' my-fill' : i <= Math.round(average) ? ' avg-fill' : '')}
            title={`Rate ${i} star${i > 1 ? 's' : ''}`}
            onClick={() => rate(i)}
            disabled={busy}
          >★</button>
        ))}
      </div>
      <span className="rating-meta">
        {count
          ? <>{average.toFixed(1)} ★ ({count} rating{count > 1 ? 's' : ''})<em> — click to rate</em></>
          : <em>No ratings yet — be first!</em>}
      </span>
    </div>
  );
}

function Comments({ entry, onComment }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setSaving(true);
    const ok = await onComment(entry.id, t);
    setSaving(false);
    if (ok) setText('');
  };
  return (
    <div className="comments-panel open">
      {entry.comments.length === 0 && <div className="no-comments">No comments yet. Be the first to reply.</div>}
      {entry.comments.map((c) => (
        <div className="comment-item" key={c.id}>
          <div className="comment-avatar" style={{ background: avatarColor(c.author) }}>{initials(c.author)}</div>
          <div className="comment-bubble">
            <span className="comment-author">{c.author}</span>
            <span className="comment-date">{fmtDateTime(c.createdAt)}</span>
            <div className="comment-text">{c.text}</div>
          </div>
        </div>
      ))}
      <form className="comment-form" onSubmit={submit}>
        <textarea placeholder="Write a reply or comment…" rows={2} value={text} onChange={(e) => setText(e.target.value)} required />
        <button type="submit" className="comment-submit" disabled={saving}>{saving ? 'Posting…' : 'Post Reply'}</button>
      </form>
    </div>
  );
}

// One entry card in the feed.
function EntryCard({ entry, onRate, onComment, onEdit, onDelete, onOpenImage }) {
  const [showComments, setShowComments] = useState(false);
  const cfg = CHANNELS[entry.channel] || { color: '#555', bg: '#eee' };
  const name = entry.contributor.name;
  const nComments = entry.comments.length;
  const nImages = entry.images.length;

  return (
    <div className="card">
      <div className="card-body">
        <div className="card-badges">
          <span className="badge" style={{ '--cc': cfg.color, '--cb': cfg.bg }}>{entry.channel}</span>
          {entry.nature === 'Idea' && <span className="badge nature-idea">💡 Idea</span>}
          {entry.nature === 'Problem' && <span className="badge nature-problem">⚠️ Problem</span>}
          {daysAgo(entry.date) <= 7 && <span className="badge badge-new-pill">NEW</span>}
        </div>
        <div className="who">
          <div className="avatar" style={{ background: avatarColor(name) }}>{initials(name)}</div>
          <div><div className="name">{name}</div><div className="date">{fmtDate(entry.date)}</div></div>
        </div>
        <h3>{entry.title}</h3>
        {entry.subType && <div className="sub">{entry.subType}</div>}
        {entry.source && <div className="sub" style={{ color: 'var(--muted)', fontWeight: 400 }}>{entry.source}</div>}
        {entry.location && <div className="card-location">📍 <span>{entry.location}</span></div>}
        <p style={{ whiteSpace: 'pre-line' }}>{entry.description}</p>
      </div>

      {nImages > 0 && (
        <div className="card-imgs">
          {entry.images.map((img) => (
            <img key={img.id} className="card-img-thumb" src={img.url} alt="" onClick={() => onOpenImage(img.url)} />
          ))}
        </div>
      )}

      <StarRating entry={entry} onRate={onRate} />

      <div className="card-footer">
        <button className={'comment-toggle' + (nComments ? ' has-comments' : '')} onClick={() => setShowComments((s) => !s)}>
          💬 {nComments ? `${nComments} comment${nComments > 1 ? 's' : ''}` : 'Reply / Comment'}
        </button>
        {nImages > 0 && <span className="img-count">🖼 {nImages} image{nImages > 1 ? 's' : ''}</span>}
        {entry.isMine && (
          <div className="owner-actions">
            <button onClick={() => onEdit(entry)}>Edit</button>
            <button className="del" onClick={() => onDelete(entry)}>Delete</button>
          </div>
        )}
      </div>

      {showComments && <Comments entry={entry} onComment={onComment} />}
    </div>
  );
}

// ───────── EntryForm ─────────
const MAX_IMAGES = 10;

// The "Add New Entry" / "Edit Entry" pop-up form.
function EntryForm({ userName, entry, onSave, onClose }) {
  const editing = !!entry;
  const [form, setForm] = useState(() => ({
    channel: entry?.channel || '',
    subType: entry?.subType || '',
    nature: entry?.nature || 'Observation',
    title: entry?.title || '',
    source: entry?.source || '',
    location: entry?.location || '',
    date: entry?.date || todayStr(),
    description: entry?.description || '',
  }));
  const [files, setFiles] = useState([]);
  const [removeIds, setRemoveIds] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const previews = useMemo(() => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  // Close with the Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const subtypes = form.channel ? CHANNELS[form.channel].subtypes : [];
  const keptImages = (entry?.images || []).filter((i) => !removeIds.includes(i.id)).length;

  const pickFiles = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (keptImages + chosen.length > MAX_IMAGES) {
      setError(`You can attach up to ${MAX_IMAGES} images in total.`);
      e.target.value = '';
      return;
    }
    setError('');
    setFiles(chosen);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.channel) { setError('Please choose a scanning channel.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form, files, removeIds);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay show" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal">
        <h2>{editing ? 'Edit Entry' : 'Add New Entry'}</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label>Contributor</label>
            <input type="text" readOnly value={editing ? entry.contributor.name : userName} />
          </div>

          <div className="field">
            <label>Scanning channel *</label>
            <div className="channel-grid">
              {CHANNEL_NAMES.map((ch) => (
                <div
                  key={ch}
                  role="button"
                  tabIndex={0}
                  className={`ch-btn ${CHANNELS[ch].cls}` + (form.channel === ch ? ' selected' : '')}
                  onClick={() => setForm((f) => ({ ...f, channel: ch, subType: '' }))}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setForm((f) => ({ ...f, channel: ch, subType: '' })); } }}
                >{CHANNELS[ch].icon} {ch}</div>
              ))}
            </div>
          </div>

          {subtypes.length > 0 && (
            <div className="field">
              <label>Sub-type</label>
              <select value={form.subType} onChange={set('subType')}>
                <option value="">Select sub-type…</option>
                {subtypes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div className="field">
            <label>Nature of entry *</label>
            <div className="nature-row">
              {NATURES.map((n) => (
                <label key={n.value} className={'nature-opt' + (form.nature === n.value ? ' ' + n.cls : '')}>
                  <input type="radio" name="nature" value={n.value} checked={form.nature === n.value} onChange={set('nature')} />
                  {n.label}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Title *</label>
            <input type="text" required maxLength={300} placeholder="Short headline for this entry" value={form.title} onChange={set('title')} />
          </div>
          <div className="field">
            <label>Source / Event / Portal name</label>
            <input type="text" maxLength={300} placeholder="e.g. ICML 2026 · ANRF · Tata Steel Jamshedpur" value={form.source} onChange={set('source')} />
          </div>
          <div className="field">
            <label>Location</label>
            <input type="text" maxLength={300} placeholder="e.g. Jamshedpur · IIT Bombay, Mumbai · Geneva, Switzerland" value={form.location} onChange={set('location')} />
          </div>
          <div className="field">
            <label>Date *</label>
            <input type="date" required value={form.date} onChange={set('date')} />
          </div>
          <div className="field">
            <label>Description *</label>
            <textarea required placeholder="Describe the experience, idea, or problem in detail…" value={form.description} onChange={set('description')} />
          </div>

          <div className="field">
            <label>{editing ? 'Images' : 'Attach images (optional — shown in the slideshow)'}</label>
            {editing && entry.images.length > 0 && (
              <div className="existing-imgs">
                {entry.images.map((img) => {
                  const removed = removeIds.includes(img.id);
                  return (
                    <div key={img.id} className={'existing-img' + (removed ? ' removed' : '')}>
                      <img className="img-thumb" src={img.url} alt="" />
                      <button type="button" title={removed ? 'Keep this image' : 'Remove this image'}
                        onClick={() => setRemoveIds((ids) => (removed ? ids.filter((x) => x !== img.id) : [...ids, img.id]))}>
                        {removed ? '↺' : '×'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple onChange={pickFiles} style={{ marginTop: 8 }} />
            {previews.length > 0 && (
              <div className="img-preview-strip">
                {previews.map((p) => <img key={p.url} className="img-thumb" src={p.url} alt={p.name} />)}
              </div>
            )}
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Save Entry'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ───────── Lightbox ─────────
// Full-screen view of an image. Click anywhere or press Escape to close.
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!src) return null;
  return (
    <div id="lightbox" className="show" onClick={onClose}>
      <button id="lightbox-close" onClick={onClose} aria-label="Close">&times;</button>
      <img src={src} alt="" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// ───────── Sample data (replaced by the database in step 2) ─────────
const ME = { id: 1, name: 'Sudeshna Das Chakraborty' };
const today = todayStr();
const SAMPLE_ENTRIES = [
  { id: 3, title: 'Hydrogen-based DRI pilot visit', channel: 'Field Exposure-Visits', subType: 'Tata Steel plants',
    nature: 'Idea', source: 'Tata Steel Jamshedpur', location: 'Jamshedpur', date: today,
    description: 'Visited the new hydrogen DRI pilot. Possible collaboration with Process R&D on reduction kinetics.',
    contributor: ME, isMine: true, images: [],
    comments: [{ id: 1, author: 'Ravi Kumar', text: 'Let us set up a meeting with the pilot team.', createdAt: new Date().toISOString() }],
    ratings: { count: 2, average: 4.5, mine: 5 } },
  { id: 2, title: 'Review of EAF slag valorisation papers', channel: 'Literature Sources', subType: 'In-depth patents & research papers',
    nature: 'Observation', source: 'ScienceDirect', location: '', date: today,
    description: 'Summary of 12 recent papers on using EAF slag in construction materials.',
    contributor: { id: 2, name: 'Ravi Kumar' }, isMine: false, images: [], comments: [],
    ratings: { count: 1, average: 3, mine: 0 } },
  { id: 1, title: 'Customer complaint on coil edge cracking', channel: 'Customer Insights', subType: 'Customer complaints',
    nature: 'Problem', source: 'Auto OEM visit', location: 'Pune', date: '2026-10-14',
    description: 'Edge cracking seen on high-strength coils during stamping. Needs root-cause study.',
    contributor: { id: 3, name: 'Anita Sharma' }, isMine: false, images: [], comments: [],
    ratings: { count: 0, average: 0, mine: 0 } },
];

// ───────── App (the main page) ─────────
export default function App() {
  const [entries, setEntries] = useState(SAMPLE_ENTRIES);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [month, setMonth] = useState('');
  const [formEntry, setFormEntry] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const update = (id, fn) => setEntries((list) => list.map((e) => (e.id === id ? fn(e) : e)));

  const handleSave = async (fields, files, removeIds) => {
    const images = files.map((f, i) => ({ id: Date.now() + i, url: URL.createObjectURL(f) }));
    if (formEntry && formEntry.id) {
      update(formEntry.id, (e) => ({ ...e, ...fields, images: [...e.images.filter((i) => !removeIds.includes(i.id)), ...images] }));
    } else {
      const id = Date.now();
      setEntries((list) => [{ id, ...fields, contributor: ME, isMine: true, images, comments: [],
        ratings: { count: 0, average: 0, mine: 0 } }, ...list]);
    }
    setFormEntry(null);
  };

  const handleRate = async (id, stars) => update(id, (e) => {
    const r = e.ratings;
    const total = r.average * r.count - (r.mine || 0) + stars;
    const count = r.mine ? r.count : r.count + 1;
    return { ...e, ratings: { count, average: total / count, mine: stars } };
  });

  const handleComment = async (id, text) => {
    update(id, (e) => ({ ...e, comments: [...e.comments, { id: Date.now(), author: ME.name, text, createdAt: new Date().toISOString() }] }));
    return true;
  };

  const handleDelete = (entry) => {
    if (window.confirm(`Delete "${entry.title}"?`)) setEntries((list) => list.filter((e) => e.id !== entry.id));
  };

  const months = useMemo(() => {
    const byKey = {};
    entries.forEach((e) => { byKey[monthKey(e.date)] = monthSortVal(e.date); });
    return Object.keys(byKey).sort((a, b) => byKey[b] - byKey[a]);
  }, [entries]);

  const filtered = entries
    .filter((e) => {
      if (tab === 'ideas' && e.nature === 'Observation') return false;
      if (channel && e.channel !== channel) return false;
      if (month && monthKey(e.date) !== month) return false;
      const q = search.trim().toLowerCase();
      if (q && ![e.contributor.name, e.title, e.description, e.channel, e.source, e.subType, e.location].join(' ').toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const groups = [];
  for (const e of filtered) {
    const k = monthKey(e.date);
    const last = groups[groups.length - 1];
    if (last && last.key === k) last.items.push(e); else groups.push({ key: k, items: [e] });
  }

  return (
    <>
      <Header userName={ME.name} onAdd={() => setFormEntry({})} onSignOut={() => alert('Sign-in comes in a later step.')} />
      <Slideshow entries={entries} />
      <div className="container">
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
          <button className="btn ghost" onClick={() => { setSearch(''); setChannel(''); setMonth(''); }}>Reset</button>
        </div>
        {groups.length === 0 ? (
          <div className="empty">No entries match your filters.</div>
        ) : groups.map((g) => (
          <div className="month-group" key={g.key}>
            <div className="month-head"><h2>{g.key}</h2><span className="count">{g.items.length}</span><hr /></div>
            <div className="cards">
              {g.items.map((e) => (
                <EntryCard key={e.id} entry={e} onRate={handleRate} onComment={handleComment}
                  onEdit={setFormEntry} onDelete={handleDelete} onOpenImage={setLightbox} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <footer>Tata Steel R&amp;D Insight Hub · BT²i Core Scanning Channels</footer>
      <footer>Created by Dr Sudeshna Das Chakraborty</footer>
      {formEntry && (
        <EntryForm userName={ME.name} entry={formEntry.id ? formEntry : null} onSave={handleSave} onClose={() => setFormEntry(null)} />
      )}
      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}
