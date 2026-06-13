import { useState } from "react";
import TopBar from "../components/TopBar";
import { FooterAction, SourceTag } from "../components/ui";
import { useCountUp } from "../lib/format";

// Listing Diagnostics — the best return is no return. POST /diagnose-listing
// compares the catalog listing against returned units + the reasons buyers gave,
// finds where the listing lies, and proposes one concrete patch with a projected
// return reduction. Every figure is a field of the response.
const SWATCH = {
  "navy blue": "#1b2a4a", navy: "#1b2a4a",
  "royal blue": "#2b5dd1", "royal": "#2b5dd1", blue: "#2b5dd1",
};
const swatch = (s) => SWATCH[(s || "").toLowerCase()] || null;

export default function DiagnoseScreen({ item, diagnose, onBack }) {
  const [applied, setApplied] = useState(false);
  const d = diagnose;
  const pct = Math.round(useCountUp(applied ? d.projected_return_reduction_pct : 0, 700));

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar
        title="Listing Diagnostics"
        subtitle={item.title}
        onBack={onBack}
        right={<SourceTag source={d.source} model={d.model} latency={d.latency_ms} />}
      />

      {/* the problem */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-az-slate text-white p-4 shadow-card anim-fade-up">
          <p className="text-white/55 text-[11px] font-600 uppercase tracking-wider">Why it keeps coming back</p>
          <p className="mt-1 text-[14.5px] leading-snug">
            <span className="font-display font-800 text-az-orange">{d.returns_analyzed} returns</span> on this
            listing — all citing the same gap between photo and reality.
          </p>
        </div>
      </div>

      {/* discrepancies */}
      <div className="px-4 pt-4">
        <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted mb-2">Listing vs. reality</p>
        <div className="space-y-2.5">
          {(d.discrepancies || []).map((x, i) => (
            <div key={i} className="rounded-2xl bg-white ring-1 ring-sl-line p-3.5 anim-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-[10px] font-800 uppercase tracking-wider text-sl-muted mb-2">{x.aspect}</p>
              <div className="flex items-center gap-2">
                <Swatch label={x.listing_shows} tag="Listing says" tone="neg" />
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-sl-muted shrink-0" fill="none">
                  <path d="M5 12h14m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <Swatch label={x.returns_show} tag="Buyers got" tone="pos" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* the patch — before / after */}
      <div className="px-4 pt-4">
        <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted mb-2">
          Auto-patch · {d.patch?.field}
        </p>
        <div className="rounded-2xl bg-white ring-1 ring-sl-line overflow-hidden">
          <div className={`p-3.5 transition ${applied ? "opacity-40" : ""}`}>
            <p className="text-[10px] font-700 text-neg mb-1">BEFORE</p>
            <p className={`text-[13px] text-sl-ink ${applied ? "line-through" : ""}`}>{d.patch?.current_text}</p>
          </div>
          <div className={`border-t border-sl-line p-3.5 transition ${applied ? "bg-sl-mint/50" : ""}`}>
            <p className="text-[10px] font-700 text-sl-green-deep mb-1">AFTER</p>
            <p className="text-[13px] text-sl-ink font-600">{d.patch?.suggested_text}</p>
          </div>
        </div>
      </div>

      {/* projected impact */}
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-sl-line p-4 flex items-center gap-4">
          <div className="relative shrink-0 w-16 h-16 grid place-items-center">
            <span className="font-display font-800 text-[24px] tnum text-sl-green-deep">−{pct}%</span>
          </div>
          <div className="min-w-0">
            <p className="font-700 text-[13.5px] text-sl-ink">
              {applied ? "Returns projected to drop" : "Fix the listing, stop the returns"}
            </p>
            <p className="text-[12px] text-sl-muted leading-snug mt-0.5">
              Projected reduction in returns on this SKU once the patch is live.
            </p>
          </div>
        </div>
        {applied && (
          <p className="mt-3 text-center text-[12px] text-sl-green-deep font-600 anim-fade-in">
            ✓ Patch published — the catalog now matches what ships.
          </p>
        )}
      </div>

      <FooterAction
        variant={applied ? "ghost" : "primary"}
        onClick={() => setApplied(true)}
        disabled={applied}
      >
        {applied ? "Fix published" : "Apply the fix"}
      </FooterAction>
    </div>
  );
}

function Swatch({ label, tag, tone }) {
  const hex = swatch(label);
  return (
    <div className="flex-1 min-w-0 rounded-xl bg-sl-paper p-2.5">
      <p className="text-[9.5px] font-700 uppercase tracking-wider" style={{ color: tone === "neg" ? "var(--color-neg)" : "var(--color-sl-green-deep)" }}>
        {tag}
      </p>
      <div className="flex items-center gap-1.5 mt-1">
        {hex && <span className="w-3.5 h-3.5 rounded-full ring-1 ring-black/10 shrink-0" style={{ background: hex }} />}
        <span className="text-[12.5px] font-600 text-sl-ink capitalize truncate">{label}</span>
      </div>
    </div>
  );
}
