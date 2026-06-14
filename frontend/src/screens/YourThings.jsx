import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Thumb from "../components/Thumb";
import { Spinner } from "../components/ui";
import { inr } from "../lib/format";
import GreenLedger from "../components/GreenLedger";

// "Your Things" (MT15) — the owner-side view of the invisible warehouse: every product
// you own, valued live as idle inventory, with the dormant total your home is holding,
// a life-stage bar, and a one-tap Resell into the existing flow. Every figure traces to
// GET /your-things/{persona}; the impact strip to GET /green-ledger/{persona}.
export default function YourThings({ persona, busyResell, onResell }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .yourThings(persona)
      .then((d) => { if (alive) setData(d); })
      .catch(() => { if (alive) setData({ things: [], total_dormant_value: 0, item_count: 0, due_count: 0 }); });
    return () => { alive = false; };
  }, [persona]);

  // Loading is simply "no data yet" — no synchronous setState in the effect.
  if (data === null) return <div className="grid place-items-center py-16 text-sl-muted"><Spinner /></div>;
  const things = data?.things || [];

  return (
    <div className="anim-fade-up space-y-5">
      {/* dormant-value hero + personal green ledger */}
      <div className="relative overflow-hidden rounded-2xl bg-az-slate text-white p-5 sm:p-6 shadow-card">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-sl-green/20 blur-3xl" />
        <p className="text-white/55 text-[11px] font-700 uppercase tracking-wider">Dormant value in your home</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="font-display font-800 text-4xl sm:text-5xl leading-none tnum">{inr(data.total_dormant_value)}</span>
        </div>
        <p className="mt-2 text-[13px] text-white/70 leading-snug">
          {data.item_count} thing{data.item_count === 1 ? "" : "s"} you own
          {data.due_count > 0 ? ` · ${data.due_count} ready to resell now` : ""}.
        </p>
        <div className="mt-4"><GreenLedger persona={persona} tone="dark" /></div>
      </div>

      {/* things — highest dormant value first */}
      <div className="grid gap-3 md:grid-cols-2">
        {things.map((t, i) => (
          <ThingCard key={t.order_id || t.asin} thing={t} busyResell={busyResell} onResell={onResell} delay={i * 40} />
        ))}
      </div>
    </div>
  );
}

function ThingCard({ thing, busyResell, onResell, delay }) {
  const due = thing.due_to_resell;
  const resellBusy = busyResell != null && busyResell === (thing.order_id || thing.item_id);
  return (
    <div className="rounded-2xl bg-white ring-1 ring-sl-line shadow-card p-4" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex gap-3">
        <Thumb
          src={thing.thumb || `/items/${thing.item_id || thing.asin || "x"}/current_1.jpg`}
          alt={thing.title}
          category={thing.category}
          className="w-16 h-16 rounded-xl shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-600 text-[13.5px] leading-tight text-sl-ink line-clamp-2">{thing.title}</h3>
          <p className="text-[11.5px] text-sl-muted mt-0.5">Owned {thing.months_owned} mo · {thing.stage_label}</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display font-800 text-[16px] tnum text-sl-ink">{inr(thing.resale_value)}</span>
            <span className="text-[11px] text-sl-muted">now · −{inr(thing.decay_per_month)}/mo</span>
          </div>
        </div>
      </div>

      {/* life-stage progress */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-sl-line overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${thing.stage_pct}%`, background: due ? "var(--color-sl-green)" : "var(--color-az-steel)" }}
          />
        </div>
        {due && <span className="text-[9.5px] font-800 uppercase tracking-wide text-sl-green-deep shrink-0">Due</span>}
      </div>

      <button
        onClick={() => onResell(thing)}
        disabled={resellBusy || !thing.resellable}
        className="mt-3 w-full h-9 rounded-lg text-[12.5px] font-800 bg-sl-green text-white hover:bg-sl-green-deep transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {resellBusy && <Spinner className="w-3.5 h-3.5" />}
        {thing.resellable ? (due ? "Resell now · best time" : "Resell on Second Life") : "Resale coming soon"}
      </button>
    </div>
  );
}
