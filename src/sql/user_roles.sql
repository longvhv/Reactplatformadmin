-- ============================================
-- USER ROLES TABLE
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS user_roles CASCADE;

-- Create user_roles table
CREATE TABLE user_roles (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(_id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(_id) ON DELETE CASCADE,
  scope VARCHAR(50) NOT NULL DEFAULT 'global', -- 'global', 'tenant', 'department', 'location', etc.
  scope_id UUID, -- ID of the scope (tenant_id, department_id, location_id, etc.)
  granted_by UUID REFERENCES users(_id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique user-role-scope combination
  UNIQUE(user_id, role_id, scope, scope_id)
);

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_scope ON user_roles(scope);
CREATE INDEX idx_user_roles_scope_id ON user_roles(scope_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON user_roles FOR ALL 
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- ============================================
-- DEMO DATA
-- ============================================

DO $$
DECLARE
  user_record RECORD;
  role_record RECORD;
  tenant_record RECORD;
  admin_user_id UUID;
  scope_type VARCHAR(50);
  assignment_count INTEGER;
  expires_chance FLOAT;
BEGIN
  -- Get first admin user to use as granted_by
  SELECT _id INTO admin_user_id 
  FROM users 
  WHERE email LIKE '%admin%' 
  LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    SELECT _id INTO admin_user_id FROM users LIMIT 1;
  END IF;
  
  RAISE NOTICE 'Using admin user: %', admin_user_id;
  
  assignment_count := 0;
  
  -- Loop through first 15 users
  FOR user_record IN 
    SELECT u._id as user_id, u.email, ut.tenant_id
    FROM users u
    LEFT JOIN tenant_members ut ON ut.user_id = u._id
    ORDER BY u.created_at 
    LIMIT 15
  LOOP
    -- Assign 1-4 roles per user
    FOR i IN 1..(1 + floor(random() * 4)::int) LOOP
      -- Pick random role
      SELECT _id INTO role_record 
      FROM roles 
      ORDER BY random() 
      LIMIT 1;
      
      IF role_record IS NULL THEN
        CONTINUE;
      END IF;
      
      -- Random scope type
      IF random() < 0.4 THEN
        scope_type := 'global';
      ELSIF random() < 0.6 THEN
        scope_type := 'tenant';
      ELSIF random() < 0.8 THEN
        scope_type := 'department';
      ELSE
        scope_type := 'location';
      END IF;
      
      -- Random expires_at (20% chance)
      expires_chance := random();
      
      BEGIN
        INSERT INTO user_roles (
          user_id,
          role_id,
          tenant_id,
          scope,
          scope_id,
          granted_by,
          granted_at,
          expires_at,
          is_active,
          metadata
        ) VALUES (
          user_record.user_id,
          role_record._id,
          user_record.tenant_id,
          scope_type,
          CASE 
            WHEN scope_type = 'tenant' THEN user_record.tenant_id
            WHEN scope_type = 'global' THEN NULL
            ELSE NULL -- For demo, department/location scope_id would come from their tables
          END,
          admin_user_id,
          NOW() - (random() * 30)::int * INTERVAL '1 day',
          CASE 
            WHEN expires_chance < 0.2 THEN NOW() + (30 + random() * 335)::int * INTERVAL '1 day'
            ELSE NULL
          END,
          random() > 0.1, -- 90% active
          jsonb_build_object(
            'note', CASE 
              WHEN random() < 0.3 THEN 'Assigned during onboarding'
              WHEN random() < 0.5 THEN 'Temporary assignment'
              ELSE 'Standard role assignment'
            END,
            'auto_assigned', random() < 0.3
          )
        );
        
        assignment_count := assignment_count + 1;
        
      EXCEPTION WHEN unique_violation THEN
        -- Skip duplicate combinations
        CONTINUE;
      END;
    END LOOP;
    
    RAISE NOTICE 'Assigned roles to user: %', user_record.email;
  END LOOP;
  
  RAISE NOTICE 'Created % user role assignments', assignment_count;
END $$;

-- Summary by scope
SELECT 
  scope,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_active = true) as active,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as with_expiry
FROM user_roles
GROUP BY scope
ORDER BY count DESC;

-- Summary by role
SELECT 
  r.name,
  COUNT(ur._id) as assignments,
  COUNT(DISTINCT ur.user_id) as unique_users
FROM roles r
LEFT JOIN user_roles ur ON ur.role_id = r._id
GROUP BY r._id, r.name
ORDER BY assignments DESC;

-- User role assignments
SELECT 
  u.email,
  COUNT(ur._id) as total_roles,
  COUNT(ur._id) FILTER (WHERE ur.is_active = true) as active_roles,
  COUNT(ur._id) FILTER (WHERE ur.scope = 'global') as global_roles,
  COUNT(ur._id) FILTER (WHERE ur.scope = 'tenant') as tenant_roles
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u._id
GROUP BY u._id, u.email
ORDER BY total_roles DESC
LIMIT 15;

-- Verify
SELECT 
  COUNT(*) as total_assignments,
  COUNT(DISTINCT user_id) as users_with_roles,
  COUNT(DISTINCT role_id) as roles_used,
  COUNT(*) FILTER (WHERE is_active = true) as active_assignments,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL) as expiring_assignments
FROM user_roles;