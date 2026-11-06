import { useEffect } from 'react';

// Full-screen view of an image. Click anywhere or press Escape to close.
export default function Lightbox({ src, onClose }) {
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
