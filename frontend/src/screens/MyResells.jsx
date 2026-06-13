import { useEffect, useState } from "react";
import { api } from "../lib/api";
import Thumb from "../components/Thumb";
import { Spinner } from "../components/ui";
import { inr } from "../lib/format";

// My resells (MT10 Fix 4) — the reseller's live interest feed. Polls the board
// (~3s) and shows each listing this persona owns with the interested buyers as
// they arrive from the Flash-deals board in another tab (real cross-tab).
// Rendered as the BuyerStore "My resells" tab.
export default function MyResells({ persona }) {
  const [mine, setMine] = useState(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const { listings } = await api.listings();
        if (alive) setMine(listings.filter((l) => l.owner === persona));
      } catch { /* keep last good */ }
    }
    tick();
    const t = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [persona]);

  if (mine === null) return <Center><Spinner /></Center>;
  if (!mine.length) {
    return (
      <div className="rounded-2xl bg-white ring-1 ring-sl-line shadow-card p-10 text-center anim-fade-up max-w-xl">
        <p className="text-[15px] font-700 text-sl-ink">No active resells</p>
        <p className="text-[13px] text-sl-muted mt-1">List one from <span className="font-600">Your orders</span> → Resell on Second Life.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl anim-fade-up">
      {mine.map((l) => {
        const interests = l.interests || [];
        return (
          <div key={l.listing_id} className="rounded-2xl bg-white ring-1 ring-sl-line shadow-card overflow-hidden">
            <div className="flex gap-3 p-4">
              <Thumb src={l.thumb} alt={l.title} category={l.category || "electronics"} className="w-16 h-16 rounded-xl shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-600 text-[13.5px] leading-tight text-sl-ink">{l.title}</h3>
                <p className="text-[11.5px] text-sl-muted mt-0.5">
                  Listed at <span className="font-700 text-sl-ink">{inr(l.ask_price)}</span> · within {l.range_km} km · keep {inr(l.net)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sl-mint text-sl-green-deep px-2.5 py-1 text-[11px] font-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-sl-green animate-pulse" />
                  {interests.length} interested
                </span>
              </div>
            </div>
            <div className="border-t border-sl-line bg-sl-paper/60">
              {interests.length === 0 ? (
                <p className="px-4 py-3 text-[12px] text-sl-muted">Waiting for buyers nearby to tap “I’m interested”…</p>
              ) : (
                <div className="divide-y divide-sl-line">
                  {interests.map((it) => (
                    <div key={it.interest_id} className="flex items-center gap-3 px-4 py-2.5 anim-fade-in">
                      <span className="w-8 h-8 rounded-full bg-white ring-1 ring-sl-line grid place-items-center text-[11px] font-700 text-sl-muted shrink-0">
                        {initials(it.buyer_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-600 text-sl-ink truncate">{it.buyer_name}</p>
                        <p className="text-[11px] text-sl-muted">{it.distance_km} km away</p>
                      </div>
                      <span className="text-[13px] font-800 tnum text-sl-green-deep shrink-0">{inr(it.offer)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function initials(name) {
  return (name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Center({ children }) {
  return <div className="grid place-items-center py-16 text-sl-muted">{children}</div>;
}
