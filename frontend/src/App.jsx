import { useEffect, useState } from "react";
import { api } from "./lib/api";
import PhoneFrame from "./components/PhoneFrame";
import RadarToast from "./components/RadarToast";
import { ErrorNote } from "./components/ui";
import { inr } from "./lib/format";
import Inbox from "./screens/Inbox";
import ItemIntro from "./screens/ItemIntro";
import Grade from "./screens/Grade";
import RouteScreen from "./screens/RouteScreen";
import HealthCard from "./screens/HealthCard";
import RadarScreen from "./screens/RadarScreen";
import LiquidityScreen from "./screens/LiquidityScreen";
import SealLane from "./screens/SealLane";
import DiagnoseScreen from "./screens/DiagnoseScreen";
import MetricsScreen from "./screens/MetricsScreen";

// Each inbox item drives a dedicated flow. SL-001 is the ⭐ spine; the rest are
// the MT4 supporting beats. Anything not mapped here stays QUEUED in the inbox.
const LANE = { "SL-002": "radar", "SL-003": "diagnose", "SL-004": "rto" };

export default function App() {
  const [screen, setScreen] = useState("inbox");
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [item, setItem] = useState(null);
  const [lane, setLane] = useState("spine");
  const [grade, setGrade] = useState(null);
  const [route, setRoute] = useState(null);
  const [card, setCard] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [curve, setCurve] = useState(null);
  const [seal, setSeal] = useState(null);
  const [diagnose, setDiagnose] = useState(null);

  const [busy, setBusy] = useState(false); // in-flight transition
  const [listed, setListed] = useState(false);
  const [toast, setToast] = useState(null); // { title, message }
  const [err, setErr] = useState(null);

  const [forceCached, setForceCached] = useState(
    () => localStorage.getItem("sl_force_cached") === "1"
  );
  useEffect(() => {
    localStorage.setItem("sl_force_cached", forceCached ? "1" : "0");
  }, [forceCached]);

  // load inbox + warm the lambda
  useEffect(() => {
    api.health().catch(() => {});
    (async () => {
      try {
        const { items } = await api.items();
        setItems(items);
      } catch (e) {
        setErr({ message: `Couldn't reach the grading engine (${e.message}).`, retry: reloadInbox });
      } finally {
        setItemsLoading(false);
      }
    })();
    refreshMetrics();
  }, []);

  function refreshMetrics() {
    api.metrics().then(setMetrics).catch(() => {});
  }

  function reloadInbox() {
    setErr(null);
    setItemsLoading(true);
    api
      .items()
      .then(({ items }) => setItems(items))
      .catch((e) => setErr({ message: `Still can't reach the engine (${e.message}).`, retry: reloadInbox }))
      .finally(() => setItemsLoading(false));
  }

  function resetItemState() {
    setGrade(null);
    setRoute(null);
    setCard(null);
    setRadarData(null);
    setCurve(null);
    setSeal(null);
    setDiagnose(null);
    setListed(false);
    setToast(null);
  }

  async function openItem(row) {
    setErr(null);
    resetItemState();
    const thisLane = LANE[row.item_id] || "spine";
    setLane(thisLane);
    setBusy(true);
    try {
      const detail = await api.item(row.item_id).catch(() => null);
      const it = detail ? { ...row, ...detail.item, passport: detail.passport } : row;
      setItem(it);
      if (thisLane === "radar") {
        const r = await api.radar(it.asin);
        setRadarData(r);
        setScreen("radar");
      } else if (thisLane === "diagnose") {
        const d = await api.diagnose(it.asin);
        setDiagnose(d);
        setScreen("diagnose");
      } else if (thisLane === "rto") {
        const s = await api.sealCheck(it.item_id, forceCached);
        setSeal(s);
        setScreen("seal");
      } else {
        setScreen("intro");
      }
    } catch (e) {
      setErr({ message: `Couldn't open this item (${e.detail || e.message}).`, retry: () => openItem(row) });
    } finally {
      setBusy(false);
    }
  }

  // --- spine (SL-001) ---
  async function runScan() {
    setErr(null);
    setBusy(true);
    try {
      const g = await api.grade(item.item_id, forceCached);
      setGrade(g);
      setScreen("grade");
    } catch (e) {
      setErr({ message: `Grading failed (${e.detail || e.message}).`, retry: runScan });
    } finally {
      setBusy(false);
    }
  }

  async function runRoute() {
    setErr(null);
    setBusy(true);
    try {
      const r = await api.routeSafe(item.item_id, forceCached);
      setRoute(r);
      setScreen("route");
    } catch (e) {
      setErr({ message: `Routing failed (${e.detail || e.message}).`, retry: runRoute });
    } finally {
      setBusy(false);
    }
  }

  async function buildCard() {
    setErr(null);
    setBusy(true);
    try {
      const c = await api.healthCardSafe(item.item_id, forceCached);
      setCard(c);
      setScreen("card");
    } catch (e) {
      setErr({ message: `Health Card failed (${e.detail || e.message}).`, retry: buildCard });
    } finally {
      setBusy(false);
    }
  }

  function listItem() {
    setListed(true);
    const w = route?.paths.find((p) => p.winner);
    const msg = w
      ? `${w.note || "Buyers matched nearby"}${w.distance_km != null ? ` · nearest ${w.distance_km} km` : ""}`
      : "Buyers matched nearby";
    setToast({ title: "Idle Asset Radar · ping sent", message: msg });
    refreshMetrics();
  }

  // --- radar lane (SL-002) ---
  async function openLiquidity() {
    setErr(null);
    setBusy(true);
    try {
      const c = await api.priceCurveSafe(item.item_id);
      setCurve(c);
      setScreen("liquidity");
    } catch (e) {
      setErr({ message: `Couldn't price this item (${e.detail || e.message}).`, retry: openLiquidity });
    } finally {
      setBusy(false);
    }
  }

  function listIdle(point) {
    setToast({
      title: "Listed · buyers pinged",
      message: `${inr(point.price)} ask · ${point.buyers_at_price} buyers ready, sells in ~${point.est_days_to_sell} days. Refund parked as Amazon credit.`,
    });
    refreshMetrics();
  }

  // --- RTO lane (SL-004) ---
  async function runRtoRoute() {
    setErr(null);
    setBusy(true);
    try {
      const r = await api.routeRto(item.item_id, forceCached);
      setRoute(r);
      setScreen("route");
    } catch (e) {
      setErr({ message: `Routing failed (${e.detail || e.message}).`, retry: runRtoRoute });
    } finally {
      setBusy(false);
    }
  }

  function listRto() {
    setListed(true);
    setToast({
      title: "Sealed unit relisted",
      message: "Local pickup booked — refund already released as credit. The box never saw a warehouse.",
    });
    refreshMetrics();
  }

  function goInbox() {
    setToast(null);
    setErr(null);
    setScreen("inbox");
  }

  return (
    <PhoneFrame>
      <div key={screen} className="h-full anim-fade-in">
        {screen === "inbox" && (
          <Inbox
            items={items}
            metrics={metrics}
            loading={itemsLoading}
            forceCached={forceCached}
            onForceCached={setForceCached}
            onOpen={openItem}
            onShowMetrics={() => setScreen("metrics")}
          />
        )}
        {screen === "intro" && item && (
          <ItemIntro item={item} scanning={busy} onScan={runScan} onBack={goInbox} />
        )}
        {screen === "grade" && grade && (
          <Grade item={item} grade={grade} routing={busy} onRoute={runRoute} onBack={() => setScreen("intro")} />
        )}
        {screen === "route" && route && (
          <RouteScreen
            route={route}
            building={busy}
            onHealthCard={lane === "rto" ? listRto : buildCard}
            nextLabel={lane === "rto" ? "List for local pickup" : undefined}
            nextHint={lane === "rto" ? "Sealed unit · routes straight to a local buyer" : undefined}
            onBack={() => setScreen(lane === "rto" ? "seal" : "grade")}
          />
        )}
        {screen === "card" && card && (
          <HealthCard
            item={item}
            card={card}
            listed={listed}
            building={false}
            onList={listItem}
            onBack={() => setScreen("route")}
          />
        )}
        {screen === "radar" && radarData && item && (
          <RadarScreen item={item} radar={radarData} valuing={busy} onSell={openLiquidity} onBack={goInbox} />
        )}
        {screen === "liquidity" && curve && item && (
          <LiquidityScreen item={item} curve={curve} listing={false} onList={listIdle} onBack={() => setScreen("radar")} />
        )}
        {screen === "seal" && seal && item && (
          <SealLane item={item} seal={seal} routing={busy} onRoute={runRtoRoute} onBack={goInbox} />
        )}
        {screen === "diagnose" && diagnose && item && (
          <DiagnoseScreen item={item} diagnose={diagnose} onBack={goInbox} />
        )}
        {screen === "metrics" && (
          <MetricsScreen metrics={metrics} onBack={goInbox} onDone={goInbox} />
        )}
      </div>

      {/* radar ping — fires on every list/handoff beat */}
      {toast && <RadarToast title={toast.title} message={toast.message} onClose={() => setToast(null)} />}

      {/* global error */}
      {err && (
        <div className="absolute inset-x-0 bottom-0 z-[60]">
          <ErrorNote
            onRetry={
              err.retry
                ? () => {
                    const r = err.retry;
                    setErr(null);
                    r();
                  }
                : undefined
            }
          >
            {err.message}
          </ErrorNote>
        </div>
      )}
    </PhoneFrame>
  );
}
