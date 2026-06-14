import TopBar from "../components/TopBar";
import Thumb from "../components/Thumb";
import { SLBadge, Spinner } from "../components/ui";
import GreenLedger from "../components/GreenLedger";
import { num } from "../lib/format";

// Seller return-rate dashboard (MT9 web table) — the seller-side PREVENT moment.
// GET /seller/returns lists the catalog worst-first by return rate; tapping a
// diagnosable SKU reuses /diagnose-listing for the AI fix + projected drop. Every
// figure is API-backed.
export default function SellerDashboard({ data, loading, busy, busyAsin, onDiagnose, onBack }) {
  const skus = data?.skus || [];
  const worst = skus[0];
  const overallRate = data && data.total_units_sold
    ? Math.round((data.total_returns / data.total_units_sold) * 100)
    : 0;

  return (
    <div className="screen-page">
      <TopBar title={data?.seller?.name || "Seller Central"} subtitle="Returns dashboard" onBack={onBack} right={<SLBadge />} />

      {loading && <div className="grid place-items-center py-16 text-sl-muted"><Spinner /></div>}

      {!loading && data && (
        <>
          <div className="relative overflow-hidden rounded-2xl bg-az-slate text-white p-5 sm:p-6 shadow-card anim-fade-up">
            <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-az-orange/15 blur-3xl" />
            <p className="text-white/55 text-[11px] font-700 uppercase tracking-wider">Returns this quarter</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="font-display font-800 text-4xl sm:text-5xl leading-none tnum">{num(data.total_returns)}</span>
              <span className="text-white/70 text-[14px] mb-1">of {num(data.total_units_sold)} units · {overallRate}%</span>
            </div>
            {worst && (
              <p className="mt-2.5 text-[13px] text-az-orange font-600 leading-snug">
                “{worst.title}” drives the most — {worst.return_rate_pct}% come back. Fix it first.
              </p>
            )}
          </div>

          {/* MT15 — the seller's own Green Ledger, a subtle impact strip */}
          <div className="mt-4 anim-fade-up">
            <p className="mb-2 text-[11px] font-700 uppercase tracking-wider text-sl-muted">Your Second Life impact</p>
            <GreenLedger persona="vastram" />
          </div>

          <p className="mt-7 mb-3 text-[12px] font-700 uppercase tracking-wider text-sl-muted">Listings · worst-first</p>

          <div className="rounded-2xl bg-white ring-1 ring-sl-line shadow-card overflow-hidden anim-fade-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="text-[11px] font-700 uppercase tracking-wider text-sl-muted bg-sl-paper/70">
                    <th className="py-3 px-4">Listing</th>
                    <th className="py-3 px-3 text-right tnum">Sold</th>
                    <th className="py-3 px-3 text-right tnum">Returns</th>
                    <th className="py-3 px-3 text-right">Rate</th>
                    <th className="py-3 px-4">Top reason</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sl-line">
                  {skus.map((s) => (
                    <SkuRow key={s.asin} sku={s} busy={busy && busyAsin === s.asin} onDiagnose={onDiagnose} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SkuRow({ sku, busy, onDiagnose }) {
  const high = sku.return_rate_pct >= 15;
  const tone = high ? "var(--color-neg)" : sku.return_rate_pct >= 6 ? "var(--color-warn)" : "var(--color-sl-muted)";
  const clickable = sku.diagnosable;

  return (
    <tr className={`align-middle ${high ? "bg-neg/3" : ""}`}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Thumb src={sku.thumb} alt={sku.title} category={sku.category} className="w-12 h-12 rounded-lg shrink-0" />
          <span className="font-600 text-[13px] text-sl-ink leading-tight">{sku.title}</span>
        </div>
      </td>
      <td className="py-3 px-3 text-right tnum text-[13px] text-sl-muted">{num(sku.units_sold)}</td>
      <td className="py-3 px-3 text-right tnum text-[13px] text-sl-ink font-600">{num(sku.returns)}</td>
      <td className="py-3 px-3 text-right">
        <span className="font-display font-800 text-[18px] tnum leading-none" style={{ color: tone }}>{sku.return_rate_pct}%</span>
      </td>
      <td className="py-3 px-4 text-[12.5px] text-sl-muted">“{sku.top_return_reason}”</td>
      <td className="py-3 px-4 text-right">
        {clickable ? (
          <button
            onClick={() => onDiagnose(sku)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-[12.5px] font-800 text-white bg-sl-green hover:bg-sl-green-deep transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? <Spinner className="w-3.5 h-3.5" /> : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
                <path d="M5 19c0-7 5-13 14-14 0 9-5 15-14 14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            )}
            {busy ? "Analysing…" : "See the AI fix"}
          </button>
        ) : (
          <span className="text-[11px] text-sl-muted">—</span>
        )}
      </td>
    </tr>
  );
}
