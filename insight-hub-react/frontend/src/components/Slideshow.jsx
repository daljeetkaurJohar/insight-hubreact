import { useEffect, useMemo, useState } from 'react';
import { fmtDate } from '../utils.js';

const SLIDE_MS = 5000;

// Banner at the top: cycles through every image attached to an entry.
export default function Slideshow({ entries }) {
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
