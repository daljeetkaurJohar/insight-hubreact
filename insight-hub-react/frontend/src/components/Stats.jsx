// The row of number tiles under the slideshow.
export default function Stats({ entries }) {
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
