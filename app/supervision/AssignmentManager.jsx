"use client";
import { useEffect,useState } from "react";
const displayDate=(v)=>new Date(v).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
export default function AssignmentManager(){
  const [data,setData]=useState({roster:[],assignments:[]});
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState("");
  async function read(){
    const response=await fetch("/api/supervision/assignments",{cache:"no-store"});
    const json=await response.json();
    if(!response.ok)throw new Error(json.error||"Service indisponible.");
    setData(json);
  }
  useEffect(()=>{
    let mounted=true;
    fetch("/api/supervision/assignments",{cache:"no-store"})
    .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error||"Lecture impossible.");if(mounted)setData(data);})
    .catch(error=>{if(mounted)setMessage(error.message);})
    .finally(()=>{if(mounted)setLoading(false);});
    return ()=>{mounted=false;};
  },[]);
  async function create(event) {
    event.preventDefault();
    if(working)return;
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const input=Object.fromEntries(new FormData(form));
    const start=new Date(input.startsAt),end=new Date(input.endsAt);
    if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())){setMessage("Dates invalides.");return;}
    input.startsAt=start.toISOString();input.endsAt=end.toISOString();
    setWorking(true);setMessage("");
    try {
      const response=await fetch("/api/supervision/assignments",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Création impossible.");
      form.reset();await read();setMessage("Affectation créée pour l'agent autorisé.");
    }catch(error){setMessage(error.message);}finally{setWorking(false);}
  }
  async function cancel(id){
    if(working||!window.confirm("Annuler cette affectation ?"))return;
    setWorking(true);setMessage("");
    try{
      const response=await fetch("/api/supervision/assignments",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action:"cancel"})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Annulation impossible.");
      await read();setMessage("Affectation annulée; modification enregistrée dans l'audit.");
    }catch(error){setMessage(error.message);}finally{setWorking(false);}
  }
  return <section className="assignment-panel" aria-label="Planification des agents">
    <div className="supervision-head"><div><span className="section-kicker">GESTION DES MANDATS</span><h2>Planifier les affectations</h2></div></div>
    <p className="muted">Les agents doivent s'inscrire eux-mêmes depuis leur espace TAKATAK. Les horaires se limitent à votre organisation; les chevauchements sont refusés côté serveur.</p>
    <form className="assignment-form" onSubmit={create}>
      <label>Agent inscrit *<select name="agentSub" required defaultValue=""><option value="" disabled>Sélectionner un agent</option>{data.roster.map(agent=><option key={agent.agent_sub} value={agent.agent_sub}>{agent.agent_sub}</option>)}</select></label>
      <label>Nom du mandat *<input name="title" required minLength="5" maxLength="140" placeholder="Surveillance du hall" /></label>
      <label>Site / lieu *<input name="siteLabel" required minLength="3" maxLength="180" placeholder="Établissement ou zone de travail" /></label>
      <label>Début (heure locale) *<input name="startsAt" type="datetime-local" required /></label>
      <label>Fin (heure locale) *<input name="endsAt" type="datetime-local" required /></label>
      <button type="submit" className="button button-primary" disabled={working||!data.roster.length}>{working?"Enregistrement…":"Créer l'affectation ↗"}</button>
    </form>
    {!data.roster.length&&<p className="muted">Aucun agent inscrit pour le moment. L'agent doit ouvrir son espace et choisir « M'inscrire aux affectations ».</p>}
    {message&&<p role="status" className="shift-message">{message}</p>}
    <div className="assignment-list">
      {data.assignments.map(item=><article key={item.id}><span className="section-kicker">{item.status==="cancelled"?"ANNULÉ":"PLANIFIÉ"}</span><h3>{item.title}</h3><p>Site : {item.site_label}</p><p>Agent : {item.agent_sub}</p><p>{displayDate(item.starts_at)} → {displayDate(item.ends_at)}</p>
      {item.status==="scheduled"&&<button className="button button-outline button-small" type="button" disabled={working} onClick={()=>cancel(item.id)}>Annuler l'affectation</button>}</article>)}
      {!data.assignments.length&&<p className="muted">{loading?"Chargement des affectations…":"Aucune affectation enregistrée."}</p>}
    </div>
  </section>;
}
