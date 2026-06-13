import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import Thumb from "../components/Thumb";
import { FooterAction, SLBadge } from "../components/ui";
import { inr } from "../lib/format";

const SCAN_STEPS = [
  "Loading day-0 birth-certificate photos…",
  "Aligning current condition to original…",
  "Detecting wear, defects & completeness…",
  "Verifying this is the same physical unit…",
  "Scoring grade & confidence…",
];

export default function ItemIntro({ item, scanning, onScan, onBack }) {
  const id = item.item_id;
  const day0 = [`/items/${id}/day0_1.jpg`, `/items/${id}/day0_2.jpg`];
  const current = `/items/${id}/current_1.jpg`;
  const ord = item.order || {};

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title="Return inspection" subtitle={item.title} onBack={onBack} />

      <div className="px-4 pt-4 pb-2">
        {/* current-condition capture frame */}
        <div className="relative rounded-2xl overflow-hidden bg-az-navy shadow-card">
          <Thumb src={current} alt={`${item.title} — current condition`} category={item.category} className="w-full h-56" glyphScale={3} />
          {/* viewfinder corners */}
          <Corners />
          {scanning && <ScanSweep />}
          <div className="absolute left-3 top-3">
            <span className="rounded-md bg-black/55 backdrop-blur text-white text-[10px] font-700 px-2 py-1 tracking-wide">
              CURRENT CONDITION
            </span>
          </div>
          {scanning && <ScanCaptions />}
        </div>

        {/* day-0 birth certificate */}
        <div className="mt-3 rounded-2xl bg-white shadow-card ring-1 ring-sl-line p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <SLBadge />
              <span className="text-[11px] font-700 text-sl-ink">Day-0 birth certificate</span>
            </div>
            <span className="text-[10px] font-600 text-sl-green-deep bg-sl-mint rounded-full px-2 py-0.5">
              ON FILE
            </span>
          </div>
          <div className="flex gap-2">
            {day0.map((src, i) => (
              <Thumb key={i} src={src} alt={`Day-0 photo ${i + 1}`} category={item.category} className="flex-1 h-20 rounded-lg ring-1 ring-sl-line" />
            ))}
            <div className="flex-1 h-20 rounded-lg bg-sl-paper ring-1 ring-dashed ring-sl-line grid place-items-center text-center px-1">
              <span className="text-[10px] text-sl-muted leading-tight font-600">graded vs.<br />these</span>
            </div>
          </div>
          <p className="mt-2 text-[11.5px] text-sl-muted leading-relaxed">
            Captured the day it was delivered. The AI grades wear against these — not a generic
            catalog photo — so the score is about <span className="text-sl-ink font-600">this exact unit</span>.
          </p>
        </div>

        {/* provenance */}
        <div className="mt-3 rounded-2xl bg-white shadow-card ring-1 ring-sl-line divide-y divide-sl-line">
          <Row label="Order" value={ord.order_id || "—"} mono />
          <Row label="Purchased" value={fmtDate(ord.purchase_date)} />
          <Row label="Paid" value={inr(ord.price_paid ?? item.mrp)} />
          <Row
            label="Invoice"
            value={
              <span className="inline-flex items-center gap-1 text-sl-green-deep font-700">
                <Check /> Verified · single owner
              </span>
            }
          />
          <Row label="Warranty on record" value={`${item.warranty_months ?? 0} months`} />
        </div>

        {item.return_reason && (
          <div className="mt-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3 py-2.5 flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">⤺</span>
            <p className="text-[12.5px] text-amber-800">
              Returned by buyer — <span className="font-700">“{item.return_reason}”</span>
            </p>
          </div>
        )}
      </div>

      <FooterAction
        variant="green"
        onClick={onScan}
        loading={scanning}
        hint={scanning ? undefined : "Nova-2 multimodal · grades in ~2s"}
      >
        {scanning ? "Scanning…" : "Run Second Life AI scan"}
      </FooterAction>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5">
      <span className="text-[12px] text-sl-muted">{label}</span>
      <span className={`text-[12.5px] font-600 text-sl-ink text-right ${mono ? "tnum" : ""}`}>{value}</span>
    </div>
  );
}

function Corners() {
  const c = "absolute w-6 h-6 border-sl-green-soft";
  return (
    <>
      <span className={`${c} border-t-2 border-l-2 rounded-tl-lg left-3 top-3`} />
      <span className={`${c} border-t-2 border-r-2 rounded-tr-lg right-3 top-3`} />
      <span className={`${c} border-b-2 border-l-2 rounded-bl-lg left-3 bottom-3`} />
      <span className={`${c} border-b-2 border-r-2 rounded-br-lg right-3 bottom-3`} />
    </>
  );
}

function ScanSweep() {
  return (
    <span
      className="absolute left-0 right-0 h-16 pointer-events-none"
      style={{
        background: "linear-gradient(180deg, transparent, rgba(52,199,154,0.35), transparent)",
        boxShadow: "0 0 22px 4px rgba(52,199,154,0.5)",
        animation: "scanSweep 1.4s ease-in-out infinite",
      }}
    />
  );
}

function ScanCaptions() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SCAN_STEPS.length), 850);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pt-8 pb-3">
      <p key={i} className="text-white text-[12px] font-600 anim-fade-in flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-sl-green-soft animate-pulse" />
        {SCAN_STEPS[i]}
      </p>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
      <path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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
