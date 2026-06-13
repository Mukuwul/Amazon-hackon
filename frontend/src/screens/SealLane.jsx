import TopBar from "../components/TopBar";
import Thumb from "../components/Thumb";
import { FooterAction, SourceTag } from "../components/ui";
import { inr } from "../lib/format";

// RTO Sealed Lane — India's biggest bleed is COD refusals. A parcel that was
// never opened doesn't need grading: POST /seal-check verifies the factory seal,
// and a SEALED_NEW verdict lets /route treat it as factory-new (grade A) with no
// scan. The whole beat is "15 seconds, no more".
export default function SealLane({ item, seal, routing, onRoute, onBack }) {
  const conf = Math.round((seal.confidence ?? 0) * 100);
  const sealed = seal.verdict === "SEALED_NEW";
  const ord = item.order || {};

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar
        title="RTO Sealed Lane"
        subtitle={item.title}
        onBack={onBack}
        right={<SourceTag source={seal.source} model={seal.model} latency={seal.latency_ms} />}
      />

      {/* parcel + seal scan */}
      <div className="px-4 pt-4">
        <div className="relative rounded-2xl overflow-hidden bg-az-navy shadow-card">
          <Thumb src={`/items/${item.item_id}/current_1.jpg`} alt="Returned parcel" category={item.category} className="w-full h-52" glyphScale={3} />
          <div className="absolute left-3 top-3">
            <span className="rounded-md bg-black/55 backdrop-blur text-white text-[10px] font-700 px-2 py-1 tracking-wide">
              RETURNED PARCEL · COD REFUSED
            </span>
          </div>
          {/* verdict stamp */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-10 pb-3 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-sl-green grid place-items-center shrink-0 anim-pop">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none">
                <path d="M5 12l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-white font-display font-800 text-[17px] leading-tight">
                {sealed ? "Factory seal intact" : "Seal broken"}
              </p>
              <p className="text-white/70 text-[11.5px] leading-tight">
                {seal.tamper_evidence ? seal.tamper_evidence : "No tamper evidence · never opened"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* verdict facts */}
      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-sl-line p-4 flex items-center gap-4 anim-fade-up">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted">Verdict</p>
            <p className="font-display font-800 text-[20px] leading-tight text-sl-green-deep">{seal.verdict.replace("_", " ")}</p>
            <p className="text-[12px] text-sl-muted mt-0.5">Skips grading — routes as factory-new (grade A)</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display font-800 text-[26px] tnum text-sl-ink leading-none">{conf}%</p>
            <p className="text-[10px] text-sl-muted mt-1">confidence</p>
          </div>
        </div>
      </div>

      {/* why this matters */}
      <div className="px-4 pt-3">
        <div className="rounded-xl bg-sl-mint/60 ring-1 ring-sl-mint-deep p-3">
          <p className="text-[12.5px] text-sl-ink leading-relaxed">
            A sealed box was <span className="font-700">never opened</span> — so there’s nothing to grade.
            It re-enters the catalog the same day and is offered to a local buyer, instead of
            making the round trip to a warehouse.
          </p>
        </div>
      </div>

      {/* provenance */}
      <div className="px-4 pt-3 pb-2">
        <div className="rounded-2xl bg-white shadow-card ring-1 ring-sl-line divide-y divide-sl-line">
          <Row label="Order" value={ord.order_id || "—"} mono />
          <Row label="Return reason" value={item.return_reason || "—"} />
          <Row label="Paid" value={inr(ord.price_paid ?? item.mrp)} />
        </div>
      </div>

      <FooterAction variant="green" onClick={onRoute} loading={routing}>
        Route this sealed unit
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
