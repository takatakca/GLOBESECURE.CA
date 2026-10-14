export const CONSENT_VERSION = "2026-10-14";
export function positionInput(raw) {
  if (!raw || typeof raw !== "object") return null;
  const lat = raw.latitude, lng = raw.longitude, accuracy = raw.accuracy;
  if (![lat, lng, accuracy].every((value) => typeof value === "number" && Number.isFinite(value))) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || accuracy < 0 || accuracy > 10000) return null;
  return { latitude: lat, longitude: lng, accuracy };
}
export function startInput(payload) {
  return !!(payload && payload.action === "start" && payload.consent === true && payload.consentVersion === CONSENT_VERSION && positionInput(payload.position));
}
export function stopInput(payload) {
  return !!(payload && payload.action === "stop" && (!payload.position || positionInput(payload.position)));
}
