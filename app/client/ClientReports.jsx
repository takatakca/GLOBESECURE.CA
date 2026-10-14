"use client";
import { useEffect, useState } from "react";
export default function ClientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/client/reports", { cache: "no-store" })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Lecture indisponible"); return body; })
      .then((data) => { if (active) setReports(data.reports || []); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <><span className="section-kicker">RAPPORTS APPROUVÉS</span><h2>Documents publiés</h2>{error && <p role="alert" className="form-error">{error}</p>}<div className="client-report-grid">{reports.map((item) => <article key={item.id}><span>{new Date(item.published_at).toLocaleDateString("fr-CA")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}{!reports.length && <p className="muted">{loading ? "Chargement des rapports…" : "Aucun rapport publié pour votre organisation."}</p>}</div></>;
}
