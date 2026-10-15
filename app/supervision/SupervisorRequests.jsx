"use client";
import {useEffect,useState} from "react";
const status={submitted:"À prendre en charge",acknowledged:"En traitement",closed:"Clôturée"};
export default function SupervisorRequests(){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [working,setWorking]=useState(false);
  const [error,setError]=useState("");
  async function reload(){
    const response=await fetch("/api/supervision/requests",{cache:"no-store"});
    const body=await response.json();
    if(!response.ok)throw Error(body.error||"Demandes indisponibles.");
    setItems(body.requests||[]);
  }
  useEffect(()=>{
    let live=true;
    fetch("/api/supervision/requests",{cache:"no-store"}).then(async response=>{
      const body=await response.json();
      if(!response.ok)throw Error(body.error||"Demandes indisponibles.");
      if(live)setItems(body.requests||[]);
    }).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setLoading(false);});
    return ()=>{live=false;};
  },[]);
  async function transition(id,action){
    if(working)return;
    setWorking(true);setError("");
    try {
      const response=await fetch("/api/supervision/requests",{
        method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id,action})
      });
      const body=await response.json();
      if(!response.ok)throw Error(body.error||"Décision impossible.");
      await reload();
    }catch(e){setError(e.message);}
    finally{setWorking(false);}
  }
  return <section className="assignment-panel" aria-label="Traitement des demandes clients">
    <span className="section-kicker">SUIVI DES CLIENTS</span><h2>Demandes de service reçues</h2>
    <p className="muted">Ces messages ne doivent pas contenir de codes d'accès ni de plans sensibles. Le superviseur traite uniquement les demandes de son organisation.</p>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <div className="assignment-list">
      {items.map(item=><article key={item.id}><span className="section-kicker">{status[item.status]||item.status}</span><h3>{item.title}</h3><p>Service : {item.service}</p><p>Demandeur TAKATAK : {item.author_sub}</p><p>{item.description}</p>
        {item.status==="submitted"&&<button type="button" className="button button-outline button-small" disabled={working} onClick={()=>transition(item.id,"acknowledge")}>Prendre en charge</button>}
        {item.status==="acknowledged"&&<button type="button" className="button button-outline button-small" disabled={working} onClick={()=>transition(item.id,"close")}>Clôturer</button>}
      </article>)}
      {!items.length&&<p className="muted">{loading?"Chargement…":"Aucune demande client reçue."}</p>}
    </div>
  </section>;
}
