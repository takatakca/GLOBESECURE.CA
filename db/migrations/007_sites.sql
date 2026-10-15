-- Tenant-owned operational sites; does not create a cross-tenant CRM or customer authority.
CREATE TABLE IF NOT EXISTS gs_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 140),
  city text NOT NULL DEFAULT '' CHECK (char_length(city) <= 120),
  active boolean NOT NULL DEFAULT true,
  created_by_sub text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by_sub text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS gs_sites_unique_name ON gs_sites(tenant_id, lower(name));
CREATE INDEX IF NOT EXISTS gs_sites_tenant_active ON gs_sites(tenant_id,active,name);
ALTER TABLE gs_assignments ADD COLUMN IF NOT EXISTS site_id uuid;
-- Historical assignments retain their original site_label. New linked assignments
-- retain a snapshot of the site name, even when a site is deactivated later.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gs_assignments_site_tenant_fk') THEN
    ALTER TABLE gs_assignments ADD CONSTRAINT gs_assignments_site_tenant_fk
      FOREIGN KEY (tenant_id,site_id) REFERENCES gs_sites(tenant_id,id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS gs_assignments_tenant_site ON gs_assignments(tenant_id,site_id);
