import TopBar from "../components/TopBar";
import { Spinner } from "../components/ui";
import { inr } from "../lib/format";

// UPI checkout (MT9). Driven entirely by the /checkout/{persona} response:
// status "pending" → an approve-in-your-UPI-app collect card; status "success" →
// order placed. No real payment — it's an API-returned demo confirmation.
export default function Checkout({ checkout, confirming, onConfirm, onDone, onBack }) {
  if (!checkout) return null;
  const success = checkout.status === "success";

  return (
    <div className="screen-scroll">
      <TopBar title="Checkout" subtitle={success ? "Order placed" : "Approve in your UPI app"} onBack={success ? undefined : onBack} />

      <div className="rounded-2xl bg-white ring-1 ring-sl-line shadow-card p-6 anim-fade-up">
        {success ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-sl-mint grid place-items-center anim-pop">
              <svg viewBox="0 0 24 24" className="w-9 h-9 text-sl-green-deep" fill="none">
                <path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="mt-4 font-display font-800 text-[22px] text-sl-ink">Payment successful</h2>
            <p className="text-[13px] text-sl-muted mt-1">
              {inr(checkout.amount)} paid via UPI. Order <span className="tnum font-600 text-sl-ink">{checkout.order_id}</span> is confirmed.
            </p>
            <button onClick={onDone} className="mt-5 h-11 px-6 rounded-xl bg-az-orange text-az-navy font-700 text-[14px] hover:bg-az-orange-deep transition active:scale-[0.99]">
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted">Amount payable</p>
                <p className="font-display font-800 text-[30px] tnum text-sl-ink leading-none mt-1">{inr(checkout.amount)}</p>
              </div>
              <UpiMark />
            </div>

            <div className="mt-5 rounded-xl bg-sl-paper ring-1 ring-sl-line p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex w-9 h-9 shrink-0 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border border-sl-green-soft/70" style={{ animation: "pingRing 1.8s ease-out infinite" }} />
                  <span className="w-7 h-7 rounded-full bg-sl-mint grid place-items-center text-sl-green-deep text-[15px]">↓</span>
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-700 text-sl-ink">Collect request sent</p>
                  <p className="text-[12px] text-sl-muted">to <span className="tnum font-600 text-sl-ink">{checkout.upi_vpa}</span> — open your UPI app to approve.</p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[12px] text-sl-muted leading-relaxed">
              Order <span className="tnum font-600 text-sl-ink">{checkout.order_id}</span> is pending. Approve the
              {" "}{inr(checkout.amount)} request in your UPI app to confirm.
            </p>

            <button
              onClick={onConfirm}
              disabled={confirming}
              className="mt-5 w-full h-12 rounded-xl bg-sl-green text-white font-700 text-[15px] hover:bg-sl-green-deep transition active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_8px_22px_-8px_rgba(31,163,122,0.75)]"
            >
              {confirming && <Spinner className="w-4 h-4" />}
              {confirming ? "Confirming…" : "I’ve approved the payment"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function UpiMark() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-az-slate text-white px-3 py-1.5 text-[12px] font-800 tracking-wide">
      <span className="text-sl-green-soft">U</span>
      <span className="text-az-orange">P</span>
      <span className="text-sl-mint-deep">I</span>
    </span>
  );
}
