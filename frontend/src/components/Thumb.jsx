import { useState } from "react";

const CAT = {
  footwear: { glyph: "👟", tint: "#e6efe9" },
  electronics: { glyph: "🎧", tint: "#e6edf3" },
  apparel: { glyph: "👕", tint: "#efe9e3" },
  appliances: { glyph: "🧰", tint: "#ece9e1" },
  books: { glyph: "📖", tint: "#efe8df" },
  home: { glyph: "🧴", tint: "#e6eeeb" },
  bags: { glyph: "🎒", tint: "#ebe8e2" },
};

export default function Thumb({ src, alt, category, className = "", glyphScale = 1.7 }) {
  const [failed, setFailed] = useState(!src);
  const cat = CAT[category] || { glyph: "📦", tint: "#ededed" };

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ background: cat.tint }}
        role="img"
        aria-label={alt}
      >
        <span style={{ fontSize: `${glyphScale}em`, opacity: 0.5, filter: "grayscale(0.25)" }}>
          {cat.glyph}
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
