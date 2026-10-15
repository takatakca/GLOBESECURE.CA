-- Requests are operational records within a TAKATAK-provided tenant.
-- They do NOT replace the central TAKATAK customer authority.
CREATE TABLE IF NOT EXISTS gs_client_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  author_sub text NOT NULL,
  service text NOT NULL CHECK (service IN ('evenementiel','sante','entreprises','chantiers','commerces','alarmes','autre')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 140),
  description text NOT NULL CHECK (char_length(description) BETWEEN 30 AND 3000),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','acknowledged','closed')),
  reviewer_sub text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id,id)
);
CREATE INDEX IF NOT EXISTS gs_client_requests_by_client ON gs_client_requests(tenant_id,author_sub,created_at DESC);
CREATE INDEX IF NOT EXISTS gs_client_requests_by_tenant ON gs_client_requests(tenant_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS gs_client_request_events (
  id bigserial PRIMARY KEY,
  tenant_id text NOT NULL,
  request_id uuid NOT NULL,
  actor_sub text NOT NULL,
  action text NOT NULL CHECK (action IN ('acknowledge','close')),
  internal_note text NOT NULL DEFAULT '' CHECK(char_length(internal_note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id,request_id) REFERENCES gs_client_requests(tenant_id,id)
);
CREATE INDEX IF NOT EXISTS gs_client_request_events_tenant ON gs_client_request_events(tenant_id,request_id,created_at);
