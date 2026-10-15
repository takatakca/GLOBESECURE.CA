import { randomBytes,createHash } from "node:crypto";
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const markerPattern=/^[A-Za-z0-9_-]{32}$/;
export function issueCheckpointCode(){return randomBytes(24).toString("base64url");}
export function checkpointDigest(code){
  if(typeof code!=="string" || !markerPattern.test(code))return null;
  return createHash("sha256").update(code).digest("hex");
}
export function parseCheckpoint(input){
  if(!input||typeof input!=="object"||Array.isArray(input))return null;
  const label=typeof input.label==="string"?input.label.trim():"";
  const siteId=typeof input.siteId==="string"?input.siteId:"";
  if(label.length<3||label.length>120||/[\r\n\t]/.test(label)||!idPattern.test(siteId))return null;
  return {label,siteId};
}
export function parseCheckpointToggle(input){
  if(!input||!idPattern.test(input.id)||typeof input.active!=="boolean")return null;
  return {id:input.id,active:input.active};
}
export function parseVisit(input){
  if(!input||typeof input!=="object"||Array.isArray(input))return null;
  const code=typeof input.code==="string"?input.code.trim():"";
  const digest=checkpointDigest(code);
  return digest?{digest}:null;
}
