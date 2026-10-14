"use client";
import { useEffect, useState } from "react";
import PublishReport from "./PublishReport";
const fmt = (date) => date ? new Date(date).toLocaleString("fr-CA") : "Non disponible";
export default function SupervisorBoard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    async function refresh() {
      try {
        const response = await fetch("/api/supervision/active", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Lecture indisponible.");
        if (mounted) { setData(body); setError(""); }
      } catch (e) { if (mounted) setError(e.message); }
      finally { if (mounted) setLoading(false); }
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);
  return <div className="supervision"><div className="supervision-head"><div><span className="section-kicker">SITUATION TERRAIN</span><h2>Quarts actifs</h2></div><span className="muted">Dernière consultation : {fmt(data?.checkedAt)}</span></div>{error && <p role="alert" className="form-error">{error}</p>}
    <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Agent (identifiant interne)</th><th>Début</th><th>Dernière position reçue</th><th>Horodatage</th></tr></thead><tbody>{data?.shifts?.map((shift) => <tr key={shift.id}><td>{shift.agent_sub.slice(0, 12)}…</td><td>{fmt(shift.started_at)}</td><td>{shift.latitude == null ? "Non transmise" : Number(shift.latitude).toFixed(4) + ", " + Number(shift.longitude).toFixed(4)}</td><td>{fmt(shift.recorded_at)}</td></tr>)}{!data?.shifts?.length && <tr><td colSpan="4">{loading ? "Chargement…" : "Aucun quart actif déclaré."}</td></tr>}</tbody></table></div>
    <div className="supervision-head incident-head"><div><span className="section-kicker">JOURNAL OPÉRATIONNEL</span><h2>Incidents récents</h2></div></div><div className="incidents-list">{data?.incidents?.map((incident) => <article key={incident.id}><span>{incident.category} · {fmt(incident.created_at)}</span><p>{incident.summary}</p></article>)}{!data?.incidents?.length && <p className="muted">{loading ? "Chargement…" : "Aucun incident enregistré."}</p>}</div><PublishReport incidents={data?.incidents || []} /></div>;
}
