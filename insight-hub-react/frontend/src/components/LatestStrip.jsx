import { CHANNELS } from '../channels.js';
import { fmtDate, daysAgo } from '../utils.js';

// "Latest Entries": the 3 newest entries.
export default function LatestStrip({ entries }) {
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
