const isoDay=/^\d{4}-\d{2}-\d{2}$/;
export function timesheetPeriod(start, end, now=Date.now()) {
  const today=new Date(now).toISOString().slice(0,10);
  const endText=end || today;
  const startText=start || new Date(now-30*86400_000).toISOString().slice(0,10);
  if(!isoDay.test(startText)||!isoDay.test(endText))return null;
  const first=new Date(startText+"T00:00:00Z");
  const last=new Date(endText+"T00:00:00Z");
  if(!Number.isFinite(first.getTime())||!Number.isFinite(last.getTime()))return null;
  if(first.toISOString().slice(0,10)!==startText||last.toISOString().slice(0,10)!==endText)return null;
  if(last<first||last.getTime()-first.getTime()>92*86400_000||last.getTime()>now+86400_000)return null;
  return {start:first.toISOString(),until:new Date(last.getTime()+86400_000).toISOString(),startDay:startText,endDay:endText};
}
export function csvCell(value) {
  let s=value==null?"":String(value);
  // Guard spreadsheet formula injection even after whitespace.
  if(/^[\s\u0000-\u001f]*[=+@-]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
export function exportTimesheets(rows) {
  const columns=["agent_sub","started_at","stopped_at","hours"];
  return "\uFEFF"+[columns.join(","),...rows.map(item=>columns.map(key=>csvCell(item[key])).join(","))].join("\r\n")+"\r\n";
}
