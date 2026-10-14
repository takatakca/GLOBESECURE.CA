"use client";
import { useEffect, useRef, useState } from "react";
const consentVersion = "2026-10-14";
const position = (value) => ({ latitude: value.coords.latitude, longitude: value.coords.longitude, accuracy: value.coords.accuracy });
function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Géolocalisation non prise en charge."));
    navigator.geolocation.getCurrentPosition((p) => resolve(position(p)), () => reject(new Error("Permission de localisation refusée ou indisponible.")), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  });
}
async function post(url, body) {
  const response = await fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Opération indisponible.");
  return data;
}
export default function AgentShift() {
  const [active, setActive] = useState(null);
  const [consent, setConsent] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const watch = useRef(null);
  const lastSent = useRef(0);
  useEffect(() => {
    fetch("/api/agent/shifts", { cache: "no-store" }).then(async (r) => {
      const result = await r.json();
      if (!r.ok) throw new Error(result.error || "Accès indisponible.");
      setActive(result.active);
    }).catch((err) => setMessage(err.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!tracking || !active || !navigator.geolocation) return;
    watch.current = navigator.geolocation.watchPosition(async (value) => {
      const now = Date.now();
      if (now - lastSent.current < 60000) return;
      lastSent.current = now;
      try { await post("/api/agent/position", { position: position(value) }); }
      catch (err) { setMessage("Position non transmise : " + err.message); }
    }, () => { setTracking(false); setMessage("Suivi interrompu : autorisation de localisation nécessaire."); }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
    return () => {
      if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    };
  }, [tracking, active]);
  async function start() {
    if (!consent || busy) return;
    setBusy(true); setMessage("");
    try {
      const loc = await locate();
      const result = await post("/api/agent/shifts", { action: "start", consent: true, consentVersion, position: loc });
      setActive(result.shift); lastSent.current = Date.now(); setTracking(true);
      setMessage("Quart commencé. La localisation peut être transmise pendant ce quart.");
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }
  async function stop() {
    if (busy) return;
    setBusy(true); setMessage(""); setTracking(false);
    let loc;
    try { loc = await locate(); } catch { loc = null; }
    try {
      await post("/api/agent/shifts", { action: "stop", position: loc });
      setActive(null); setConsent(false); setMessage("Quart terminé. Le suivi de position est arrêté.");
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }
  return <div className="shift-card"><div className="shift-top"><span>POINTAGE AGENT</span><strong className={active ? "status-active" : "status-idle"}>{loading ? "CHARGEMENT" : active ? "QUART ACTIF" : "HORS QUART"}</strong></div>
    {active ? <><h3>Quart en cours</h3><p>Début : {new Date(active.started_at).toLocaleString("fr-CA")}</p><p className="muted">Localisation dans cet onglet : <strong>{tracking ? "active" : "suspendue"}</strong></p><div className="shift-buttons">{!tracking && <button type="button" className="button button-outline" disabled={busy || !consent} onClick={() => { if (consent) { lastSent.current = 0; setTracking(true); setMessage("Suivi réactivé pour ce quart."); } }}>Reprendre le suivi</button>}<button type="button" className="button button-primary" disabled={busy} onClick={stop}>{busy ? "Traitement…" : "Terminer mon quart — STOP"}</button></div></> : <><h3>Prêt à commencer ?</h3><p className="muted">Votre position sera capturée au début du quart et pourra être actualisée périodiquement pendant que cet onglet est ouvert. Aucun point ne doit être enregistré hors quart.</p><button type="button" className="button button-primary" disabled={loading || busy || !consent} onClick={start}>{busy ? "Traitement…" : "Commencer mon quart — START"}</button></>}
    <label className="shift-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>J'autorise explicitement la collecte de ma localisation pendant ce quart aux fins de coordination et de pointage. Je peux terminer mon quart pour arrêter ce suivi. *</span></label>
    <p className="shift-disclaimer">La localisation est utilisée uniquement dans le cadre de votre quart actif. La conservation, les accès et la politique d'entreprise doivent être approuvés avant le lancement opérationnel.</p>
    {message && <p role="status" className="shift-message">{message}</p>}
  </div>;
}
