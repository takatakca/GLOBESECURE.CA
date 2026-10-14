export function retentionDays(value) {
  if (typeof value !== "string" || !/^[0-9]{1,3}$/.test(value)) return null;
  const days = Number(value);
  return Number.isInteger(days) && days >= 1 && days <= 365 ? days : null;
}
