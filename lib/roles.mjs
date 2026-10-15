// Product roles are deliberately exact: a supervisor or platform admin must
// not implicitly impersonate an agent to create shifts or capture GPS data.
export function hasRole(session, role) {
  return typeof role === "string" && Array.isArray(session?.roles) && session.roles.includes(role);
}
