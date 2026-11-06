import { useState } from 'react';
import { CHANNELS } from '../channels.js';
import { avatarColor, initials, fmtDate, fmtDateTime, daysAgo } from '../utils.js';

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
export default function EntryCard({ entry, onRate, onComment, onEdit, onDelete, onOpenImage }) {
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
