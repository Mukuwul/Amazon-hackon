// The web console shell (MT9) — replaces the phone frame. A persistent Amazon-navy
// top bar (brand + search + bell + cart) over a centered, responsive content column.
// The document scrolls normally; per-screen TopBar handles back + page title.
export default function WebShell({ children, onHome, cartCount = 0, onCart }) {
  return (
    <div className="min-h-[100dvh] w-full bg-sl-paper flex flex-col">
      {/* global brand bar */}
      <header className="sticky top-0 z-40 bg-az-navy text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={onHome}
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Second Life home"
          >
            <Leaf className="w-6 h-6 text-sl-green-soft" />
            <span className="font-display font-700 text-[16px] tracking-tight leading-none group-hover:text-sl-green-soft transition">
              Second&nbsp;Life
            </span>
            <span className="hidden sm:inline text-white/40 text-[11px] leading-none border-l border-white/15 pl-2">
              a layer inside Amazon
            </span>
          </button>

          {/* search (visual chrome — the console isn't a search app) */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <div className="mx-auto max-w-md flex items-center gap-2 rounded-lg bg-white/95 text-sl-muted px-3 h-9">
              <SearchIcon />
              <span className="text-[12.5px] truncate">Search returns, idle items & listings</span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <button className="relative w-9 h-9 grid place-items-center rounded-full hover:bg-white/10 transition" aria-label="Notifications">
              <BellIcon />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-az-orange" />
            </button>
            <button
              onClick={onCart}
              className="relative flex items-center gap-1.5 h-9 px-3 rounded-full hover:bg-white/10 transition"
              aria-label="Cart"
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-az-orange text-az-navy text-[10px] font-800 tnum leading-none">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="h-px bg-az-orange/70" />
      </header>

      {/* page content */}
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
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M3 4h2l2.5 12h11L21 7H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}
