"use client";
import { useState } from "react";
export default function CareerForm({ enabled = false }) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSending(true); setFeedback("");
    const fields = Object.fromEntries(new FormData(form).entries());
    fields.consent = fields.consent === "on";
    try {
      const response = await fetch("/api/careers", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(fields) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Transmission indisponible.");
      form.reset();
      setFeedback("Votre message a été transmis à GlobeSecure.");
    } catch(error) { setFeedback(error.message || "Transmission indisponible."); }
    finally { setSending(false); }
  }
  if (!enabled) return <div className="quote-form quote-unavailable" role="status"><h3>Le recrutement en ligne se prépare</h3><p>La réception des messages de recrutement doit encore être configurée et la politique de confidentialité approuvée. Aucun CV ni renseignement personnel n'est collecté ici actuellement.</p></div>;
  return <form className="quote-form career-form" onSubmit={submit}>
    <h3>Contacter notre recrutement</h3><p>Un message de présentation, sans document joint. Ne transmettez aucune information confidentielle.</p>
    <label>Nom complet *<input name="name" required maxLength="100" autoComplete="name" /></label>
    <label>Courriel *<input name="email" type="email" required maxLength="254" autoComplete="email" /></label>
    <label>Ville<input name="city" maxLength="120" autoComplete="address-level2" /></label>
    <label>Domaine d'intérêt *<select name="interest" required defaultValue=""><option value="" disabled>Choisir un domaine</option><option value="agent">Agent de sécurité</option><option value="supervision">Supervision</option><option value="operations">Opérations</option><option value="other">Autre</option></select></label>
    <label>Présentation *<textarea name="message" rows="5" minLength="20" maxLength="2000" required /></label>
    <div className="honeypot" aria-hidden="true"><label>Site web<input name="website" tabIndex="-1" autoComplete="off" /></label></div>
    <label className="consent"><input type="checkbox" name="consent" required /><span>J'autorise GlobeSecure à utiliser ces renseignements uniquement pour répondre à ma demande. *</span></label>
    <button type="submit" disabled={sending} className="button button-primary">{sending ? "Transmission…" : "Envoyer ma présentation ↗"}</button>
    {feedback && <p role="status">{feedback}</p>}
  </form>;
}
