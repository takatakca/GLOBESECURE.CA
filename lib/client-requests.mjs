const services=new Set(["evenementiel","sante","entreprises","chantiers","commerces","alarmes","autre"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateClientRequest(input){
  if(!input || typeof input!=="object" || Array.isArray(input))return null;
  const service=typeof input.service==="string"?input.service:"";
  const title=typeof input.title==="string"?input.title.trim():"";
  const description=typeof input.description==="string"?input.description.trim():"";
  if(!services.has(service)||title.length<5||title.length>140||description.length<30||description.length>3000)return null;
  if(input.consent!==true)return null;
  return {service,title,description};
}
export function validateRequestDecision(input){
  if(!input || typeof input!=="object" || Array.isArray(input))return null;
  if(typeof input.id!=="string" || !uuid.test(input.id) || !["acknowledge","close"].includes(input.action))return null;
  const note=typeof input.note==="string"?input.note.trim():"";
  if(note.length>500)return null;
  return {id:input.id,action:input.action,note,
    from:input.action==="acknowledge"?"submitted":"acknowledged",
    status:input.action==="acknowledge"?"acknowledged":"closed"};
}
