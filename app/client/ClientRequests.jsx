"use client";
import {useEffect,useState} from "react";
const opts=[["evenementiel","Événementiel"],["sante","Santé"],["entreprises","Entreprise"],["chantiers","Chantiers"],["commerces","Commerces"],["alarmes","Alarmes"],["autre","Autre service"]];
const label=s=>({submitted:"Reçue",acknowledged:"En traitement",closed:"Clôturée"}[s]||s);
export default function ClientRequests({enabled=false}){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState("");
  async function reload(){
    const response=await fetch("/api/client/requests",{cache:"no-store"});
    const payload=await response.json();
    if(!response.ok)throw Error(payload.error||"Demandes indisponibles.");
    setItems(payload.requests||[]);
  }
  useEffect(()=>{
    let active=true;
    fetch("/api/client/requests",{cache:"no-store"}).then(async r=>{
      const payload=await r.json();
      if(!r.ok)throw Error(payload.error||"Demandes indisponibles.");
      if(active)setItems(payload.requests||[]);
    }).catch(e=>{if(active)setMessage(e.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);
  async function create(event){
    event.preventDefault();
    if(working)return;
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    setWorking(true);setMessage("");
    const data=Object.fromEntries(new FormData(form).entries());
    data.consent=data.consent==="on";
    try {
      const response=await fetch("/api/client/requests",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const payload=await response.json();
      if(!response.ok)throw Error(payload.error||"Demande indisponible.");
      form.reset();await reload();setMessage("Demande envoyée à la supervision de votre organisation.");
    }catch(error){setMessage(error.message);}
    finally{setWorking(false);}
  }
  return <section className="assignment-panel" aria-label="Demandes de service">
    <span className="section-kicker">DEMANDES CLIENTS</span><h2>Mes demandes de sécurité</h2>
    <p className="muted">Vos demandes sont accessibles uniquement depuis votre compte. N'indiquez jamais de mots de passe, de codes d'alarme, de plans sensibles ni de renseignements médicaux.</p>
    {enabled?<form className="assignment-form" onSubmit={create}>
      <label>Service *<select name="service" required defaultValue=""><option value="" disabled>Choisir un service</option>{opts.map(([value,name])=><option value={value} key={value}>{name}</option>)}</select></label>
      <label>Objet *<input name="title" required minLength="5" maxLength="140" placeholder="Demande de sécurité ponctuelle" /></label>
      <label className="span-2">Description *<textarea name="description" minLength="30" maxLength="3000" rows="5" required placeholder="Décrivez les grandes lignes du service souhaité sans détail sensible." /></label>
      <label className="consent span-2"><input name="consent" type="checkbox" required /><span>J'autorise GlobeSecure à traiter ces informations pour répondre à cette demande. *</span></label>
      <button type="submit" className="button button-primary" disabled={working}>{working?"Envoi…":"Transmettre la demande ↗"}</button>
    </form>:<p className="muted" role="status">La réception des nouvelles demandes est désactivée jusqu'à validation de la politique de confidentialité.</p>}
    {message&&<p role="status" className="shift-message">{message}</p>}
    <div className="assignment-list">
      {items.map(item=><article key={item.id}><span className="section-kicker">{label(item.status)}</span><h3>{item.title}</h3><p>{item.service} · {new Date(item.created_at).toLocaleDateString("fr-CA")}</p><p>{item.description}</p></article>)}
      {!items.length&&<p className="muted">{loading?"Chargement…":"Aucune demande enregistrée dans votre compte."}</p>}
    </div>
  </section>;
}
