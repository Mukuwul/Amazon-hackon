export default function TopBar({ title, subtitle, onBack, right, flush }) {
  return (
    <div className="sticky top-0 z-30">
      {/* iOS status row */}
      <div className="bg-az-navy text-white flex items-center justify-between px-6 pt-3 pb-1 text-[13px] font-600">
        <span className="tnum">9:41</span>
        <div className="flex items-center gap-1.5">
          <Signal />
          <Wifi />
          <Battery />
        </div>
      </div>

      {/* amazon nav row */}
      <div className="bg-az-navy text-white px-3.5 pb-2.5 flex items-center gap-2">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Back"
            className="w-8 h-8 -ml-1 grid place-items-center rounded-full hover:bg-white/10 active:scale-95 transition"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 pl-1">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-sl-green-soft" fill="none">
              <path
                d="M5 19c0-7 5-13 14-14 0 9-5 15-14 14Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-display font-700 leading-tight truncate text-[15px]">{title}</div>
          {subtitle && <div className="text-white/55 text-[11px] leading-tight truncate">{subtitle}</div>}
        </div>
        {right}
      </div>
      {!flush && <div className="h-px bg-az-orange/70" />}
    </div>
  );
}

const Signal = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">
    <rect x="0" y="8" width="3" height="4" rx="1" />
    <rect x="4.5" y="5.5" width="3" height="6.5" rx="1" />
    <rect x="9" y="3" width="3" height="9" rx="1" />
    <rect x="13.5" y="0.5" width="3" height="11.5" rx="1" />
  </svg>
);
const Wifi = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
    <path d="M8 11.2 10 8.7a3.2 3.2 0 0 0-4 0L8 11.2Z" />
    <path d="M8 5.2c1.8 0 3.5.7 4.7 1.9l1.3-1.6A9 9 0 0 0 8 3.2 9 9 0 0 0 2 5.5l1.3 1.6A6.8 6.8 0 0 1 8 5.2Z" />
  </svg>
);
const Battery = () => (
  <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden="true">
    <rect x="0.7" y="0.7" width="21" height="11.6" rx="3" stroke="currentColor" strokeOpacity="0.5" />
    <rect x="2.3" y="2.3" width="16" height="8.4" rx="1.6" fill="currentColor" />
    <rect x="23" y="4" width="2" height="5" rx="1" fill="currentColor" fillOpacity="0.5" />
  </svg>
);
