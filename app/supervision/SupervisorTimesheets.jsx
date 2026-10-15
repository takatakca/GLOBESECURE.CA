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
  const params=new URLSearchParams({start,end,format:"csv"});
  return <section className="assignment-panel"><span className="section-kicker">POINTAGES / RELEVÉ</span><h2>Heures enregistrées</h2>
    <p className="muted">Période par dates UTC, maximum 93 jours. Export administratif pour vérification seulement : ce ne sont pas des heures approuvées pour la paie.</p>
    <form className="assignment-form" onSubmit={e=>{e.preventDefault();load();}}>
      <label>Du (UTC)<input type="date" required value={start} onChange={e=>setStart(e.target.value)} /></label>
      <label>Au (UTC)<input type="date" required value={end} onChange={e=>setEnd(e.target.value)} /></label>
      <button className="button button-primary" type="submit" disabled={loading}>{loading?"Consultation…":"Afficher le relevé"}</button>
      {loaded&&<a className="button button-outline" href={"/api/supervision/timesheets?"+params}>Exporter le CSV ↗</a>}
    </form>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Identité agent</th><th>Début</th><th>Fin</th><th>Heures</th></tr></thead><tbody>{entries.map((e,i)=><tr key={i}><td>{e.agent_sub}</td><td>{date(e.started_at)}</td><td>{date(e.stopped_at)}</td><td>{Number(e.hours).toFixed(2)} h</td></tr>)}{!entries.length&&<tr><td colSpan="4">{loading?"Chargement…":"Aucun pointage terminé disponible."}</td></tr>}</tbody></table></div>
  </section>;
}
