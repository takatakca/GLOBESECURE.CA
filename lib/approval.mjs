const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parseApproval(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  if (typeof input.shiftId !== "string" || !uuid.test(input.shiftId)) return null;
  if (!["approve","revoke"].includes(input.action)) return null;
  const note=typeof input.note === "string" ? input.note.trim() : "";
  if(note.length>500)return null;
  return {shiftId:input.shiftId,action:input.action,note,status:input.action==="approve"?"approved":"revoked"};
}
