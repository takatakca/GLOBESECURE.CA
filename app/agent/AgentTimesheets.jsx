"use client";
import { useEffect,useState } from "react";
const date=v=>new Date(v).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
export default function AgentTimesheets(){
  const [entries,setEntries]=useState([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    fetch("/api/agent/timesheets",{cache:"no-store"}).then(async r=>{
      const data=await r.json();if(!r.ok)throw new Error(data.error||"Historique indisponible.");
      if(active)setEntries(data.entries||[]);
    }).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);
  return <section className="assignment-panel"><span className="section-kicker">HISTORIQUE DE POINTAGE</span><h2>Mes heures enregistrées</h2>
    <p className="muted">Historique des quarts terminés des 30 derniers jours. Ces durées proviennent du pointage et ne constituent pas des heures de paie validées.</p>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Début</th><th>Fin</th><th>Heures enregistrées</th></tr></thead><tbody>{entries.map(e=><tr key={e.id}><td>{date(e.started_at)}</td><td>{date(e.stopped_at)}</td><td>{Number(e.hours).toFixed(2)} h</td></tr>)}{!entries.length&&<tr><td colSpan="3">{loading?"Chargement…":"Aucun quart terminé dans cette période."}</td></tr>}</tbody></table></div>
  </section>;
}
