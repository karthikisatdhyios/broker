import { useState } from 'react';

export default function PhotoCarousel({ photos = [], alt = '', height = 150 }) {
  const [idx, setIdx] = useState(0);
  const [hidden, setHidden] = useState({});

  const valid = photos.filter((_, i) => !hidden[i]);
  if (valid.length === 0) return null;

  // Clamp index if some images failed to load.
  const current = Math.min(idx, valid.length - 1);
  const go = (delta) => setIdx((i) => (i + delta + valid.length) % valid.length);

  return (
    <div className="carousel" style={{ height, marginTop: 10 }}>
      <img
        className="carousel-img"
        src={valid[current]}
        alt={alt}
        onError={() => {
          const realIdx = photos.indexOf(valid[current]);
          setHidden((h) => ({ ...h, [realIdx]: true }));
        }}
      />

      {valid.length > 1 && (
        <>
          <button type="button" className="carousel-btn prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
          <button type="button" className="carousel-btn next" onClick={() => go(1)} aria-label="Next photo">›</button>
          <div className="carousel-count">{current + 1} / {valid.length}</div>
          <div className="carousel-dots">
            {valid.map((_, i) => (
              <span
                key={i}
                className={`carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
