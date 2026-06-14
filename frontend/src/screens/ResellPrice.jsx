import { useState } from "react";
import TopBar from "../components/TopBar";
import { FooterAction } from "../components/ui";
import { inr } from "../lib/format";

// Resell step 2 (MT10 Fix 4) — set the price and the reach. The range selector
// trades reach for price: a wider radius reaches more local buyers (higher price)
// but Amazon's delivery cut grows, so NET (your take-home) can peak mid-range.
// Every figure is a field of POST /resell/quote. List → POST /resell/listings.
export default function ResellPrice({ item, quote, range, busy, onRange, onList, onBack }) {
  const points = quote.points || [];
  const recIdx = Math.max(0, points.findIndex((p) => p.price === quote.recommended));
  const [idx, setIdx] = useState(recIdx === -1 ? points.length - 1 : recIdx);

  // Clamp during render so a shorter curve (after a range change) never reads past
  // the end — no effect needed, so no synchronous setState-in-effect.
  const safeIdx = Math.min(idx, Math.max(0, points.length - 1));
  const sel = points[safeIdx] || { price: quote.best_price };
  const net = sel.price - quote.delivery_cut;
  const tiers = quote.range_tiers || [];

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title="Price & reach" subtitle={item.title} onBack={onBack} />

      {/* AI price + take-home */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-sl-line p-4 anim-fade-up">
          <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted">Your ask</p>
          <div className="flex items-end gap-2 mt-0.5">
            <span className="font-display font-800 text-[40px] leading-none tnum text-sl-ink">{inr(sel.price)}</span>
            {sel.price === quote.recommended && (
              <span className="mb-1.5 rounded-full bg-sl-mint text-sl-green-deep text-[10px] font-800 px-2 py-0.5 tracking-wide">BEST</span>
            )}
          </div>
          <p className="mt-1 text-[12px] text-sl-muted">
            AI valued the unit at <span className="font-700 text-sl-ink">{inr(quote.ai_suggested)}</span> from your photos.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat value={inr(sel.price)} label="buyer pays" tone="ink" />
            <Stat value={`− ${inr(quote.delivery_cut)}`} label="Amazon delivery" tone="warn" />
            <Stat value={inr(net)} label="you keep" tone="green" />
          </div>
        </div>
      </div>

      {/* price slider */}
      <div className="px-4 pt-5">
        <input
          type="range" min={0} max={Math.max(0, points.length - 1)} step={1} value={safeIdx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="sl-range w-full" aria-label="Ask price"
        />
        <div className="flex justify-between mt-1 text-[10.5px] text-sl-muted tnum">
          <span>{inr(points[0]?.price)} · fastest</span>
          <span>{inr(points[points.length - 1]?.price)} · most</span>
        </div>
        <p className="mt-1 text-[11.5px] text-sl-muted">
          {sel.buyers_at_price} buyer{sel.buyers_at_price === 1 ? "" : "s"} ready at this ask · sells in ~{sel.est_days_to_sell} days.
        </p>
      </div>

      {/* range selector — reach vs delivery cut */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted mb-2">How far to reach</p>
        <div className="grid grid-cols-3 gap-2">
          {tiers.map((t) => {
            const active = t.range_km === range;
            return (
              <button
                key={t.range_km}
                onClick={() => onRange(t.range_km)}
                disabled={busy}
                className={`rounded-xl p-3 text-center ring-1 transition active:scale-[0.98] disabled:opacity-60 ${
                  active ? "bg-sl-green text-white ring-sl-green shadow-pop" : "bg-white text-sl-ink ring-sl-line hover:ring-sl-green/50"
                }`}
              >
                <p className="font-display font-800 text-[18px] leading-none tnum">{t.range_km} km</p>
                <p className={`text-[10.5px] mt-1 ${active ? "text-white/80" : "text-sl-muted"}`}>
                  {t.reachable_buyers} buyer{t.reachable_buyers === 1 ? "" : "s"}
                </p>
                <p className={`text-[10.5px] tnum ${active ? "text-white/80" : "text-sl-muted"}`}>
                  − {inr(t.delivery_cut)} delivery
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-2.5 text-[11.5px] text-sl-muted leading-snug">
          Wider reach lifts the price buyers will pay — but Amazon’s delivery cut grows with distance.
          Your take-home is <span className="font-700 text-sl-green-deep">net</span>, not the sticker.
        </p>
      </div>

      <FooterAction variant="green" onClick={() => onList({ ask_price: sel.price, range_km: range })} loading={busy}>
        List at {inr(sel.price)} · keep {inr(net)}
      </FooterAction>
    </div>
  );
}

function Stat({ value, label, tone }) {
  const color = tone === "green" ? "var(--color-sl-green-deep)" : tone === "warn" ? "var(--color-warn)" : "var(--color-sl-ink)";
  return (
    <div className="rounded-xl bg-sl-paper p-2.5 text-center">
      <p className="font-display font-800 text-[16px] tnum leading-none" style={{ color }}>{value}</p>
      <p className="text-[10.5px] text-sl-muted mt-1 leading-tight">{label}</p>
    </div>
  );
}
