-- PostgreSQL 13+; apply once after backing up the database.
-- Tenant and agent IDs originate from TAKATAK Auth; never from browser payloads.
CREATE TABLE IF NOT EXISTS gs_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  agent_sub text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  stopped_at timestamptz,
  consent_version text NOT NULL,
  consented_at timestamptz NOT NULL,
  CHECK (stopped_at IS NULL OR stopped_at >= started_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS gs_one_active_shift ON gs_shifts (tenant_id, agent_sub) WHERE stopped_at IS NULL;
CREATE INDEX IF NOT EXISTS gs_shifts_by_tenant ON gs_shifts (tenant_id, started_at DESC);
CREATE TABLE IF NOT EXISTS gs_positions (
  id bigserial PRIMARY KEY,
  shift_id uuid NOT NULL REFERENCES gs_shifts(id) ON DELETE CASCADE,
  tenant_id text NOT NULL,
  latitude double precision NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  accuracy_m double precision NOT NULL CHECK (accuracy_m BETWEEN 0 AND 10000),
  event_type text NOT NULL CHECK (event_type IN ('start','heartbeat','stop')),
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gs_positions_by_shift_time ON gs_positions (shift_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS gs_positions_expiry ON gs_positions (recorded_at);
CREATE TABLE IF NOT EXISTS gs_audit (
  id bigserial PRIMARY KEY,
  shift_id uuid REFERENCES gs_shifts(id) ON DELETE SET NULL,
  tenant_id text NOT NULL,
  actor_sub text NOT NULL,
  action text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gs_audit_tenant_at ON gs_audit (tenant_id, at DESC);
-- Run on a trusted server-side scheduler after defining retention policy:
-- DELETE FROM gs_positions WHERE recorded_at < now() - interval '30 days';
-- Set database privileges to application-only; do not expose public SQL endpoints.
