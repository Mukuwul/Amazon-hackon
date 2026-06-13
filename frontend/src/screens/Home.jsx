import TopBar from "../components/TopBar";
import { SLBadge } from "../components/ui";
import { inr } from "../lib/format";

// Persona launcher — the whole lifecycle a product can hit, on one console.
// Prevent (buyer + seller) → Recover (the live spine) → Recirculate (resell).
// Ops is the existing returns inbox, untouched.
export default function Home({ metrics, onOps, onBuyer, onSeller }) {
  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title="Second Life" subtitle="Every product, its next best owner" right={<SLBadge />} />

      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl bg-az-slate text-white p-4 shadow-card anim-fade-up">
          <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-sl-green/25 blur-2xl" />
          <p className="text-white/55 text-[11px] font-600 uppercase tracking-wider">One product · three chances</p>
          <p className="mt-1.5 font-display font-800 text-[19px] leading-snug">
            <span className="text-sl-green-soft">Prevent</span> · <span className="text-az-orange">Recover</span> ·{" "}
            <span className="text-sl-green-soft">Recirculate</span>
          </p>
          <p className="mt-1.5 text-white/60 text-[12.5px] leading-relaxed">
            Stop the return before it happens, recover full value when it does, and reactivate what
            already sits idle in homes.
          </p>
        </div>
      </div>

      <p className="px-5 pt-5 pb-2 text-[11px] font-700 uppercase tracking-wider text-sl-muted">
        Choose a view
      </p>

      <div className="px-4 space-y-2.5 pb-8">
        <PersonaCard
          onClick={onOps}
          accent="green"
          primary
          phase="RECOVER"
          title="Returns desk"
          who="Ops"
          sub="Grade returns & idle items, route each to its highest-value second life."
          stat={metrics ? `${inr(metrics.rupees_recovered)} recovered · ${metrics.warehouse_bypass_pct}% skip the warehouse` : "The live grading spine"}
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
          icon={<StoreIcon />}
        />
      </div>
    </div>
  );
}

const ACCENT = {
  green: { ring: "ring-sl-green/40 hover:ring-sl-green", chip: "bg-sl-mint text-sl-green-deep", icon: "bg-sl-mint text-sl-green-deep" },
  navy: { ring: "ring-sl-line hover:ring-az-steel/60", chip: "bg-slate-100 text-az-steel", icon: "bg-az-slate text-white" },
  violet: { ring: "ring-sl-line hover:ring-violet-300", chip: "bg-violet-50 text-violet-700", icon: "bg-violet-100 text-violet-700" },
};

function PersonaCard({ onClick, accent, primary, phase, title, who, sub, stat, icon }) {
  const a = ACCENT[accent];
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-2xl bg-white ring-1 ${a.ring} shadow-card p-3.5 flex gap-3 transition hover:shadow-pop active:scale-[0.99] anim-fade-up`}
    >
      <div className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${a.icon}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[9.5px] font-800 tracking-wide ${a.chip}`}>{phase}</span>
          {primary && <span className="text-[9.5px] font-800 text-az-orange-deep tracking-wide">START HERE</span>}
        </div>
        <h3 className="mt-1 font-700 text-[15px] leading-tight text-sl-ink">
          {title} <span className="text-sl-muted font-500 text-[12px]">· {who}</span>
        </h3>
        <p className="text-[11.5px] text-sl-muted mt-0.5 leading-snug">{sub}</p>
        <p className="mt-1.5 text-[11px] font-600 text-sl-green-deep leading-snug">{stat}</p>
      </div>
      <Chevron />
    </button>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-sl-muted self-center shrink-0 group-hover:translate-x-0.5 transition" fill="none">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
