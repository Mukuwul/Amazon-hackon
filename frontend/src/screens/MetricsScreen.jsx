import TopBar from "../components/TopBar";
import { FooterAction } from "../components/ui";
import { inr, num, useCountUp } from "../lib/format";

// Batch Impact — the closing beat. Every counter is computed server-side from the
// passport's ROUTED events plus a pre-session baseline (GET /metrics): recovered
// rupees vs. writing the items off, warehouse trips skipped, and the green ledger.
// Nothing here is hardcoded — it grows with each item routed on stage.
export default function MetricsScreen({ metrics, onBack, onDone }) {
  const m = metrics || {};
  const recovered = Math.round(useCountUp(m.rupees_recovered));
  const vsWriteoff = Math.round(useCountUp(m.rupees_vs_writeoff_baseline));
  const co2 = useCountUp(m.co2_saved_kg);
  const landfill = useCountUp(m.landfill_diverted_kg);
  const hours = useCountUp(m.inspection_hours_saved);
  const bypass = Math.round(useCountUp(m.warehouse_bypass_pct));

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title="Batch Impact" subtitle="This session vs. the old way" onBack={onBack} />

      {/* hero counter */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl bg-az-navy text-white p-5 shadow-card anim-fade-up">
          <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-sl-green/30 blur-2xl" />
          <p className="text-white/55 text-[11px] font-600 uppercase tracking-wider">Value recovered this session</p>
          <p className="font-display font-800 text-[44px] leading-none tnum mt-1">{inr(recovered)}</p>
          <p className="mt-2 text-[13px] text-sl-green-soft font-600">
            {inr(vsWriteoff)} more than writing these items off
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <span className="font-display font-800 text-[15px] tnum text-az-orange">{num(m.items_processed)}</span>
            <span className="text-white/70 text-[11.5px]">items given a second life</span>
          </div>
        </div>
      </div>

      {/* warehouse bypass */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-sl-line p-4 flex items-center gap-4">
          <div className="relative shrink-0">
            <BypassRing value={bypass} />
          </div>
          <div className="min-w-0">
            <p className="font-700 text-[14px] text-sl-ink">skipped the warehouse entirely</p>
            <p className="text-[12px] text-sl-muted leading-snug mt-0.5">
              Routed straight to a local owner — no reverse freight, no FC inspection.
            </p>
          </div>
        </div>
      </div>

      {/* green ledger */}
      <div className="px-4 pt-3">
        <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted mb-2">Green ledger</p>
        <div className="grid grid-cols-3 gap-2.5">
          <Green value={`${co2.toFixed(1)}`} unit="kg" label="CO₂ saved" glyph="🌱" />
          <Green value={`${landfill.toFixed(1)}`} unit="kg" label="landfill diverted" glyph="♻️" />
          <Green value={`${hours.toFixed(1)}`} unit="h" label="inspection saved" glyph="⏱️" />
        </div>
      </div>

      {/* business model line */}
      <div className="px-4 pt-3 pb-2">
        <div className="rounded-xl bg-sl-mint/60 ring-1 ring-sl-mint-deep p-3">
          <p className="text-[12.5px] text-sl-ink leading-relaxed">
            Amazon earns a take-rate on every rupee recovered — the platform only earns
            <span className="font-700 text-sl-green-deep"> when value is saved</span>, never when it’s destroyed.
          </p>
        </div>
      </div>

      <FooterAction variant="ghost" onClick={onDone}>
        Back to returns
      </FooterAction>
    </div>
  );
}

function BypassRing({ value }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative w-[68px] h-[68px]">
      <svg viewBox="0 0 68 68" className="w-full h-full -rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--color-sl-line)" strokeWidth="7" />
        <circle
          cx="34" cy="34" r={r} fill="none"
          stroke="var(--color-sl-green)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * value) / 100}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display font-800 text-[17px] tnum text-sl-ink">{value}%</span>
      </div>
    </div>
  );
}

function Green({ value, unit, label, glyph }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-sl-line p-3 text-center">
      <span className="text-[15px]">{glyph}</span>
      <p className="mt-0.5 font-display font-800 text-[19px] tnum text-sl-green-deep leading-none">
        {value}<span className="text-[11px] font-700 text-sl-muted ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] text-sl-muted mt-1 leading-tight">{label}</p>
    </div>
  );
}
