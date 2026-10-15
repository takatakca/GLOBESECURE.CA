-- Approval decisions are distinct from raw clock-in records.
-- Restrict approval to the same tenant at the database relationship level.
CREATE UNIQUE INDEX IF NOT EXISTS gs_shift_tenant_id_unique ON gs_shifts(tenant_id,id);
CREATE TABLE IF NOT EXISTS gs_shift_approvals (
  tenant_id text NOT NULL,
  shift_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('approved','revoked')),
  reviewer_sub text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id,shift_id),
  FOREIGN KEY (tenant_id,shift_id) REFERENCES gs_shifts(tenant_id,id)
);
CREATE TABLE IF NOT EXISTS gs_shift_approval_events (
  id bigserial PRIMARY KEY,
  tenant_id text NOT NULL,
  shift_id uuid NOT NULL,
  reviewer_sub text NOT NULL,
  action text NOT NULL CHECK (action IN ('approve','revoke')),
  note text NOT NULL DEFAULT '' CHECK (char_length(note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id,shift_id) REFERENCES gs_shifts(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS gs_shift_approval_events_tenant ON gs_shift_approval_events(tenant_id,shift_id,created_at DESC);
