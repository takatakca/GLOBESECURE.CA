"use client";
import {useEffect,useRef,useState} from "react";
const extractCode=value=>{
  const raw=String(value||"").trim();
  if(/^[A-Za-z0-9_-]{32}$/.test(raw))return raw;
  try {
    const url=new URL(raw);
    if(url.origin==="https://globesecure.ca" && /^[A-Za-z0-9_-]{32}$/.test(url.searchParams.get("code")||""))return url.searchParams.get("code");
  }catch{}
  return "";
};
export default function AgentPatrol(){
  const [visits,setVisits]=useState([]);
  const [code,setCode]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [scanning,setScanning]=useState(false);
  const video=useRef(null);
  const media=useRef(null);
  const frame=useRef(null);
  async function load(){
    const r=await fetch("/api/agent/patrol",{cache:"no-store"});
    const data=await r.json();
    if(!r.ok)throw Error(data.error||"Passages indisponibles.");
    setVisits(data.visits||[]);
  }
  useEffect(()=>{
    let alive=true;
    fetch("/api/agent/patrol",{cache:"no-store"}).then(async r=>{
      const data=await r.json();
      if(!r.ok)throw Error(data.error||"Passages indisponibles.");
      if(alive)setVisits(data.visits||[]);
    }).catch(e=>{if(alive)setMessage(e.message);});
    return ()=>{alive=false;};
  },[]);
  useEffect(()=>{
    if(!scanning)return;
    let alive=true;
    async function start(){
      try{
        if(!("BarcodeDetector" in window))throw Error("Ce navigateur ne prend pas en charge le lecteur QR. Entrez le code manuellement.");
        const detector=new window.BarcodeDetector({formats:["qr_code"]});
        const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
        if(!alive){stream.getTracks().forEach(x=>x.stop());return;}
        media.current=stream;
        if(video.current){video.current.srcObject=stream;await video.current.play();}
        async function tick(){
          if(!alive||!video.current)return;
          try{
            if(video.current.readyState>=2){
              const results=await detector.detect(video.current);
              const found=results.map(x=>extractCode(x.rawValue)).find(Boolean);
              if(found){setCode(found);setMessage("Code QR reconnu. Confirmez le passage.");setScanning(false);return;}
            }
          }catch{}
          if(alive)frame.current=requestAnimationFrame(tick);
        }
        frame.current=requestAnimationFrame(tick);
      }catch(e){if(alive){setMessage(e.message||"Caméra indisponible.");setScanning(false);}}
    }
    start();
    return ()=>{alive=false;if(frame.current!==null)cancelAnimationFrame(frame.current);if(media.current){media.current.getTracks().forEach(x=>x.stop());media.current=null;}};
  },[scanning]);
  async function submit(event){
    event.preventDefault();
    if(busy)return;
    const clean=extractCode(code);
    if(!clean){setMessage("Code de contrôle invalide. Saisissez les 32 caractères.");return;}
    setBusy(true);setMessage("");
    try{
      const response=await fetch("/api/agent/patrol",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:clean})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"Passage non enregistré.");
      setCode("");await load();setMessage("Passage enregistré : "+data.visit.label+".");
    }catch(e){setMessage(e.message);}
    finally{setBusy(false);}
  }
  return <section className="assignment-panel" aria-label="Passage de ronde">
    <span className="section-kicker">RONDES / PASSAGES</span><h2>Enregistrer un contrôle</h2>
    <p className="muted">Vous devez avoir un quart actif et une affectation au site du point de contrôle. Le code représente une attestation numérique de lecture, pas une preuve absolue de présence. Aucune photo ni position GPS supplémentaire n'est prise par ce formulaire.</p>
    <form onSubmit={submit} className="assignment-form">
      <label>Code du point de contrôle *<input name="code" value={code} onChange={e=>setCode(e.target.value)} minLength="32" maxLength="250" autoComplete="off" spellCheck={false} required placeholder="Code de contrôle ou QR" /></label>
      <button type="submit" className="button button-primary" disabled={busy}>{busy?"Vérification…":"Enregistrer mon passage ↗"}</button>
    </form>
    <div className="shift-buttons">
      <button type="button" className="button button-outline button-small" disabled={busy} onClick={()=>setScanning(x=>!x)}>{scanning?"Arrêter la caméra":"Scanner un code QR (si disponible)"}</button>
    </div>
    {scanning&&<video ref={video} className="patrol-camera" muted playsInline aria-label="Visée caméra pour code QR" />}
    {message&&<p role="status" className="shift-message">{message}</p>}
    <h3>Mes derniers passages</h3>
    <div className="assignment-list">
      {visits.map(item=><article key={item.id}><span className="section-kicker">ENREGISTRÉ</span><h3>{item.label}</h3><p>{item.site_name} · {new Date(item.visited_at).toLocaleString("fr-CA")}</p></article>)}
      {!visits.length&&<p className="muted">Aucun passage enregistré pour votre compte.</p>}
    </div>
  </section>;
}
