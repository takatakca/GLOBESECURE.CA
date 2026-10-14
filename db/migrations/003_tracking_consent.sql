ALTER TABLE gs_shifts ADD COLUMN IF NOT EXISTS tracking_revoked_at timestamptz;
CREATE INDEX IF NOT EXISTS gs_shifts_tracking_consent ON gs_shifts (tenant_id, agent_sub, tracking_revoked_at) WHERE stopped_at IS NULL;
