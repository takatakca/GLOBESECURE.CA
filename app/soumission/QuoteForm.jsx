"use client";
import { useState } from "react";
const SERVICE_OPTIONS = [
  ["", "Sélectionner un service"],
  ["evenementiel", "Événementiel"],
  ["sante", "Établissement de santé"],
  ["entreprises", "Entreprise ou commerce"],
  ["chantiers", "Chantier / construction"],
  ["autre", "Autre mandat"]
];
export default function QuoteForm({ enabled = false }) {
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setStatus("sending");
    setFeedback("");
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.consent = payload.consent === "on";
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Envoi indisponible pour le moment.");
      form.reset();
      setStatus("sent");
      setFeedback("Votre demande a été transmise. Merci de votre confiance.");
    } catch (error) {
      setStatus("error");
      setFeedback(error.message || "Envoi impossible. Réessayez plus tard.");
    }
  }
  if (!enabled) return <div className="quote-form quote-unavailable" role="status"><h3>Demandes en ligne temporairement indisponibles</h3><p>Le service de réception des soumissions est en cours de configuration. Aucun renseignement ne peut être transmis par ce formulaire actuellement.</p></div>;
  return <form className="quote-form" onSubmit={submit}><h3>Décrivez votre besoin</h3><p>Champs obligatoires marqués d’un *</p><div className="form-grid"><label>Nom complet *<input name="name" maxLength="100" autoComplete="name" required /></label><label>Adresse courriel *<input name="email" type="email" maxLength="254" autoComplete="email" required /></label><label>Organisation<input name="organization" maxLength="120" autoComplete="organization" /></label><label>Téléphone<input name="phone" type="tel" maxLength="35" autoComplete="tel" /></label><label className="span-2">Type de mandat *<select name="service" required>{SERVICE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="span-2">Votre demande *<textarea name="message" minLength="15" maxLength="3000" rows="5" required placeholder="Type de lieu, période approximative et nature générale du besoin. Aucune information confidentielle."/></label></div><div className="honeypot" aria-hidden="true"><label>Site Web<input name="website" tabIndex="-1" autoComplete="off" /></label></div><label className="consent"><input type="checkbox" name="consent" required /> <span>J’accepte que GlobeSecure utilise ces renseignements pour me répondre. *</span></label><button className="button button-primary form-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "Transmission…" : "Transmettre la demande ↗"}</button>{feedback && <p role="status" className={status === "sent" ? "form-success" : "form-error"}>{feedback}</p>}</form>;
}
