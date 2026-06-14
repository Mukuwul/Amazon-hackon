import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { num } from "../lib/format";

// Personal Green Ledger (MT15) — a subtle per-persona impact strip (items diverted /
// CO₂ saved / landfill diverted), scoped to that persona's own products. Every number
// from GET /green-ledger/{persona}. Two tones: light (seller dash) and dark (on the
// Your Things hero). Renders nothing until the data lands, so it never breaks layout.
export default function GreenLedger({ persona, tone = "light" }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    let alive = true;
    api.greenLedger(persona).then((x) => { if (alive) setD(x); }).catch(() => {});
    return () => { alive = false; };
  }, [persona]);
  if (!d) return null;

  const dark = tone === "dark";
  const labelCls = dark ? "text-white/55" : "text-sl-muted";
  const valueCls = dark ? "text-white" : "text-sl-ink";
  const wrap = dark ? "border-white/15 bg-white/5" : "border-sl-line bg-white";

  return (
    <div className={`flex items-center gap-5 sm:gap-7 rounded-xl border ${wrap} px-4 py-2.5`}>
      <Leaf dark={dark} />
      <Stat value={num(d.items_diverted)} label="diverted" valueCls={valueCls} labelCls={labelCls} />
      <Stat value={d.co2_saved_kg} label="kg CO₂ saved" valueCls={valueCls} labelCls={labelCls} />
      <Stat value={d.landfill_diverted_kg} label="kg off landfill" valueCls={valueCls} labelCls={labelCls} />
    </div>
  );
}

function Stat({ value, label, valueCls, labelCls }) {
  return (
    <div className="min-w-0">
      <div className={`font-display font-800 text-[16px] leading-none tnum ${valueCls}`}>{value}</div>
      <div className={`text-[9.5px] font-700 uppercase tracking-wider mt-1 ${labelCls}`}>{label}</div>
    </div>
  );
}

function Leaf({ dark }) {
  return (
    <svg viewBox="0 0 24 24" className={`w-5 h-5 shrink-0 ${dark ? "text-sl-mint" : "text-sl-green"}`} fill="none">
      <path d="M5 19c0-7 5-13 14-14 0 9-5 15-14 14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
