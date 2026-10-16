const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const iso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
export function parsePatrolSchedule(body,now=Date.now()){
  if(!body||typeof body!=="object"||Array.isArray(body))return null;
  if(typeof body.assignmentId!=="string"||!uuid.test(body.assignmentId)||typeof body.checkpointId!=="string"||!uuid.test(body.checkpointId))return null;
  if(typeof body.dueAt!=="string"||!iso.test(body.dueAt))return null;
  const time=Date.parse(body.dueAt);
  if(!Number.isFinite(time)||time<now-5*60_000||time>now+120*86400_000)return null;
  if(body.dueAt.endsWith("Z")&&new Date(time).toISOString().slice(0,16)!==body.dueAt.slice(0,16))return null;
  const grace=body.graceMinutes===undefined?15:body.graceMinutes;
  if(!Number.isInteger(grace)||grace<5||grace>120)return null;
  return {assignmentId:body.assignmentId,checkpointId:body.checkpointId,dueAt:new Date(time).toISOString(),graceMinutes:grace};
}
export function parsePatrolCancellation(body){
  if(!body||typeof body!=="object"||Array.isArray(body)||body.action!=="cancel"||typeof body.id!=="string"||!uuid.test(body.id))return null;
  return {id:body.id};
}
export function patrolDueStatus({status,assignment_status,checkpoint_active,site_active,visit_at,due_at,grace_minutes},now=Date.now()){
  if(status==="cancelled"||assignment_status==="cancelled")return "cancelled";
  if(visit_at)return "completed";
  if(checkpoint_active===false||site_active===false)return "suspended";
  const due=Date.parse(due_at);
  if(!Number.isFinite(due))return "unknown";
  if(now>due+grace_minutes*60_000)return "overdue";
  return now>=due-10*60_000?"due":"upcoming";
}
// Queries remain tenant-qualified. Visits count ONLY if attributable to the assigned
// agent's shift and inside this specific deadline window, after plan creation.
export const patrolScheduleFrom= `
FROM gs_patrol_schedule p
JOIN gs_assignments a ON a.tenant_id=p.tenant_id AND a.id=p.assignment_id
JOIN gs_patrol_checkpoints c ON c.tenant_id=p.tenant_id AND c.id=p.checkpoint_id
JOIN gs_sites s ON s.tenant_id=c.tenant_id AND s.id=c.site_id
LEFT JOIN LATERAL (
  SELECT v.visited_at
  FROM gs_patrol_visits v
  JOIN gs_shifts sh ON sh.tenant_id=v.tenant_id AND sh.id=v.shift_id
  WHERE v.tenant_id=p.tenant_id AND v.checkpoint_id=p.checkpoint_id
    AND sh.agent_sub=a.agent_sub
    AND v.visited_at>=p.created_at
    AND v.visited_at>=a.starts_at-interval '10 minutes'
    AND v.visited_at<a.ends_at
    AND v.visited_at>=p.due_at-interval '10 minutes'
    AND v.visited_at<=p.due_at+(p.grace_minutes*interval '1 minute')
  ORDER BY v.visited_at ASC LIMIT 1
) hit ON true
`;
export const patrolScheduleSelect=`
SELECT p.id,p.assignment_id,p.checkpoint_id,p.due_at,p.grace_minutes,p.status,p.created_at,
       a.agent_sub,a.title AS assignment_title,a.starts_at,a.ends_at,a.status AS assignment_status,
       c.label AS checkpoint_label,c.active AS checkpoint_active,
       s.name AS site_name,s.active AS site_active,hit.visited_at AS visit_at
`;
