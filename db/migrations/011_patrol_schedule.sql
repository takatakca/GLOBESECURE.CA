-- One expected checkpoint visit per assignment (current scan contract: one per checkpoint/shift).
-- Future recurring route patterns can be modeled by distinct assignments.
CREATE TABLE IF NOT EXISTS gs_patrol_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  assignment_id uuid NOT NULL,
  checkpoint_id uuid NOT NULL,
  due_at timestamptz NOT NULL,
  grace_minutes integer NOT NULL DEFAULT 15 CHECK (grace_minutes BETWEEN 5 AND 120),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','cancelled')),
  created_by_sub text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_by_sub text,
  cancelled_at timestamptz,
  UNIQUE(tenant_id,id),
  UNIQUE(tenant_id,assignment_id,checkpoint_id),
  FOREIGN KEY (tenant_id,assignment_id) REFERENCES gs_assignments(tenant_id,id),
  FOREIGN KEY (tenant_id,checkpoint_id) REFERENCES gs_patrol_checkpoints(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS gs_patrol_schedule_due ON gs_patrol_schedule(tenant_id,status,due_at);
CREATE TABLE IF NOT EXISTS gs_patrol_schedule_events (
  id bigserial PRIMARY KEY,
  tenant_id text NOT NULL,
  schedule_id uuid NOT NULL,
  actor_sub text NOT NULL,
  action text NOT NULL CHECK(action IN ('create','cancel')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(tenant_id,schedule_id) REFERENCES gs_patrol_schedule(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS gs_patrol_schedule_events_lookup ON gs_patrol_schedule_events(tenant_id,schedule_id,created_at DESC);
