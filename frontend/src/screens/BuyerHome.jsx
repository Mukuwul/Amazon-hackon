import { useState } from "react";
import TopBar from "../components/TopBar";
import Thumb from "../components/Thumb";
import { SLBadge, Spinner } from "../components/ui";
import { inr } from "../lib/format";

// Buyer hub (Rahul). Two tabs:
//  • Shop — a storefront; tap a product → PDP with fit proof (PREVENT).
//  • Your orders — real order history; one-tap Resell on the idle monitor flows
//    into the Idle Asset Radar (RECIRCULATE).
const FIT_ASINS = new Set(["B0SHOE500", "B0KURTA01"]); // carry size social proof

export default function BuyerHome({ items, orders, ordersLoading, busy, onOpenPdp, onResell, onReturn, onBack }) {
  const [tab, setTab] = useState("shop");

  return (
    <div className="screen-scroll bg-sl-paper">
      <TopBar title="Amazon" subtitle="Hello, Rahul" onBack={onBack} right={<SLBadge />} />

      {/* tabs */}
      <div className="sticky top-[84px] z-20 bg-sl-paper/95 backdrop-blur-sm px-4 pt-3 pb-2">
        <div className="flex rounded-full bg-white ring-1 ring-sl-line p-0.5 text-[12.5px] font-700">
          <Tab active={tab === "shop"} onClick={() => setTab("shop")}>Shop</Tab>
          <Tab active={tab === "orders"} onClick={() => setTab("orders")}>
            Your orders{orders?.length ? ` · ${orders.length}` : ""}
          </Tab>
        </div>
      </div>

      {tab === "shop" ? (
        <div className="px-4 pt-1 pb-8">
          <p className="text-[11px] font-700 uppercase tracking-wider text-sl-muted mb-2">Recommended for you</p>
          <div className="grid grid-cols-2 gap-2.5">
            {items.map((it, i) => (
              <button
                key={it.item_id}
                onClick={() => onOpenPdp(it)}
                className="group text-left rounded-2xl bg-white ring-1 ring-sl-line shadow-card p-2.5 transition hover:ring-sl-green/60 hover:shadow-pop active:scale-[0.98] anim-fade-up"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <Thumb src={it.thumb} alt={it.title} category={it.category} className="w-full aspect-square rounded-xl" />
                <div className="mt-2 min-h-[34px]">
                  <h3 className="font-600 text-[12px] leading-tight text-sl-ink line-clamp-2">{it.title}</h3>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-display font-800 text-[15px] tnum text-sl-ink">{inr(it.mrp)}</span>
                  {FIT_ASINS.has(it.asin) && (
                    <span className="rounded-full bg-sl-mint text-sl-green-deep text-[8.5px] font-800 px-1.5 py-0.5 tracking-wide">FIT PROOF</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 pt-1 pb-8">
          {ordersLoading && <div className="grid place-items-center py-10 text-sl-muted"><Spinner /></div>}
          {!ordersLoading && (orders || []).map((o, i) => (
            <OrderRow key={o.order_id} order={o} busy={busy} onResell={onResell} onReturn={onReturn} delay={i * 45} />
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-1.5 rounded-full transition ${active ? "bg-az-navy text-white" : "text-sl-muted"}`}
    >
      {children}
    </button>
  );
}

function OrderRow({ order, busy, onResell, onReturn, delay }) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-sl-line shadow-card p-3 mb-2.5 anim-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex gap-3">
        <Thumb src={`/items/${order.item_id || "x"}/current_1.jpg`} alt={order.title} category="electronics" className="w-14 h-14 rounded-xl shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-600 text-[13px] leading-tight text-sl-ink truncate">{order.title}</h3>
          <p className="text-[11px] text-sl-muted mt-0.5">
            Delivered · {fmtDate(order.purchase_date)}
          </p>
          <p className="text-[11px] text-sl-muted mt-0.5">Paid {inr(order.price_paid)}</p>
        </div>
      </div>
      <div className="mt-2.5 flex gap-2">
        <button
          onClick={() => onReturn(order)}
          className="flex-1 h-9 rounded-lg text-[12.5px] font-700 bg-white text-sl-ink ring-1 ring-sl-line hover:bg-sl-paper transition active:scale-[0.98]"
        >
          Return or replace
        </button>
        {order.resellable ? (
          <button
            onClick={() => onResell(order)}
            disabled={busy}
            className="flex-1 h-9 rounded-lg text-[12.5px] font-800 bg-sl-green text-white hover:bg-sl-green-deep transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {busy && <Spinner className="w-3.5 h-3.5" />}
            Resell on Second Life
          </button>
        ) : (
          <span className="flex-1 h-9 rounded-lg text-[11px] font-600 text-sl-muted bg-sl-paper ring-1 ring-sl-line grid place-items-center">
            No local demand yet
          </span>
        )}
      </div>
    </div>
  );
}

function fmtDate(s) {
  try {
    return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return s;
  }
}
