"use client";
import { useEffect,useState } from "react";
const when = (value) => new Date(value).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
export default function AgentAssignments() {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [enrolled,setEnrolled]=useState(false);
  async function load() {
    const response=await fetch("/api/agent/assignments",{cache:"no-store"});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"Affectations indisponibles.");
    setItems(result.assignments||[]);
  }
  useEffect(()=>{
    let mounted=true;
    fetch("/api/agent/assignments",{cache:"no-store"}).then(async response=>{
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Affectations indisponibles.");
      if(mounted)setItems(result.assignments||[]);
    }).catch(error=>{if(mounted)setMessage(error.message);}).finally(()=>{if(mounted)setLoading(false);});
    return ()=>{mounted=false;};
  },[]);
  async function enroll() {
    if(busy)return;
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/agent/roster",{method:"POST",credentials:"same-origin"});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Inscription impossible.");
      setEnrolled(true);
      await load();
      setMessage("Vous êtes inscrit à la liste d'affectation de votre organisation.");
    } catch(error){setMessage(error.message);}
    finally{setBusy(false);}
  }
  return <div className="assignment-panel">
    <div className="supervision-head"><div><span className="section-kicker">COORDINATION</span><h2>Mes affectations</h2></div><button className="button button-outline button-small" type="button" disabled={busy} onClick={enroll}>{busy?"Enregistrement…":enrolled?"Inscription actualisée":"M'inscrire aux affectations"}</button></div>
    <p className="muted">Votre identité TAKATAK sert à rejoindre la liste de votre organisation. Seul un superviseur autorisé peut créer ou annuler une affectation.</p>
    {message&&<p role="status" className="shift-message">{message}</p>}
    <div className="assignment-list">
      {items.map(item=><article key={item.id}><span className="section-kicker">{item.status==="cancelled"?"ANNULÉ":"PLANIFIÉ"}</span><h3>{item.title}</h3><p>{item.site_label}</p><p>{when(item.starts_at)} → {when(item.ends_at)}</p></article>)}
      {!items.length&&<p className="muted">{loading?"Chargement des affectations…":"Aucune affectation disponible actuellement."}</p>}
    </div>
  </div>;
}
