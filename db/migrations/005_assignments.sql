-- Apply after 004_client_reports.sql. All identities are TAKATAK Auth subjects.
-- Roster is an opt-in product membership, NOT a competing identity directory.
CREATE TABLE IF NOT EXISTS gs_agent_roster (
  tenant_id text NOT NULL,
  agent_sub text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,agent_sub)
);
CREATE TABLE IF NOT EXISTS gs_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  agent_sub text NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 140),
  site_label text NOT NULL CHECK (char_length(site_label) BETWEEN 3 AND 180),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled')),
  created_by_sub text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_by_sub text,
  cancelled_at timestamptz,
  CHECK (ends_at > starts_at),
  CHECK (ends_at - starts_at <= interval '16 hours'),
  FOREIGN KEY (tenant_id,agent_sub) REFERENCES gs_agent_roster(tenant_id,agent_sub)
);
CREATE INDEX IF NOT EXISTS gs_assignments_by_tenant_start ON gs_assignments(tenant_id,starts_at DESC);
CREATE INDEX IF NOT EXISTS gs_assignments_by_agent_start ON gs_assignments(tenant_id,agent_sub,starts_at DESC);
-- Existing tables and audits remain untouched. Each API query MUST include tenant_id.
