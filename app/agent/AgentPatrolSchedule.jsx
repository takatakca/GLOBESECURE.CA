"use client";
import {useEffect,useState} from "react";
const status={upcoming:"À venir",due:"À effectuer",overdue:"EN RETARD",completed:"Passage enregistré",suspended:"Suspendue"};
const format=value=>new Date(value).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
export default function AgentPatrolSchedule(){
  const [plans,setPlans]=useState([]);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState("");
  async function reload(){
    setBusy(true);setError("");
    try{
      const r=await fetch("/api/agent/patrol/schedule",{cache:"no-store"});
      const json=await r.json();
      if(!r.ok)throw Error(json.error||"Programme indisponible.");
      setPlans(json.plans||[]);
    }catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  useEffect(()=>{
    let active=true;
    fetch("/api/agent/patrol/schedule",{cache:"no-store"}).then(async r=>{
      const result=await r.json();
      if(!r.ok)throw Error(result.error||"Programme indisponible.");
      if(active)setPlans(result.plans||[]);
    }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setBusy(false);});
    return ()=>{active=false;};
  },[]);
  return <section className="assignment-panel" aria-label="Programme des rondes">
    <div className="supervision-head"><div><span className="section-kicker">RONDES PLANIFIÉES</span><h2>Mes contrôles attendus</h2></div>
    <button type="button" className="button button-outline button-small" disabled={busy} onClick={reload}>{busy?"Actualisation…":"Actualiser"}</button></div>
    <p className="muted">Ces échéances concernent uniquement vos affectations. Un code lu avant ou après la fenêtre de contrôle ne confirme pas automatiquement ce passage planifié.</p>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <div className="assignment-list">
      {plans.map(p=><article key={p.id}><span className="section-kicker">{status[p.display_status]||p.display_status}</span><h3>{p.checkpoint_label}</h3><p>{p.site_name} · {p.assignment_title}</p><p>Prévu : {format(p.due_at)} (+{p.grace_minutes} min)</p>{p.visit_at&&<p>Passage : {format(p.visit_at)}</p>}</article>)}
      {!plans.length&&<p className="muted">{busy?"Chargement…":"Aucun contrôle prévu dans vos affectations récentes."}</p>}
    </div>
  </section>;
}
