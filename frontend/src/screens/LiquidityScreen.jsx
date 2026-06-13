import { useState } from "react";
import TopBar from "../components/TopBar";
import { FooterAction } from "../components/ui";
import { inr } from "../lib/format";

// Liquidity slider — the deterministic price/speed trade-off from GET /price-curve.
// Each point is a real ask level the seeded local buyers support: drag the price and
// watch how many buyers clear it and how fast it sells. The engine recommends the
// highest price that still has >=2 ready buyers.
export default function LiquidityScreen({ item, curve, listing, onList, onBack }) {
  const points = curve.points || [];
  const recIdx = Math.max(0, points.findIndex((p) => p.price === curve.recommended));
  const [idx, setIdx] = useState(recIdx === -1 ? points.length - 1 : recIdx);
  const sel = points[idx] || {};
  const maxBuyers = Math.max(...points.map((p) => p.buyers_at_price), 1);
  const atRec = sel.price === curve.recommended;

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title="Set your price" subtitle={item.title} onBack={onBack} />

      {/* selected ask */}
      <div className="px-4 pt-4">
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-sl-line p-4 anim-fade-up">
          <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted">Ask price</p>
          <div className="flex items-end gap-2 mt-0.5">
            <span className="font-display font-800 text-[40px] leading-none tnum text-sl-ink">{inr(sel.price)}</span>
            {atRec && (
              <span className="mb-1.5 rounded-full bg-sl-mint text-sl-green-deep text-[10px] font-800 px-2 py-0.5 tracking-wide">
                BEST
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <Stat value={sel.buyers_at_price} label="buyers ready now" tone="green" />
            <Stat value={`~${sel.est_days_to_sell}d`} label="time to sell" tone={sel.est_days_to_sell <= 3 ? "green" : "warn"} />
          </div>
        </div>
      </div>

      {/* the slider */}
      <div className="px-4 pt-5">
        <input
          type="range"
          min={0}
          max={points.length - 1}
          step={1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="sl-range w-full"
          aria-label="Ask price"
        />
        <div className="flex justify-between mt-1 text-[10.5px] text-sl-muted tnum">
          <span>{inr(points[0]?.price)} · fastest</span>
          <span>{inr(points[points.length - 1]?.price)} · most</span>
        </div>
      </div>

      {/* demand curve — buyers willing at each ask */}
      <div className="px-4 pt-5">
        <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted mb-2">Local demand curve</p>
        <div className="rounded-2xl bg-white ring-1 ring-sl-line p-3.5">
          <div className="flex items-end justify-between gap-1.5 h-24">
            {points.map((p, i) => {
              const h = (p.buyers_at_price / maxBuyers) * 100;
              const active = i === idx;
              return (
                <button
                  key={p.price}
                  onClick={() => setIdx(i)}
                  className="group flex-1 flex flex-col items-center justify-end h-full gap-1"
                >
                  <span className={`text-[10px] font-700 tnum ${active ? "text-sl-green-deep" : "text-sl-muted"}`}>
                    {p.buyers_at_price}
                  </span>
                  <span
                    className="w-full rounded-t-md transition-all duration-300"
                    style={{
                      height: `${Math.max(8, h)}%`,
                      background: active ? "var(--color-sl-green)" : "var(--color-sl-mint-deep)",
                    }}
                  />
                </button>
              );
            })}
          </div>
          <div className="flex justify-between gap-1.5 mt-1.5">
            {points.map((p, i) => (
              <span key={p.price} className={`flex-1 text-center text-[9px] tnum ${i === idx ? "text-sl-ink font-700" : "text-sl-muted"}`}>
                {inr(p.price)}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[11.5px] text-sl-muted leading-snug">
          Drop the price and more neighbours clear it — it sells faster. The engine recommends{" "}
          <span className="font-700 text-sl-green-deep">{inr(curve.recommended)}</span>: the most you can ask
          with buyers still ready.
        </p>
      </div>

      <FooterAction variant="green" onClick={() => onList(sel)} loading={listing}>
        List at {inr(sel.price)} · notify {sel.buyers_at_price} buyers
      </FooterAction>
    </div>
  );
}

function Stat({ value, label, tone }) {
  const color = tone === "green" ? "var(--color-sl-green-deep)" : tone === "warn" ? "var(--color-warn)" : "var(--color-sl-ink)";
  return (
    <div className="rounded-xl bg-sl-paper p-3 text-center">
      <p className="font-display font-800 text-[22px] tnum leading-none" style={{ color }}>{value}</p>
      <p className="text-[11px] text-sl-muted mt-1 leading-tight">{label}</p>
    </div>
  );
}
