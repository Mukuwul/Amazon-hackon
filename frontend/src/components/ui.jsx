export function Spinner({ className = "w-5 h-5", stroke = 2.4 }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth={stroke} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}

// sticky bottom CTA bar inside the phone
export function FooterAction({ children, onClick, disabled, loading, variant = "primary", hint }) {
  const base =
    "w-full h-12 rounded-xl font-700 text-[15px] flex items-center justify-center gap-2 transition active:scale-[0.985] disabled:opacity-60 disabled:active:scale-100";
  const styles =
    variant === "primary"
      ? "bg-az-orange text-az-navy hover:bg-az-orange-deep shadow-[0_8px_20px_-8px_rgba(240,136,4,0.7)]"
      : variant === "green"
        ? "bg-sl-green text-white hover:bg-sl-green-deep shadow-[0_8px_22px_-8px_rgba(31,163,122,0.75)]"
        : "bg-white text-sl-ink border border-sl-line hover:bg-sl-paper";
  return (
    <div className="sticky bottom-0 z-30 px-2 pt-4 pb-4 backdrop-blur-sm bg-gradient-to-t from-sl-paper via-sl-paper to-transparent">
      <div className="mx-auto max-w-sm">
        {hint && <p className="text-center text-[11px] text-sl-muted mb-2">{hint}</p>}
        <button onClick={onClick} disabled={disabled || loading} className={`${base} ${styles}`}>
          {loading && <Spinner className="w-4 h-4" />}
          {children}
        </button>
      </div>
    </div>
  );
}

export function SourceTag({ source, model, latency }) {
  const live = source && source.startsWith("live");
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-600"
      style={{
        background: live ? "var(--color-sl-mint)" : "#e9eeec",
        color: live ? "var(--color-sl-green-deep)" : "#5b6964",
      }}
      title={model ? `${model}${latency ? ` · ${latency}ms` : ""}` : undefined}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: live ? "var(--color-sl-green)" : "#a6b0ab" }}
      />
      {live ? `Live AI · ${source.replace("live-", "")}` : "Cached"}
    </span>
  );
}

export function SLBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-sl-mint text-sl-green-deep px-2 py-0.5 text-[10px] font-700 tracking-wide ${className}`}
    >
      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
        <path d="M5 19c0-7 5-13 14-14 0 9-5 15-14 14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      SECOND LIFE
    </span>
  );
}

export function ErrorNote({ children, onRetry }) {
  return (
    <div className="m-4 rounded-xl border border-neg/30 bg-neg/5 p-4 text-sm text-sl-ink anim-fade-in">
      <p className="font-600 text-neg mb-1">Something hiccuped</p>
      <p className="text-sl-muted text-[13px] leading-relaxed">{children}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-[13px] font-700 text-sl-green-deep underline underline-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}
