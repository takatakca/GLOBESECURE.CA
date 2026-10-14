"use client";
import { useState } from "react";
export default function IncidentForm() {
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setBusy(true); setFeedback("");
    try {
      const response = await fetch("/api/agent/incidents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Échec de l'enregistrement.");
      form.reset();
      setFeedback("Rapport enregistré dans le journal de votre organisation.");
    } catch (e) { setFeedback(e.message); }
    finally { setBusy(false); }
  }
  return <form className="incident-form" onSubmit={submit}><h3>Signaler un incident</h3><p className="muted">Rapport interne. Ne renseignez aucun dossier médical, numéro de pièce d'identité ni information sensible sur une personne.</p><label>Type d'incident<select name="category" required><option value="access">Accès</option><option value="safety">Sécurité</option><option value="property">Biens</option><option value="medical">Situation nécessitant une assistance</option><option value="other">Autre</option></select></label><label>Compte rendu<textarea name="summary" rows="4" minLength="20" maxLength="4000" required placeholder="Décrivez les faits observables, sans détails personnels inutiles." /></label><button className="button button-outline" disabled={busy} type="submit">{busy ? "Enregistrement…" : "Enregistrer le rapport ↗"}</button>{feedback && <p role="status">{feedback}</p>}</form>;
}
