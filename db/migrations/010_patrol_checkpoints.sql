-- Confidential physical checkpoint credentials. Never store the plaintext marker.
CREATE TABLE IF NOT EXISTS gs_patrol_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  site_id uuid NOT NULL,
  label text NOT NULL CHECK(char_length(label) BETWEEN 3 AND 120),
  code_digest text NOT NULL CHECK(code_digest ~ '^[a-f0-9]{64}$'),
  active boolean NOT NULL DEFAULT true,
  created_by_sub text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,id),
  UNIQUE(code_digest),
  FOREIGN KEY(tenant_id,site_id) REFERENCES gs_sites(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS gs_patrol_checkpoints_site ON gs_patrol_checkpoints(tenant_id,site_id,active);
CREATE TABLE IF NOT EXISTS gs_patrol_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  checkpoint_id uuid NOT NULL,
  shift_id uuid NOT NULL,
  agent_sub text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,shift_id,checkpoint_id),
  FOREIGN KEY(tenant_id,checkpoint_id) REFERENCES gs_patrol_checkpoints(tenant_id,id),
  FOREIGN KEY(tenant_id,shift_id) REFERENCES gs_shifts(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS gs_patrol_visits_by_tenant ON gs_patrol_visits(tenant_id,visited_at DESC);
-- Proof of knowledge of a static code is NOT cryptographic proof of physical presence.
