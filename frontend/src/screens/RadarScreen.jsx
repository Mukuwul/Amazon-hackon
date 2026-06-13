import TopBar from "../components/TopBar";
import { FooterAction, SLBadge } from "../components/ui";
import { inr } from "../lib/format";

// Idle Asset Radar — Amazon's largest warehouse is the one it can't see: the
// dormant units sitting in people's homes. Given live local demand for an ASIN,
// surface those units nearest-first and the owner whose unit is "mine".
// Every figure here is a field of GET /radar/{asin}.
export default function RadarScreen({ item, radar, valuing, onSell, onBack }) {
  const units = radar.dormant_units || [];
  const mine = units.find((u) => u.item_id === item.item_id) || units[0];
  const others = units.filter((u) => u !== mine);
  const maxDist = Math.max(...units.map((u) => u.distance_km), 1);

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title="Idle Asset Radar" subtitle={item.title} onBack={onBack} right={<SLBadge />} />

      {/* live demand banner */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl bg-az-slate text-white p-4 shadow-card anim-fade-up">
          <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-sl-green/25 blur-2xl" />
          <p className="text-white/55 text-[11px] font-600 uppercase tracking-wider">Live demand nearby</p>
          <p className="mt-1 text-[15px] leading-snug">
            <span className="font-display font-800 text-sl-green-soft">{radar.demand.buyers_waiting} buyers</span>{" "}
            are searching <span className="font-700">“{radar.demand.query}”</span> within reach —
            but no one’s selling.
          </p>
        </div>
      </div>

      {/* the radar visual */}
      <div className="px-4 pt-4">
        <Radar units={units} mine={mine} maxDist={maxDist} />
        <p className="text-center text-[11px] text-sl-muted mt-2 leading-snug">
          <span className="font-700 text-sl-ink">{units.length}</span> dormant units of this product
          sit unused within <span className="tnum">{Math.ceil(maxDist)} km</span> · worth{" "}
          <span className="font-700 text-sl-green-deep tnum">{inr(radar.total_dormant_value)}</span> together
        </p>
      </div>

      {/* mine — the highlighted unit */}
      {mine && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl bg-white shadow-card ring-1 ring-sl-green/40 p-4 anim-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-sl-green animate-pulse" />
              <span className="text-[10px] font-800 uppercase tracking-wider text-sl-green-deep">Your unit</span>
            </div>
            <p className="text-[13px] text-sl-ink leading-snug">
              {item.title} · idle{" "}
              <span className="font-700">{mine.purchased_months_ago} months</span>
            </p>
            <p className="mt-2 text-[13.5px] text-sl-green-deep font-600 leading-snug">
              A buyer <span className="tnum">{mine.distance_km} km</span> away will pay{" "}
              <span className="font-display font-800 text-[17px]">{inr(mine.est_value)}</span> — today.
            </p>
          </div>
        </div>
      )}

      {/* the invisible warehouse — other dormant owners */}
      {others.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted mb-2">
            Same product, dormant nearby
          </p>
          <div className="rounded-2xl bg-white/70 ring-1 ring-sl-line divide-y divide-sl-line overflow-hidden">
            {others.slice(0, 6).map((u, i) => (
              <div key={u.item_id} className="flex items-center gap-3 px-3.5 py-2.5 anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <span className="w-8 h-8 rounded-full bg-sl-paper grid place-items-center text-[11px] font-700 text-sl-muted shrink-0">
                  {initials(u.owner)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-600 text-sl-ink truncate">{u.owner}</p>
                  <p className="text-[11px] text-sl-muted">idle {u.purchased_months_ago} mo · {u.distance_km} km</p>
                </div>
                <span className="text-[12.5px] font-700 tnum text-sl-ink shrink-0">{inr(u.est_value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <FooterAction
        variant="green"
        onClick={onSell}
        loading={valuing}
        hint={valuing ? undefined : "Demand found Rahul — he never decided to sell"}
      >
        See what yours will fetch
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </FooterAction>
    </div>
  );
}

function Radar({ units, mine, maxDist }) {
  // place each unit at a deterministic angle (golden-angle spread) and a radius
  // proportional to its real distance, so the picture maps the seeded geography.
  const R = 46; // % of half-box
  const dots = units.map((u, i) => {
    const angle = i * 137.5 * (Math.PI / 180);
    const rad = (u.distance_km / maxDist) * R;
    return {
      u,
      x: 50 + rad * Math.cos(angle),
      y: 50 + rad * Math.sin(angle),
      mine: u === mine,
    };
  });

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px] rounded-full bg-az-navy overflow-hidden shadow-card">
      {/* rings */}
      {[0.33, 0.66, 1].map((r) => (
        <span
          key={r}
          className="absolute rounded-full border border-sl-green-soft/20"
          style={{ inset: `${(1 - r) * 50}%` }}
        />
      ))}
      {/* crosshair */}
      <span className="absolute left-1/2 top-0 bottom-0 w-px bg-sl-green-soft/10" />
      <span className="absolute top-1/2 left-0 right-0 h-px bg-sl-green-soft/10" />

      {/* sweeping wedge */}
      <span
        className="absolute inset-0 origin-center"
        style={{
          background: "conic-gradient(from 0deg, rgba(52,199,154,0.28), transparent 55%)",
          animation: "spin 3.6s linear infinite",
        }}
      />

      {/* demand point (center) */}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-az-orange shadow-[0_0_10px_2px_rgba(255,153,0,0.8)]" />

      {/* dots */}
      {dots.map(({ u, x, y, mine: isMine }) => (
        <span
          key={u.item_id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%` }}
          title={`${u.owner} · ${u.distance_km} km`}
        >
          {isMine && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-sl-green-soft/70" style={{ animation: "pingRing 1.8s ease-out infinite" }} />
          )}
          <span
            className={`block rounded-full ${isMine ? "w-3 h-3 bg-sl-green-soft shadow-[0_0_8px_2px_rgba(52,199,154,0.9)]" : "w-2 h-2 bg-sl-green-soft/55"}`}
          />
        </span>
      ))}
    </div>
  );
}

function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
