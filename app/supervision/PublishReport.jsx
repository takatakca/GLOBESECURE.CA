"use client";
import { useState } from "react";
export default function PublishReport({ incidents }) {
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setResult("");
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/supervision/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...raw, reviewed: raw.reviewed === "on" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publication impossible.");
      form.reset(); setResult("Rapport publié dans l’espace client de cette organisation.");
    } catch(e) { setResult(e.message); }
    finally { setBusy(false); }
  }
  return <form className="publish-form" onSubmit={submit}><h3>Publier un rapport au client</h3><p className="muted">Rédigez un résumé destiné au client. Ne copiez pas automatiquement les observations brutes, la position GPS ou des renseignements personnels sensibles.</p><label>Incident concerné<select name="incidentId" required defaultValue=""><option value="" disabled>Choisir un incident</option>{incidents.map((i) => <option key={i.id} value={i.id}>{i.category} — {new Date(i.created_at).toLocaleDateString("fr-CA")} — {i.id.slice(0, 8)}</option>)}</select></label><label>Titre du rapport<input name="title" minLength="5" maxLength="140" required /></label><label>Résumé validé<textarea name="body" minLength="40" maxLength="5000" rows="5" required /></label><label className="publish-consent"><input type="checkbox" name="reviewed" required /> <span>J’ai relu ce résumé et je confirme qu’il peut être communiqué au client.</span></label><button className="button button-primary" disabled={busy || !incidents.length} type="submit">{busy ? "Publication…" : "Publier au client ↗"}</button>{result && <p role="status">{result}</p>}</form>;
}
