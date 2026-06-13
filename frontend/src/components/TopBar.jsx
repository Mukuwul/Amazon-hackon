// Per-screen page header (MT9, de-phoned): a light context bar inside the content
// column with a back control, page title, and an optional right slot. The persistent
// Amazon chrome lives in WebShell; this is the page-level breadcrumb.
export default function TopBar({ title, subtitle, onBack, right, flush }) {
  return (
    <div className={`flex items-center gap-3 ${flush ? "" : "mb-4 pb-3 border-b border-sl-line"}`}>
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 grid place-items-center rounded-full bg-white ring-1 ring-sl-line text-sl-ink hover:bg-sl-paper hover:ring-az-steel/40 active:scale-95 transition shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display font-700 leading-tight truncate text-[20px] sm:text-[22px] text-sl-ink">{title}</h1>
        {subtitle && <p className="text-sl-muted text-[12.5px] leading-tight truncate mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
