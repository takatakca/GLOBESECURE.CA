-- Append-only history of supervisor schedule changes.
-- Existing assignment and cancellation records are retained unchanged.
CREATE UNIQUE INDEX IF NOT EXISTS gs_assignments_tenant_id_unique ON gs_assignments(tenant_id,id);
CREATE TABLE IF NOT EXISTS gs_assignment_changes (
  id bigserial PRIMARY KEY,
  tenant_id text NOT NULL,
  assignment_id uuid NOT NULL,
  actor_sub text NOT NULL,
  previous_values jsonb NOT NULL,
  current_values jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id,assignment_id) REFERENCES gs_assignments(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS gs_assignment_changes_by_tenant ON gs_assignment_changes(tenant_id,assignment_id,changed_at DESC);
