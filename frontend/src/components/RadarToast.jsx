export default function RadarToast({ title = "Idle Asset Radar · ping sent", message, onClose }) {
  if (!message) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 z-50 px-4 pb-5">
      <div
        className="relative overflow-hidden rounded-2xl bg-sl-green-deep text-white shadow-pop px-4 py-3.5 flex items-center gap-3.5"
        style={{ animation: "slideUpToast 0.55s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        {/* radar ping */}
        <div className="relative shrink-0 w-11 h-11 grid place-items-center">
          <span className="absolute inset-0 rounded-full border border-sl-green-soft/70" style={{ animation: "pingRing 1.8s ease-out infinite" }} />
          <span className="absolute inset-0 rounded-full border border-sl-green-soft/70" style={{ animation: "pingRing 1.8s ease-out infinite 0.9s" }} />
          <span className="w-9 h-9 rounded-full bg-sl-green-soft/20 grid place-items-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-sl-green-soft" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" />
            </svg>
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display font-700 text-[14px] leading-tight">{title}</p>
          <p className="text-white/80 text-[12px] leading-snug mt-0.5">{message}</p>
        </div>

        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 w-7 h-7 grid place-items-center rounded-full hover:bg-white/15 active:scale-95 transition"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
