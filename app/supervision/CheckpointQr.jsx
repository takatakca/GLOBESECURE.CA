"use client";
import {useMemo} from "react";
import qrFactory from "../../vendor/qrcode-generator.mjs";

/** Fully offline rendering: the code never leaves the browser or reaches a QR service. */
export default function CheckpointQr({code}){
  const grid=useMemo(()=>{
    if(typeof code!=="string"||!/^[A-Za-z0-9_-]{32}$/.test(code))return null;
    try{
      const qr=qrFactory(0,"M");
      qr.addData(code);
      qr.make();
      const count=qr.getModuleCount(),cells=[];
      for(let y=0;y<count;y++)for(let x=0;x<count;x++)if(qr.isDark(y,x))cells.push([x,y]);
      return {count,cells};
    }catch{return null;}
  },[code]);
  if(!grid)return <p role="alert">Impossible de dessiner le code QR. Le code texte reste disponible.</p>;
  const size=grid.count+8;
  return <svg role="img" aria-label="QR confidentiel du point de contrôle" viewBox={`-4 -4 ${size} ${size}`} width="260" height="260" shapeRendering="crispEdges" style={{display:"block",margin:"12px auto",background:"#fff",maxWidth:"100%"}}>
    <rect x={-4} y={-4} width={size} height={size} fill="#fff" />
    {grid.cells.map(([x,y])=><rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000" />)}
  </svg>;
}
