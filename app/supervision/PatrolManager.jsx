"use client";
import {useEffect,useState} from "react";
import CheckpointQr from "./CheckpointQr";
const when=value=>new Date(value).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
export default function PatrolManager(){
  const [sites,setSites]=useState([]);
  const [checkpoints,setCheckpoints]=useState([]);
  const [visits,setVisits]=useState([]);
  const [newCode,setNewCode]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [feedback,setFeedback]=useState("");
  async function load(){
    const [rs,rp]=await Promise.all([
      fetch("/api/supervision/sites",{cache:"no-store"}),
      fetch("/api/supervision/patrol",{cache:"no-store"})
    ]);
    const [s,p]=await Promise.all([rs.json(),rp.json()]);
    if(!rs.ok||!rp.ok)throw Error(p.error||s.error||"Rondes indisponibles.");
    setSites(s.sites||[]);setCheckpoints(p.checkpoints||[]);setVisits(p.visits||[]);
  }
  useEffect(()=>{
    let alive=true;
    Promise.all([fetch("/api/supervision/sites",{cache:"no-store"}),fetch("/api/supervision/patrol",{cache:"no-store"})])
      .then(async ([a,b])=>{
        const [s,p]=await Promise.all([a.json(),b.json()]);
        if(!a.ok||!b.ok)throw Error(p.error||s.error||"Rondes indisponibles.");
        if(alive){setSites(s.sites||[]);setCheckpoints(p.checkpoints||[]);setVisits(p.visits||[]);}
      }).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});
    return ()=>{alive=false;};
  },[]);
  async function create(event){
    event.preventDefault();if(busy)return;
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    setBusy(true);setError("");setFeedback("");setNewCode("");
    const body=Object.fromEntries(new FormData(form).entries());
    try{
      const response=await fetch("/api/supervision/patrol",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||"Création impossible.");
      setNewCode(result.code);form.reset();await load();
      setFeedback("Point créé. Le code confidentiel n'est visible qu'ici, maintenant.");
    }catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  async function toggle(item){
    if(busy)return;
    setBusy(true);setError("");setFeedback("");setNewCode("");
    try{
      const response=await fetch("/api/supervision/patrol",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:item.id,active:!item.active})});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||"Modification indisponible.");
      await load();setFeedback("État du point de contrôle mis à jour.");
    }catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  async function rotate(item){
    if(busy||!window.confirm("L'ancien code deviendra immédiatement invalide. Générer un nouveau code ?"))return;
    setBusy(true);setError("");setFeedback("");setNewCode("");
    try{
      const response=await fetch("/api/supervision/patrol",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:item.id,action:"rotate"})});
      const result=await response.json();
      if(!response.ok)throw Error(result.error||"Rotation impossible.");
      setNewCode(result.code);
      await load();
      setFeedback("Code renouvelé. L'ancien code est maintenant invalide. Conservez ce nouveau code.");
    }catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  return <section className="assignment-panel" aria-label="Points de contrôle de ronde">
    <span className="section-kicker">RONDES DE SÉCURITÉ</span><h2>Points de contrôle</h2>
    <p className="muted">Créez un point pour un site actif. Le code confidentiel est fourni une seule fois : gardez-le hors du système et placez-le physiquement au point prévu. La connaissance du code ne prouve pas automatiquement une présence physique.</p>
    <form className="assignment-form" onSubmit={create}>
      <label>Site actif *<select name="siteId" required defaultValue=""><option value="" disabled>Choisir un site</option>{sites.filter(x=>x.active).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Nom du point *<input name="label" minLength="3" maxLength="120" required placeholder="Entrée principale" /></label>
      <button type="submit" className="button button-primary" disabled={busy||!sites.some(x=>x.active)}>{busy?"Enregistrement…":"Créer un point ↗"}</button>
    </form>
    {newCode&&<div className="patrol-code" role="status">
      <strong>Code de contrôle — affichage unique</strong><code>{newCode}</code>
      <p>Ce QR est calculé directement dans votre navigateur, sans service externe. Il contient le code confidentiel; imprimez-le uniquement pour le lieu protégé. Une photo du QR pourrait permettre un passage fictif.</p>
      <CheckpointQr code={newCode} />
      <button type="button" className="button button-outline button-small" onClick={()=>window.print()}>Imprimer le QR</button>
      <button type="button" className="button button-outline button-small" onClick={async()=>{
        try{await navigator.clipboard.writeText(newCode);setFeedback("Code copié.");}catch{setFeedback("Copie impossible : sélectionnez le code affiché.");}
      }}>Copier le code</button>
      <button type="button" className="button button-outline button-small" onClick={()=>setNewCode("")}>Masquer le code affiché</button>
    </div>}
    {feedback&&<p role="status" className="shift-message">{feedback}</p>}
    {error&&<p role="alert" className="form-error">{error}</p>}
    <div className="assignment-list">
      {checkpoints.map(item=><article key={item.id}><span className="section-kicker">{item.active?"ACTIF":"DÉSACTIVÉ"}</span><h3>{item.label}</h3><p>Site : {item.site_name}</p><button className="button button-outline button-small" type="button" disabled={busy} onClick={()=>toggle(item)}>{item.active?"Désactiver":"Réactiver"}</button> {item.active&&<button className="button button-outline button-small" type="button" disabled={busy} onClick={()=>rotate(item)}>Régénérer le code</button>}</article>)}
      {!checkpoints.length&&<p className="muted">{loading?"Chargement des points…":"Aucun point de contrôle créé."}</p>}
    </div>
    <h3>Derniers passages enregistrés</h3>
    <div className="assignment-list">
      {visits.map(item=><article key={item.id}><strong>{item.label}</strong><p>{item.site_name}</p><p>Agent TAKATAK : {item.agent_sub}</p><p>{when(item.visited_at)}</p></article>)}
      {!visits.length&&<p className="muted">Aucun passage enregistré pour votre organisation.</p>}
    </div>
  </section>;
}
