"use client";
import { useEffect,useState } from "react";
const day=timestamp=>new Date(timestamp).toISOString().slice(0,10);
const date=v=>new Date(v).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
export default function SupervisorTimesheets(){
  const [start,setStart]=useState(()=>day(Date.now()-30*86400_000));
  const [end,setEnd]=useState(()=>day(Date.now()));
  const [entries,setEntries]=useState([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [loaded,setLoaded]=useState(false);
  async function load(a=start,b=end){
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams({start:a,end:b});
      const r=await fetch("/api/supervision/timesheets?"+params,{cache:"no-store"});
      const payload=await r.json();
      if(!r.ok)throw new Error(payload.error||"Pointages indisponibles.");
      setEntries(payload.entries||[]);setLoaded(true);
    }catch(e){setError(e.message);setLoaded(false);}finally{setLoading(false);}
  }
  useEffect(()=>{load();},[]);
  async function decide(id, action) {
    if(loading||!window.confirm(action==="approve"?"Approuver ces heures enregistrées ?":"Retirer cette approbation ?"))return;
    setLoading(true);setError("");
    try {
      const response=await fetch("/api/supervision/timesheets/approval",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({shiftId:id,action,note:""})
      });
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||"Décision impossible.");
      await load();
    } catch(err) {setError(err.message);}finally{setLoading(false);}
  }
  const params=new URLSearchParams({start,end,format:"csv"});
  return <section className="assignment-panel"><span className="section-kicker">POINTAGES / RELEVÉ</span><h2>Heures enregistrées</h2>
    <p className="muted">Période par dates UTC, maximum 93 jours. Export administratif pour vérification seulement : les heures nécessitent une validation explicite et ne constituent pas une paie calculée.</p>
    <form className="assignment-form" onSubmit={e=>{e.preventDefault();load();}}>
      <label>Du (UTC)<input type="date" required value={start} onChange={e=>{setStart(e.target.value);setLoaded(false);}} /></label>
      <label>Au (UTC)<input type="date" required value={end} onChange={e=>{setEnd(e.target.value);setLoaded(false);}} /></label>
      <button className="button button-primary" type="submit" disabled={loading}>{loading?"Consultation…":"Afficher le relevé"}</button>
      {loaded&&<a className="button button-outline" href={"/api/supervision/timesheets?"+params}>Exporter le CSV ↗</a>}
    </form>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Identité agent</th><th>Début</th><th>Fin</th><th>Heures</th><th>Validation</th><th>Action</th></tr></thead><tbody>{entries.map((e,i)=><tr key={i}><td>{e.agent_sub}</td><td>{date(e.started_at)}</td><td>{date(e.stopped_at)}</td><td>{Number(e.hours).toFixed(2)} h</td><td>{e.review_status==="approved"?"Approuvé":e.review_status==="revoked"?"Révoqué":"Non vérifié"}</td><td><button type="button" className="button button-outline button-small" disabled={loading} onClick={()=>decide(e.id,e.review_status==="approved"?"revoke":"approve")}>{e.review_status==="approved"?"Retirer":"Approuver"}</button></td></tr>)}{!entries.length&&<tr><td colSpan="6">{loading?"Chargement…":"Aucun pointage terminé disponible."}</td></tr>}</tbody></table></div>
  </section>;
}
