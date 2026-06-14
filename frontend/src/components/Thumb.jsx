import { useState } from "react";

const CAT = {
  footwear: { glyph: "👟", tint: "#e6efe9" },
  electronics: { glyph: "🎧", tint: "#e6edf3" },
  apparel: { glyph: "👕", tint: "#e9ece9" },
  appliances: { glyph: "🧰", tint: "#e7ece9" },
  books: { glyph: "📖", tint: "#eaeeea" },
  home: { glyph: "🧴", tint: "#e6eeeb" },
  bags: { glyph: "🎒", tint: "#e8ece9" },
};

export default function Thumb({ src, alt, category, className = "", glyphScale = 1.7 }) {
  const [failed, setFailed] = useState(!src);
  const cat = CAT[category] || { glyph: "📦", tint: "#eaeeec" };

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
