import { useState } from "react";

// Landing page — MT13 reskin: the brand identity relit on the whitish aurora canvas
// (emerald light pooled in the corners + micro-grain), no longer the dark stage.
// Brand rail on the left (every product finds its next best owner + the live-engine
// line); where the phone used to sit, three door-cards forward into the console:
// Returns desk (Ops) · Buyer · Seller. No top bar here — the slim Amazon chrome
// appears only after you pick a view (WebShell wraps the inner pages, not this landing).
//
// Top-right: a guest login. Picking a role mints a UNIQUE per-browser id (so resell
// "My resells" vs "Flash deals" and return attribution are distinct per person); the
// id sticks while the three big buttons forward into each view.
const ROLES = [
  { key: "buyer", label: "Buyer", hint: "shop + resell what you own" },
  { key: "seller", label: "Seller", hint: "see returns + the AI fix" },
  { key: "ops", label: "Returns desk", hint: "grade + route returns" },
];

export default function Home({ onOps, onBuyer, onSeller, guest, onPickRole, onNewGuest }) {
  return (
    <div className="aurora-bg aurora-grain relative min-h-[100dvh] w-full flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 p-6 sm:p-8">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <GuestMenu guest={guest} onPickRole={onPickRole} onNewGuest={onNewGuest} />
      </div>
      {/* brand rail — context that this is a layer inside Amazon */}
      <aside className="flex flex-col max-w-sm">
        <div className="flex items-center gap-2 mb-7">
          <Leaf className="w-7 h-7 text-sl-green" />
          <span className="font-display font-700 text-xl tracking-tight text-az-navy">Second Life</span>
        </div>
        <h1 className="font-display font-700 text-[2.2rem] sm:text-[2.6rem] leading-[1.05] tracking-tight text-az-navy text-balance">
          Every product finds its next&nbsp;best owner.
        </h1>
        <p className="mt-5 text-sl-muted text-[15px] leading-relaxed text-pretty">
          Second life where product fate is decided on first touch. An intelligent layer inside the Amazon returns flow. AI delta-grades each item against its
          own day-0 photos, then routes it to the highest-rupee second life, before it ever reaches
          a warehouse.
        </p>
        <div className="mt-8 flex items-center gap-2 text-sl-muted text-xs">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-sl-green animate-pulse" />
          Live demo · connected to the deployed grading engine
        </div>
      </aside>

      {/* three doors into the console — where the phone used to be */}
      <div className="w-full max-w-[400px] shrink-0 flex flex-col gap-3.5">
        <ViewButton
          onClick={onOps}
          primary
          label="Returns desk"
          role="Ops · grade returns & route each to its best second life"
          icon={<BoxIcon />}
        />
        <ViewButton
          onClick={onBuyer}
          label="Buyer"
          role="Rahul · shop with fit proof, resell what you already own"
          icon={<CartIcon />}
        />
        <ViewButton
          onClick={onSeller}
          label="Seller"
          role="Vastram · see which listings drive returns + the AI fix"
          icon={<StoreIcon />}
        />
      </div>
    </div>
  );
}

function ViewButton({ onClick, label, role, icon, primary }) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-2xl px-5 py-4 flex items-center gap-4 ring-1 transition hover:-translate-y-0.5 active:translate-y-0 ${
        primary
          ? "bg-sl-green text-white ring-sl-green-deep/25 shadow-pop hover:bg-sl-green-deep"
          : "bg-white text-az-navy ring-sl-line shadow-card hover:ring-sl-green/40 hover:shadow-pop"
      }`}
    >
      <span
        className={`w-11 h-11 shrink-0 rounded-xl grid place-items-center ${
          primary ? "bg-white/15 text-white" : "bg-sl-mint text-sl-green-deep"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display font-700 text-[18px] leading-none">{label}</span>
          {primary && (
            <span className="text-[10px] font-800 tracking-wide text-white/85 border border-white/30 rounded-full px-1.5 py-0.5">
              START HERE
            </span>
          )}
        </span>
        <span className={`mt-1 block text-[12.5px] leading-snug ${primary ? "text-white/85" : "text-sl-muted"}`}>
          {role}
        </span>
      </span>
      <svg viewBox="0 0 24 24" className={`w-5 h-5 shrink-0 transition group-hover:translate-x-0.5 ${primary ? "opacity-70 group-hover:opacity-100" : "text-sl-muted opacity-60 group-hover:opacity-100 group-hover:text-sl-green"}`} fill="none">
        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function GuestMenu({ guest, onPickRole, onNewGuest }) {
  const [open, setOpen] = useState(false);
  const roleLabel = guest?.role ? ROLES.find((r) => r.key === guest.role)?.label : null;

  return (
    <div className="relative">
      {open && <button className="fixed inset-0 z-0 cursor-default" aria-label="Close" onClick={() => setOpen(false)} />}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative z-10 flex items-center gap-2 rounded-full bg-white ring-1 ring-sl-line shadow-card px-3.5 py-2 text-az-navy text-[13px] font-700 hover:ring-sl-green/40 hover:bg-sl-mint/40 transition"
      >
        <UserIcon />
        {guest ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sl-green" />
            {guest.id}
            {roleLabel && <span className="text-sl-muted font-600">· {roleLabel}</span>}
          </span>
        ) : (
          <span>Sign in as guest</span>
        )}
        <svg viewBox="0 0 24 24" className={`w-3.5 h-3.5 text-sl-muted transition ${open ? "rotate-180" : ""}`} fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-10 w-60 rounded-2xl bg-white ring-1 ring-sl-line shadow-pop p-1.5 anim-fade-up">
          <p className="px-3 pt-2 pb-1.5 text-[10.5px] font-800 uppercase tracking-wider text-sl-muted">
            {guest ? "Switch role" : "Continue as a guest"}
          </p>
          {ROLES.map((r) => {
            const active = guest?.role === r.key;
            return (
              <button
                key={r.key}
                onClick={() => { onPickRole(r.key); setOpen(false); }}
                className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition ${
                  active ? "bg-sl-mint ring-1 ring-sl-green/30" : "hover:bg-sl-paper"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-700 text-az-navy leading-none">{r.label}</span>
                  <span className="block mt-1 text-[11.5px] text-sl-muted leading-none">{r.hint}</span>
                </span>
                {active && <span className="text-[10px] font-800 text-sl-green-deep">YOU</span>}
              </button>
            );
          })}
          {guest && (
            <button
              onClick={() => { onNewGuest(); setOpen(false); }}
              className="w-full text-left rounded-xl px-3 py-2.5 mt-0.5 border-t border-sl-line text-[12px] font-600 text-sl-muted hover:bg-sl-paper transition"
            >
              + New guest identity
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
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
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M3 8l9-5 9 5-9 5-9-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M3 4h2l2.5 12h11L21 7H6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" />
    </svg>
  );
}
function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M4 9V6l1.5-2h13L20 6v3a2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5 11v8h14v-8M9 19v-4h4v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
