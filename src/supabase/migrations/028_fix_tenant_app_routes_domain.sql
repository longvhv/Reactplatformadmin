-- Fix tenant_app_routes domain column to be nullable
-- Rationale: Route scope 'ALL_MY_DOMAINS' and 'INHERITED' do not require a specific domain

-- 1. Make domain nullable
ALTER TABLE public.tenant_app_routes ALTER COLUMN domain DROP NOT NULL;

-- 2. Update constraints to handle NULL values correctly
DO $$
BEGIN
  -- Drop existing domain format constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_route_domain_format') THEN
    ALTER TABLE public.tenant_app_routes DROP CONSTRAINT chk_route_domain_format;
  END IF;
END $$;

-- Add updated constraint that explicitly allows NULL
ALTER TABLE public.tenant_app_routes
ADD CONSTRAINT chk_route_domain_format 
CHECK (domain IS NULL OR (domain)::text ~ '^[a-z0-9.-]+$'::text);

-- 3. Add comment
COMMENT ON COLUMN public.tenant_app_routes.domain IS 'Domain name (e.g. app.example.com). Nullable for wildcard/inherited scopes.';
