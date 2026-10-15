import {parseAssignment,validAssignmentId} from "./assignments.mjs";
export function parseReschedule(input,now=Date.now()) {
  if(!input || !validAssignmentId(input.assignmentId))return null;
  const schedule=parseAssignment(input,now);
  return schedule ? {...schedule,assignmentId:input.assignmentId} : null;
}
