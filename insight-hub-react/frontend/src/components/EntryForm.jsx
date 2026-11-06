import { useEffect, useMemo, useState } from 'react';
import { CHANNELS, CHANNEL_NAMES, NATURES } from '../channels.js';
import { todayStr } from '../utils.js';

const MAX_IMAGES = 10;

// The "Add New Entry" / "Edit Entry" pop-up form.
export default function EntryForm({ userName, entry, onSave, onClose }) {
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
