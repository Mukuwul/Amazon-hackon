// The inner-page shell. A slim Amazon-navy bar carrying ONLY the leaf + "Second
// Life" (click → back to the landing) over a centered, responsive content column.
// No search / bell / cart here — those belong to the buyer storefront, not the
// global chrome. This bar appears only after you pick a view from the landing;
// the per-screen TopBar handles back + page title beneath it.
export default function WebShell({ children, onHome }) {
  return (
    <div className="min-h-[100dvh] w-full bg-sl-paper flex flex-col">
      <header className="sticky top-0 z-40 bg-az-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 h-14 flex items-center">
          <button
            onClick={onHome}
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Second Life home"
          >
            <Leaf className="w-6 h-6 text-sl-green-soft" />
            <span className="font-display font-700 text-[16px] tracking-tight leading-none group-hover:text-sl-green-soft transition">
              Second&nbsp;Life
            </span>
          </button>
        </div>
        <div className="h-px bg-az-orange/70" />
      </header>

      <main className="relative flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-5 sm:py-7">
        {children}
      </main>
    </div>
  );
}

function Leaf({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 19c0-7 5-13 14-14 0 9-5 15-14 14Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 15c2.5-2.5 5-4 8-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
