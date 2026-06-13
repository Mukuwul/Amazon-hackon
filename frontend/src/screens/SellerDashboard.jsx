import TopBar from "../components/TopBar";
import Thumb from "../components/Thumb";
import { SLBadge, Spinner } from "../components/ui";
import { num } from "../lib/format";

// Seller dashboard — the seller-side PREVENT moment. GET /seller/returns lists the
// catalog worst-first by return rate; tapping a diagnosable SKU reuses
// /diagnose-listing for the AI fix + projected drop. Every figure is API-backed.
export default function SellerDashboard({ data, loading, busy, busyAsin, onDiagnose, onBack }) {
  const skus = data?.skus || [];
  const worst = skus[0];
  const overallRate = data && data.total_units_sold
    ? Math.round((data.total_returns / data.total_units_sold) * 100)
    : 0;

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title={data?.seller?.name || "Seller Central"} subtitle="Returns dashboard" onBack={onBack} right={<SLBadge />} />

      {loading && <div className="grid place-items-center py-16 text-sl-muted"><Spinner /></div>}

      {!loading && data && (
        <>
          {/* headline */}
          <div className="px-4 pt-4">
            <div className="relative overflow-hidden rounded-2xl bg-az-slate text-white p-4 shadow-card anim-fade-up">
              <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-az-orange/20 blur-2xl" />
              <p className="text-white/55 text-[11px] font-600 uppercase tracking-wider">Returns this quarter</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="font-display font-800 text-4xl leading-none tnum">{num(data.total_returns)}</span>
                <span className="text-white/70 text-[13px] mb-0.5">of {num(data.total_units_sold)} units · {overallRate}%</span>
              </div>
              {worst && (
                <p className="mt-2 text-[12px] text-az-orange font-600 leading-snug">
                  “{worst.title}” drives the most — {worst.return_rate_pct}% come back. Fix it first.
                </p>
              )}
            </div>
          </div>

          <p className="px-5 pt-5 pb-2 text-[11px] font-700 uppercase tracking-wider text-sl-muted">
            Listings · worst-first
          </p>

          <div className="px-4 space-y-2.5 pb-8">
            {skus.map((s, i) => (
              <SkuRow key={s.asin} sku={s} rank={i} busy={busy && busyAsin === s.asin} onDiagnose={onDiagnose} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SkuRow({ sku, rank, busy, onDiagnose }) {
  const high = sku.return_rate_pct >= 15;
  const tone = high ? "var(--color-neg)" : sku.return_rate_pct >= 6 ? "var(--color-warn)" : "var(--color-sl-muted)";
  const clickable = sku.diagnosable;

  const Wrap = clickable ? "button" : "div";
  return (
    <Wrap
      onClick={clickable ? () => onDiagnose(sku) : undefined}
      className={`group w-full text-left rounded-2xl bg-white ring-1 shadow-card p-3 flex gap-3 anim-fade-up transition ${
        clickable ? "ring-sl-line hover:ring-sl-green/60 hover:shadow-pop active:scale-[0.99] cursor-pointer" : "ring-sl-line/70"
      } ${high ? "ring-neg/30" : ""}`}
      style={{ animationDelay: `${rank * 45}ms` }}
    >
      <Thumb src={sku.thumb} alt={sku.title} category={sku.category} className="w-14 h-14 rounded-xl shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="font-600 text-[13px] leading-tight text-sl-ink truncate">{sku.title}</h3>
        <p className="text-[11px] text-sl-muted mt-0.5 truncate">
          {num(sku.returns)} returns / {num(sku.units_sold)} sold · “{sku.top_return_reason}”
        </p>
        {clickable && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-800 text-sl-green-deep">
            {busy ? <Spinner className="w-3.5 h-3.5" /> : <SLBadge />}
            {busy ? "Analysing…" : "See the AI fix"}
          </span>
        )}
      </div>
      <div className="self-center text-right shrink-0">
        <p className="font-display font-800 text-[20px] tnum leading-none" style={{ color: tone }}>{sku.return_rate_pct}%</p>
        <p className="text-[9.5px] text-sl-muted mt-0.5">return rate</p>
      </div>
    </Wrap>
  );
}
