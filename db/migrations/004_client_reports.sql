-- Reports are deliberately different from internal incident logs and GPS positions.
-- Only manually reviewed/published text is readable by clients of the same tenant.
CREATE TABLE IF NOT EXISTS gs_client_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  incident_id uuid NOT NULL REFERENCES gs_incidents(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 140),
  body text NOT NULL CHECK (char_length(body) BETWEEN 40 AND 5000),
  reviewer_sub text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, incident_id)
);
CREATE INDEX IF NOT EXISTS gs_client_reports_tenant ON gs_client_reports(tenant_id, published_at DESC);
