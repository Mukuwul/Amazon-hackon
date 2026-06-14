import TopBar from "../components/TopBar";
import Thumb from "../components/Thumb";
import { FooterAction, SLBadge } from "../components/ui";
import { inr, gradeColor, gradeLabel } from "../lib/format";

export default function HealthCard({ item, card, listed, building, onList, onBack }) {
  const prov = card.provenance || {};
  const w = card.warranty || {};
  const topDefect = card.defects?.[0];

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title="Product Health Card" subtitle="Transferable trust record" onBack={onBack} right={<SLBadge />} />

      <div className="px-4 pt-4 pb-2">
        {/* passport card */}
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-sl-line overflow-hidden anim-fade-up">
          {/* header band */}
          <div className="relative bg-az-navy text-white p-4">
            <div className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-sl-green/25 blur-2xl" />
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl grid place-items-center font-display font-800 text-3xl text-white shrink-0"
                style={{ background: gradeColor(card.grade) }}
              >
                {card.grade}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-700 uppercase tracking-wider text-white/50">Certified condition</p>
                <h2 className="font-display font-700 text-[15px] leading-tight truncate">{card.title}</h2>
                <p className="text-[12px] text-sl-green-soft font-600 mt-0.5">{gradeLabel(card.grade)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Suggested price</p>
                <p className="font-display font-800 text-2xl tnum">{inr(card.suggested_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Originally</p>
                <p className="text-[13px] text-white/70 tnum line-through">{inr(prov.price_paid)}</p>
              </div>
            </div>
          </div>

          {/* warranty transfer — the trust centerpiece */}
          <div className="m-3 rounded-xl bg-sl-mint ring-1 ring-sl-mint-deep p-3.5">
            <div className="flex items-center gap-3">
              <ShieldTransfer />
              <div className="flex-1">
                <p className="font-700 text-[13.5px] text-sl-green-deep">
                  {w.remaining_months} of {w.total_months} months warranty remain
                </p>
                <p className="text-[12px] text-sl-green-deep/80 mt-0.5">
                  {w.transferable ? "Transfers automatically to the next owner" : "Non-transferable"}
                </p>
              </div>
              {w.transferable && (
                <span className="rounded-full bg-sl-green text-white text-[10px] font-800 px-2.5 py-1 tracking-wide">
                  TRANSFERS
                </span>
              )}
            </div>
            <WarrantyBar remaining={w.remaining_months} total={w.total_months} />
          </div>

          {/* usage certification (MT14) — quantified device health for electronics,
              the trust hook behind Amazon Renewed routing. Renders only when present. */}
          {card.usage_cert && (
            <div className="mx-3 mb-3 rounded-xl bg-az-navy/[0.04] ring-1 ring-sl-line p-3.5">
              <div className="flex items-center gap-3">
                <BatteryIcon />
                <div className="flex-1 min-w-0">
                  <p className="font-700 text-[13.5px] text-sl-ink">
                    {card.usage_cert.metric} · {card.usage_cert.value}
                  </p>
                  <p className="text-[12px] text-sl-muted mt-0.5">
                    {card.usage_cert.detail} · verified via {card.usage_cert.source}
                  </p>
                </div>
                <span className="rounded-full bg-az-navy text-white text-[10px] font-800 px-2.5 py-1 tracking-wide shrink-0">
                  CERTIFIED
                </span>
              </div>
            </div>
          )}

          {/* provenance */}
          <div className="px-3 pb-1 divide-y divide-sl-line">
            <Fact label="First sold" value={fmtDate(prov.purchase_date)} />
            <Fact
              label="Ownership"
              value={
                <Ok>{prov.single_owner ? "Single owner — verified" : "Multiple owners"}</Ok>
              }
            />
            <Fact label="Invoice" value={<Ok>{prov.invoice_verified ? "Verified on file" : "Unverified"}</Ok>} />
          </div>

          {/* grading summary */}
          {topDefect && (
            <div className="m-3 rounded-xl bg-sl-paper p-3">
              <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted mb-1">Grading report</p>
              <p className="text-[12.5px] text-sl-ink">
                <span className="font-700 capitalize">{topDefect.area}</span> — {topDefect.description}
              </p>
              <p className="text-[12px] text-sl-muted italic mt-1.5 leading-relaxed">“{card.justification}”</p>
            </div>
          )}

          {/* price decay sparkline */}
          {card.price_decay?.length > 1 && (
            <div className="m-3 rounded-xl ring-1 ring-sl-line p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted">Price decay</p>
                <span className="text-[10px] font-700 text-neg">−5% / week</span>
              </div>
              <Sparkline points={card.price_decay} />
              <div className="flex justify-between mt-1 text-[10px] text-sl-muted tnum">
                <span>now {inr(card.price_decay[0].price)}</span>
                <span>
                  wk {card.price_decay[card.price_decay.length - 1].week} ·{" "}
                  {inr(card.price_decay[card.price_decay.length - 1].price)}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-sl-muted leading-snug">
                Listed today captures peak value — the engine prices the urgency in.
              </p>
            </div>
          )}

          {/* photos */}
          {card.photos?.length > 0 && (
            <div className="px-3 pb-4">
              <div className="flex gap-2">
                {card.photos.slice(0, 3).map((src, i) => (
                  <Thumb key={i} src={src} alt={`Photo ${i + 1}`} category={item.category} className="flex-1 h-16 rounded-lg ring-1 ring-sl-line" />
                ))}
              </div>
            </div>
          )}
        </div>

        {listed && (
          <p className="mt-3 text-center text-[12px] text-sl-green-deep font-600 anim-fade-in">
            ✓ Listed on Second Life — buyers nearby are being pinged.
          </p>
        )}
      </div>

      <FooterAction variant={listed ? "ghost" : "primary"} onClick={onList} disabled={listed} loading={building}>
        {listed ? "Listed — radar is pinging buyers" : "List on Second Life"}
      </FooterAction>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-[12px] text-sl-muted">{label}</span>
      <span className="text-[12.5px] font-600 text-sl-ink">{value}</span>
    </div>
  );
}

function Ok({ children }) {
  return (
    <span className="inline-flex items-center gap-1 text-sl-green-deep font-700">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
        <path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  );
}

function WarrantyBar({ remaining, total }) {
  const pct = total ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  return (
    <div className="mt-2.5 h-1.5 rounded-full bg-white/70 overflow-hidden">
      <span className="block h-full rounded-full bg-sl-green transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
    </div>
  );
}

function Sparkline({ points }) {
  const prices = points.map((p) => p.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const span = max - min || 1;
  const lastWeek = points[points.length - 1].week || 1;
  const pad = 4;
  const x = (wk) => (wk / lastWeek) * 100;
  const y = (price) => pad + (1 - (price - min) / span) * (40 - 2 * pad);

  const line = points.map((p) => `${x(p.week)},${y(p.price)}`).join(" ");
  const area = `0,40 ${line} 100,40`;
  const lineLen = 220;

  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-16">
      <defs>
        <linearGradient id="decay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-sl-green)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-sl-green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#decay)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--color-sl-green-deep)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray={lineLen}
        strokeDashoffset={lineLen}
        style={{ animation: "drawline 1.1s ease forwards 0.1s" }}
      />
      <circle cx={x(points[0].week)} cy={y(points[0].price)} r="2" fill="var(--color-sl-green-deep)" vectorEffect="non-scaling-stroke" />
      <style>{`@keyframes drawline{to{stroke-dashoffset:0}}`}</style>
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-az-navy shrink-0" fill="none">
      <rect x="3" y="8" width="15" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 11v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="5" y="10" width="8" height="4" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function ShieldTransfer() {
  return (
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-sl-green-deep shrink-0" fill="none">
      <path d="M12 2.5l7.5 3v5.5c0 4.8-3.2 8-7.5 9.5C7.7 19 4.5 15.8 4.5 11V5.5l7.5-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 11h6m0 0-2-2m2 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}
