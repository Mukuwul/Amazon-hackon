import { inr } from "../lib/format";

// Web landing (MT9, de-phoned). The persona launcher for the whole lifecycle a
// product can hit: Prevent (buyer + seller) → Recover (the live spine) → Recirculate
// (resell). Ops is the existing returns console, untouched. Same three options as the
// phone home, re-laid as a responsive web grid.
export default function Home({ metrics, onOps, onBuyer, onSeller }) {
  return (
    <div className="screen-page anim-fade-up">
      {/* hero / identity band */}
      <section className="relative overflow-hidden rounded-3xl bg-az-slate text-white px-6 sm:px-10 py-8 sm:py-11 shadow-card">
        <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-sl-green/20 blur-3xl" />
        <div className="absolute right-24 top-10 w-40 h-40 rounded-full bg-az-orange/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-white/55 text-[12px] font-700 uppercase tracking-[0.18em]">
            Amazon Second Life · one product, three chances
          </p>
          <h2 className="mt-3 font-display font-800 text-[30px] sm:text-[40px] leading-[1.05] tracking-tight">
            <span className="text-sl-green-soft">Prevent</span> ·{" "}
            <span className="text-az-orange">Recover</span> ·{" "}
            <span className="text-sl-green-soft">Recirculate</span>
          </h2>
          <p className="mt-4 text-white/65 text-[14.5px] sm:text-[15.5px] leading-relaxed">
            An intelligent layer inside Amazon. Stop the return before it happens, recover full
            value when it does, and reactivate what already sits idle in homes — every item routed
            to its next best owner.
          </p>
          {metrics && (
            <div className="mt-5 inline-flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl bg-white/8 ring-1 ring-white/10 px-4 py-2.5">
              <Stat value={inr(metrics.rupees_recovered)} label="recovered" />
              <Stat value={`${metrics.warehouse_bypass_pct}%`} label="skip the warehouse" />
              <span className="flex items-center gap-1.5 text-white/45 text-[11px]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sl-green-soft animate-pulse" />
                live · deployed grading engine
              </span>
            </div>
          )}
        </div>
      </section>

      <p className="mt-8 mb-3 text-[12px] font-700 uppercase tracking-wider text-sl-muted">Choose a view</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <PersonaCard
          onClick={onOps}
          accent="green"
          primary
          phase="RECOVER"
          title="Returns desk"
          who="Ops"
          sub="Grade returns & idle items, route each to its highest-value second life."
          stat={metrics ? `${inr(metrics.rupees_recovered)} recovered · ${metrics.warehouse_bypass_pct}% skip the warehouse` : "The live grading spine"}
          cta="Open the grading desk"
          icon={<BoxIcon />}
        />
        <PersonaCard
          onClick={onBuyer}
          accent="navy"
          phase="PREVENT · RECIRCULATE"
          title="Rahul"
          who="Buyer"
          sub="Shop with real fit proof, then resell what you already own in one tap."
          stat="Fewer fit returns · the idle monitor finds a buyer"
          cta="Open the storefront"
          icon={<CartIcon />}
        />
        <PersonaCard
          onClick={onSeller}
          accent="violet"
          phase="PREVENT"
          title="Vastram Apparel"
          who="Seller"
          sub="See which listings drive returns — and the AI fix that stops them."
          stat="Worst-first return-rate dashboard"
          cta="Open the dashboard"
          icon={<StoreIcon />}
        />
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-display font-800 text-[18px] tnum text-white leading-none">{value}</span>
      <span className="text-white/55 text-[11.5px]">{label}</span>
    </span>
  );
}

const ACCENT = {
  green: { ring: "ring-sl-green/40 hover:ring-sl-green", chip: "bg-sl-mint text-sl-green-deep", icon: "bg-sl-mint text-sl-green-deep" },
  navy: { ring: "ring-sl-line hover:ring-az-steel/60", chip: "bg-slate-100 text-az-steel", icon: "bg-az-slate text-white" },
  violet: { ring: "ring-sl-line hover:ring-violet-300", chip: "bg-violet-50 text-violet-700", icon: "bg-violet-100 text-violet-700" },
};

function PersonaCard({ onClick, accent, primary, phase, title, who, sub, stat, cta, icon }) {
  const a = ACCENT[accent];
  return (
    <button
      onClick={onClick}
      className={`group h-full text-left rounded-2xl bg-white ring-1 ${a.ring} shadow-card p-5 flex flex-col transition hover:shadow-pop hover:-translate-y-0.5 active:translate-y-0`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl grid place-items-center ${a.icon}`}>{icon}</div>
        {primary && <span className="text-[10px] font-800 text-az-orange-deep tracking-wide">START HERE</span>}
      </div>
      <span className={`mt-4 inline-block self-start rounded-full px-2.5 py-0.5 text-[10px] font-800 tracking-wide ${a.chip}`}>{phase}</span>
      <h3 className="mt-2 font-700 text-[18px] leading-tight text-sl-ink">
        {title} <span className="text-sl-muted font-500 text-[13px]">· {who}</span>
      </h3>
      <p className="text-[13px] text-sl-muted mt-1.5 leading-snug">{sub}</p>
      <p className="mt-3 text-[12px] font-600 text-sl-green-deep leading-snug">{stat}</p>
      <span className="mt-4 pt-3 border-t border-sl-line flex items-center gap-1.5 text-[13px] font-700 text-sl-ink group-hover:text-sl-green-deep transition">
        {cta}
        <svg viewBox="0 0 24 24" className="w-4 h-4 group-hover:translate-x-0.5 transition" fill="none">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
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
