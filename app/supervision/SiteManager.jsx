"use client";
import {useEffect,useState} from "react";
export default function SiteManager({onChanged}){
  const [sites,setSites]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function reload(){
    const response=await fetch("/api/supervision/sites",{cache:"no-store"});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||"Sites indisponibles.");
    setSites(data.sites||[]);
  }
  useEffect(()=>{
    let active=true;
    fetch("/api/supervision/sites",{cache:"no-store"}).then(async response=>{
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"Sites indisponibles.");
      if(active)setSites(data.sites||[]);
    }).catch(e=>{if(active)setMessage(e.message);}).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[]);
  async function send(method,body,form){
    if(busy)return;
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/supervision/sites",{
        method,credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
      });
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"Modification impossible.");
      if(form)form.reset();
      await reload();
      if(onChanged)await onChanged();
      setMessage(method==="POST"?"Site enregistré.":"État du site mis à jour.");
    }catch(error){setMessage(error.message);}
    finally{setBusy(false);}
  }
  function create(event){
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    send("POST",Object.fromEntries(new FormData(form).entries()),form);
  }
  return <section className="assignment-panel" aria-label="Gestion des sites">
    <div className="supervision-head"><div><span className="section-kicker">GESTION DES SITES</span><h2>Lieux sécurisés</h2></div></div>
    <p className="muted">Sites de votre organisation uniquement. L'adresse précise et les procédures sensibles ne sont pas collectées dans ce module.</p>
    <form className="assignment-form" onSubmit={create}>
      <label>Nom du site *<input name="name" required minLength="3" maxLength="140" placeholder="Édifice, événement ou lieu" /></label>
      <label>Ville (facultatif)<input name="city" maxLength="120" placeholder="Montréal" /></label>
      <button type="submit" className="button button-primary" disabled={busy}>{busy?"Enregistrement…":"Ajouter le site ↗"}</button>
    </form>
    {message&&<p role="status" className="shift-message">{message}</p>}
    <div className="assignment-list">
      {sites.map(site=><article key={site.id}><span className="section-kicker">{site.active?"ACTIF":"INACTIF"}</span><h3>{site.name}</h3>{site.city&&<p>{site.city}</p>}
        <button type="button" className="button button-outline button-small" disabled={busy} onClick={()=>send("PATCH",{id:site.id,action:"setActive",active:!site.active})}>{site.active?"Désactiver":"Réactiver"}</button>
      </article>)}
      {!sites.length&&<p className="muted">{loading?"Chargement des sites…":"Aucun site enregistré dans votre organisation."}</p>}
    </div>
  </section>;
}
