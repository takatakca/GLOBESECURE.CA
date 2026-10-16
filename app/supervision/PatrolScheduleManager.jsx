"use client";
import {useEffect,useState} from "react";
const labels={upcoming:"À venir",due:"À effectuer",overdue:"EN RETARD",completed:"Passage confirmé",cancelled:"Annulée",suspended:"Suspendue"};
const format=value=>new Date(value).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
export default function PatrolScheduleManager(){
  const [plans,setPlans]=useState([]);
  const [assignments,setAssignments]=useState([]);
  const [checkpoints,setCheckpoints]=useState([]);
  const [assignment,setAssignment]=useState("");
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [feedback,setFeedback]=useState("");
  async function refresh(){
    const [sp,sa,sc]=await Promise.all([
      fetch("/api/supervision/patrol/schedule",{cache:"no-store"}),
      fetch("/api/supervision/assignments",{cache:"no-store"}),
      fetch("/api/supervision/patrol",{cache:"no-store"})
    ]);
    const [p,a,c]=await Promise.all([sp.json(),sa.json(),sc.json()]);
    if(!sp.ok||!sa.ok||!sc.ok)throw Error(p.error||a.error||c.error||"Planification indisponible.");
    setPlans(p.plans||[]);
    setAssignments((a.assignments||[]).filter(x=>x.status==="scheduled"&&new Date(x.ends_at)>new Date()&&x.site_id));
    setCheckpoints((c.checkpoints||[]).filter(x=>x.active));
  }
  useEffect(()=>{
    let live=true;
    Promise.all([
      fetch("/api/supervision/patrol/schedule",{cache:"no-store"}),
      fetch("/api/supervision/assignments",{cache:"no-store"}),
      fetch("/api/supervision/patrol",{cache:"no-store"})
    ]).then(async ([sp,sa,sc])=>{
      const [p,a,c]=await Promise.all([sp.json(),sa.json(),sc.json()]);
      if(!sp.ok||!sa.ok||!sc.ok)throw Error(p.error||a.error||c.error||"Planification indisponible.");
      if(live){
        setPlans(p.plans||[]);
        setAssignments((a.assignments||[]).filter(x=>x.status==="scheduled"&&new Date(x.ends_at)>new Date()&&x.site_id));
        setCheckpoints((c.checkpoints||[]).filter(x=>x.active));
      }
    }).catch(err=>{if(live)setError(err.message);}).finally(()=>{if(live)setLoading(false);});
    return ()=>{live=false;};
  },[]);
  async function create(event){
    event.preventDefault();
    if(busy)return;
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    setBusy(true);setError("");setFeedback("");
    const data=Object.fromEntries(new FormData(form).entries());
    const at=new Date(data.dueAt);
    if(!Number.isFinite(at.getTime())){setError("Date ou heure invalide.");setBusy(false);return;}
    data.dueAt=at.toISOString();data.graceMinutes=Number(data.graceMinutes);
    try{
      const r=await fetch("/api/supervision/patrol/schedule",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const json=await r.json();
      if(!r.ok)throw Error(json.error||"Création impossible.");
      form.reset();setAssignment("");await refresh();
      setFeedback("Passage de ronde planifié et audité.");
    }catch(err){setError(err.message);}
    finally{setBusy(false);}
  }
  async function cancel(id){
    if(busy||!window.confirm("Annuler ce passage de ronde futur ?"))return;
    setBusy(true);setError("");setFeedback("");
    try{
      const r=await fetch("/api/supervision/patrol/schedule",{method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action:"cancel"})});
      const json=await r.json();
      if(!r.ok)throw Error(json.error||"Annulation impossible.");
      await refresh();setFeedback("Planification annulée; journal conservé.");
    }catch(err){setError(err.message);}
    finally{setBusy(false);}
  }
  const current=assignments.find(x=>x.id===assignment);
  const eligible=current?checkpoints.filter(x=>x.site_id===current.site_id):[];
  const pending=plans.filter(x=>x.display_status==="overdue").length;
  return <section className="assignment-panel" aria-label="Planification et suivi des rondes">
    <span className="section-kicker">PLANIFICATION / CONTRÔLES</span><h2>Rondes prévues et passages manquants</h2>
    <p className="muted">Choisissez une affectation, un point de contrôle du même site et l'échéance prévue. Un point peut être exigé une seule fois par affectation. Les passages en retard sont calculés à chaque consultation, sans prétendre qu'une alerte externe a été envoyée.</p>
    <p role="status"><strong>{pending} contrôle{pending!==1?"s":""} en retard</strong> parmi les {plans.length} planification{plans.length!==1?"s":""} actuellement affichée{plans.length!==1?"s":""}.</p>
    <form key={assignment||"none"} className="assignment-form" onSubmit={create}>
      <label>Affectation *<select name="assignmentId" required value={assignment} onChange={e=>setAssignment(e.target.value)}><option value="">Choisir le quart</option>{assignments.map(item=><option key={item.id} value={item.id}>{item.title} · {item.agent_sub} · {format(item.starts_at)}</option>)}</select></label>
      <label>Point du site *<select name="checkpointId" key={assignment} required defaultValue=""><option value="">Choisir le point</option>{eligible.map(item=><option value={item.id} key={item.id}>{item.label} · {item.site_name}</option>)}</select></label>
      <label>Passage prévu (heure locale) *<input type="datetime-local" name="dueAt" required /></label>
      <label>Tolérance après échéance (min)<input name="graceMinutes" type="number" min="5" max="120" step="1" defaultValue="15" required /></label>
      <button type="submit" className="button button-primary" disabled={busy||!eligible.length}>{busy?"Enregistrement…":"Programmer le contrôle ↗"}</button>
      <button type="button" className="button button-outline" disabled={busy} onClick={async()=>{setBusy(true);setError("");try{await refresh();setFeedback("États des contrôles actualisés.");}catch(e){setError(e.message);}finally{setBusy(false);}}}>Actualiser les états</button>
    </form>
    {error&&<p role="alert" className="form-error">{error}</p>}
    {feedback&&<p role="status" className="shift-message">{feedback}</p>}
    <div className="assignment-list">
      {plans.map(p=><article key={p.id}>
        <span className="section-kicker">{labels[p.display_status]||"À vérifier"}</span>
        <h3>{p.checkpoint_label}</h3>
        <p>Site : {p.site_name} · Agent : {p.agent_sub}</p>
        <p>Affectation : {p.assignment_title}</p>
        <p>Échéance : {format(p.due_at)} · Tolérance : {p.grace_minutes} min</p>
        {p.visit_at&&<p>Passage attesté : {format(p.visit_at)}</p>}
        {p.status==="scheduled"&&new Date(p.due_at)>new Date()&&<button type="button" className="button button-outline button-small" disabled={busy} onClick={()=>cancel(p.id)}>Annuler la planification</button>}
      </article>)}
      {!plans.length&&<p className="muted">{loading?"Chargement des rondes…":"Aucune ronde planifiée actuellement."}</p>}
    </div>
  </section>;
}
