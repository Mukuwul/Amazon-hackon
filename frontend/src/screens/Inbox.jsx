import TopBar from "../components/TopBar";
import Thumb from "../components/Thumb";
import { SLBadge } from "../components/ui";
import { inr } from "../lib/format";

const STATUS = {
  return_initiated: { label: "Return started", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  idle: { label: "Idle · unused", cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  rto_in_transit: { label: "RTO in transit", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
};

// The four playable lanes off the inbox. Each maps an item to its dedicated flow
// (App routes by item_id); everything else stays a display-only QUEUED row.
const LANE = {
  "SL-002": { chip: "IDLE · RADAR", cls: "bg-sky-50 text-sky-700 ring-sky-200", who: "Rahul", sub: "idle 19 months — demand is already searching" },
  "SL-003": { chip: "LISTING FIX", cls: "bg-violet-50 text-violet-700 ring-violet-200", who: null, sub: "fix the listing that causes the returns" },
  "SL-004": { chip: "RTO · SEALED", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", who: null, sub: "sealed box — re-offer locally, no scan" },
};

function StageToggle({ value, onChange }) {
  return (
    <div className="flex items-center rounded-full bg-white/10 p-0.5 text-[10px] font-700 leading-none">
      <button
        onClick={() => onChange(false)}
        className={`px-2 py-1 rounded-full transition ${!value ? "bg-sl-green text-white" : "text-white/55"}`}
      >
        LIVE
      </button>
      <button
        onClick={() => onChange(true)}
        className={`px-2 py-1 rounded-full transition ${value ? "bg-az-orange text-az-navy" : "text-white/55"}`}
      >
        CACHED
      </button>
    </div>
  );
}

export default function Inbox({ items, metrics, loading, forceCached, onForceCached, onOpen, onShowMetrics, onBack }) {
  const hero = items.find((i) => i.item_id === "SL-001");
  const lanes = ["SL-002", "SL-003", "SL-004"].map((id) => items.find((i) => i.item_id === id)).filter(Boolean);
  const queued = items.filter((i) => i.item_id !== "SL-001" && !LANE[i.item_id]);

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar
        title="Second Life"
        subtitle="Returns & idle items"
        onBack={onBack}
        right={<StageToggle value={forceCached} onChange={onForceCached} />}
      />

      {/* dormant-value banner → batch impact */}
      <div className="px-4 pt-4">
        <button
          onClick={onShowMetrics}
          className="group relative w-full text-left overflow-hidden rounded-2xl bg-az-slate text-white p-4 shadow-card transition active:scale-[0.99]"
        >
          <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-sl-green/25 blur-2xl" />
          <p className="text-white/55 text-[11px] font-600 uppercase tracking-wider">
            Products without a second chance
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-display font-800 text-4xl leading-none tnum">{items.length || "—"}</span>
            <span className="text-white/70 text-[13px] mb-0.5">items in your account</span>
          </div>
          {metrics && (
            <p className="mt-2 text-[12px] text-sl-green-soft font-600">
              {inr(metrics.rupees_recovered)} recovered this session ·{" "}
              <span className="text-white/60 font-500">{metrics.warehouse_bypass_pct}% skipped the warehouse</span>
            </p>
          )}
          <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-700 text-az-orange">
            View batch impact
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>

      <p className="px-5 pt-5 pb-2 text-[11px] font-700 uppercase tracking-wider text-sl-muted">
        Ready for a second life
      </p>

      <div className="px-4 space-y-2.5 pb-8">
        {loading && [0, 1, 2].map((i) => <RowSkeleton key={i} />)}

        {hero && (
          <button
            onClick={() => onOpen(hero)}
            className="group w-full text-left rounded-2xl bg-white ring-1 ring-sl-green/40 shadow-card p-3 flex gap-3 transition hover:ring-sl-green hover:shadow-pop active:scale-[0.99] anim-fade-up"
          >
            <Thumb
              src={hero.thumb}
              alt={hero.title}
              category={hero.category}
              className="w-[72px] h-[72px] rounded-xl shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <SLBadge />
                <span className="text-[10px] font-700 text-az-orange-deep">START HERE</span>
              </div>
              <h3 className="font-600 text-[14px] leading-tight text-sl-ink truncate">{hero.title}</h3>
              <p className="text-[11.5px] text-sl-muted mt-0.5">
                Priya · returned — “{hero.return_reason}”
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <StatusChip status={hero.status} />
                <span className="text-[11px] text-sl-muted">Paid {inr(hero.order?.price_paid ?? hero.mrp)}</span>
              </div>
            </div>
            <Chevron />
          </button>
        )}

        {lanes.map((it, idx) => {
          const lane = LANE[it.item_id];
          return (
            <button
              key={it.item_id}
              onClick={() => onOpen(it)}
              className="group w-full text-left rounded-2xl bg-white ring-1 ring-sl-line shadow-card p-3 flex gap-3 transition hover:ring-sl-green/60 hover:shadow-pop active:scale-[0.99] anim-fade-up"
              style={{ animationDelay: `${60 + idx * 50}ms` }}
            >
              <Thumb
                src={it.thumb}
                alt={it.title}
                category={it.category}
                className="w-[60px] h-[60px] rounded-xl shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[9.5px] font-800 tracking-wide ring-1 ${lane.cls}`}>
                  {lane.chip}
                </span>
                <h3 className="font-600 text-[13.5px] leading-tight text-sl-ink truncate mt-1">{it.title}</h3>
                <p className="text-[11px] text-sl-muted mt-0.5 leading-snug truncate">
                  {lane.who ? `${lane.who} · ` : ""}{lane.sub}
                </p>
              </div>
              <Chevron />
            </button>
          );
        })}

        {queued.map((it, idx) => (
          <div
            key={it.item_id}
            className="rounded-2xl bg-white/70 ring-1 ring-sl-line p-3 flex gap-3 anim-fade-up"
            style={{ animationDelay: `${240 + idx * 45}ms` }}
          >
            <Thumb
              src={it.thumb}
              alt={it.title}
              category={it.category}
              className="w-14 h-14 rounded-xl shrink-0 opacity-90"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-600 text-[13px] leading-tight text-sl-ink/80 truncate">{it.title}</h3>
              <div className="mt-1 flex items-center gap-2">
                <StatusChip status={it.status} />
                <span className="text-[11px] text-sl-muted truncate">{inr(it.order?.price_paid ?? it.mrp)}</span>
              </div>
            </div>
            <span className="self-center text-[10px] font-700 text-sl-muted bg-sl-paper rounded-full px-2 py-1 ring-1 ring-sl-line shrink-0">
              QUEUED
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 text-sl-muted self-center shrink-0 group-hover:translate-x-0.5 transition" fill="none">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusChip({ status }) {
  const s = STATUS[status] || { label: status, cls: "bg-slate-100 text-slate-600 ring-slate-200" };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-700 ring-1 ${s.cls}`}>
      {s.label}
    </span>
  );
}

function RowSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-3 flex gap-3 ring-1 ring-sl-line">
      <div className="skel w-[72px] h-[72px] rounded-xl" />
      <div className="flex-1 space-y-2 py-1">
        <div className="skel h-3 w-3/4 rounded" />
        <div className="skel h-2.5 w-1/2 rounded" />
        <div className="skel h-2.5 w-1/3 rounded" />
      </div>
    </div>
  );
}
