-- Apply after 001_init.sql. Client publication will require an explicit workflow.
CREATE TABLE IF NOT EXISTS gs_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id uuid NOT NULL REFERENCES gs_shifts(id),
  tenant_id text NOT NULL,
  agent_sub text NOT NULL,
  category text NOT NULL CHECK (category IN ('access','safety','property','medical','other')),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 20 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gs_incidents_by_tenant ON gs_incidents (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gs_incidents_by_agent ON gs_incidents (tenant_id, agent_sub, created_at DESC);
