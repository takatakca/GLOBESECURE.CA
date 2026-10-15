const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validSiteId(id) {
  return typeof id === "string" && ID.test(id);
}
export function parseSite(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const name=typeof input.name==="string"?input.name.trim():"";
  const city=typeof input.city==="string"?input.city.trim():"";
  if(name.length<3||name.length>140||city.length>120) return null;
  if(/[\r\n\t]/.test(name)||/[\r\n\t]/.test(city)) return null;
  return {name,city};
}
export function parseSiteChange(input) {
  if (!input || !validSiteId(input.id) || input.action!=="setActive" || typeof input.active!=="boolean") return null;
  return {id:input.id,active:input.active};
}
