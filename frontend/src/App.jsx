import { useEffect, useState } from "react";
import { api } from "./lib/api";
import PhoneFrame from "./components/PhoneFrame";
import RadarToast from "./components/RadarToast";
import { ErrorNote } from "./components/ui";
import Inbox from "./screens/Inbox";
import ItemIntro from "./screens/ItemIntro";
import Grade from "./screens/Grade";
import RouteScreen from "./screens/RouteScreen";
import HealthCard from "./screens/HealthCard";

export default function App() {
  const [screen, setScreen] = useState("inbox");
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [item, setItem] = useState(null);
  const [grade, setGrade] = useState(null);
  const [route, setRoute] = useState(null);
  const [card, setCard] = useState(null);

  const [busy, setBusy] = useState(false); // in-flight transition
  const [listed, setListed] = useState(false);
  const [showToast, setShowToast] = useState(false);
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
    api.metrics().then(setMetrics).catch(() => {});
  }, []);

  function reloadInbox() {
    setErr(null);
    setItemsLoading(true);
    api
      .items()
      .then(({ items }) => setItems(items))
      .catch((e) => setErr({ message: `Still can't reach the engine (${e.message}).`, retry: reloadInbox }))
      .finally(() => setItemsLoading(false));
  }

  async function openItem(row) {
    setErr(null);
    setBusy(true);
    setGrade(null);
    setRoute(null);
    setCard(null);
    setListed(false);
    try {
      const detail = await api.item(row.item_id);
      setItem({ ...row, ...detail.item, passport: detail.passport });
    } catch {
      setItem(row); // fall back to the inbox row; intro still renders
    } finally {
      setBusy(false);
      setScreen("intro");
    }
  }

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
    setShowToast(true);
    api.metrics().then(setMetrics).catch(() => {});
  }

  function goInbox() {
    setShowToast(false);
    setScreen("inbox");
  }

  const winnerPath = route?.paths.find((p) => p.winner);

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
          />
        )}
        {screen === "intro" && item && (
          <ItemIntro item={item} scanning={busy} onScan={runScan} onBack={goInbox} />
        )}
        {screen === "grade" && grade && (
          <Grade item={item} grade={grade} routing={busy} onRoute={runRoute} onBack={() => setScreen("intro")} />
        )}
        {screen === "route" && route && (
          <RouteScreen route={route} building={busy} onHealthCard={buildCard} onBack={() => setScreen("grade")} />
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
      </div>

      {/* radar ping — final spine beat */}
      {showToast && <RadarToast path={winnerPath} onClose={() => setShowToast(false)} />}

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
