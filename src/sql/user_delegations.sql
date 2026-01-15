-- ============================================
-- USER DELEGATIONS TABLE
-- Quản lý việc ủy quyền giữa các users
-- Theo chuẩn docs/Database.md
-- ============================================

-- Drop table if exists
DROP TABLE IF EXISTS user_delegations CASCADE;

-- Create user_delegations table
CREATE TABLE user_delegations (
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Delegation parties
  delegator_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES users(_id) ON DELETE CASCADE,
  
  -- Scope
  tenant_id UUID REFERENCES tenants(_id) ON DELETE CASCADE, -- Optional: delegation trong tenant cụ thể
  scope VARCHAR(100), -- admin, manager, viewer, approver, etc.
  permissions JSONB DEFAULT '[]', -- Array of specific permissions
  
  -- Delegation details
  reason TEXT,
  notes TEXT,
  
  -- Time range
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- NULL = vô thời hạn
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  
  -- Activation/Revocation tracking
  activated_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(_id),
  revoked_reason TEXT,
  
  -- Auto expire
  auto_expire BOOLEAN DEFAULT TRUE,
  notified_before_expiry BOOLEAN DEFAULT FALSE,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (delegator_id != delegate_id), -- Không thể tự ủy quyền cho mình
  CHECK (status IN ('pending', 'active', 'expired', 'revoked', 'suspended')),
  CHECK (scope IN ('admin', 'manager', 'editor', 'viewer', 'approver', 'reviewer', 'auditor', 'custom')),
  CHECK (end_date IS NULL OR end_date > start_date)
);

-- Indexes for performance
CREATE INDEX idx_user_delegations_delegator_id ON user_delegations(delegator_id);
CREATE INDEX idx_user_delegations_delegate_id ON user_delegations(delegate_id);
CREATE INDEX idx_user_delegations_tenant_id ON user_delegations(tenant_id);
CREATE INDEX idx_user_delegations_status ON user_delegations(status);
CREATE INDEX idx_user_delegations_start_date ON user_delegations(start_date);
CREATE INDEX idx_user_delegations_end_date ON user_delegations(end_date);
CREATE INDEX idx_user_delegations_scope ON user_delegations(scope);

-- Composite indexes
CREATE INDEX idx_user_delegations_delegator_status ON user_delegations(delegator_id, status);
CREATE INDEX idx_user_delegations_delegate_status ON user_delegations(delegate_id, status);
CREATE INDEX idx_user_delegations_tenant_status ON user_delegations(tenant_id, status) WHERE tenant_id IS NOT NULL;

-- Enable RLS
ALTER TABLE user_delegations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable all access for authenticated users" 
  ON user_delegations FOR ALL 
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_delegations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_delegations_updated_at
  BEFORE UPDATE ON user_delegations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_delegations_updated_at();

-- Trigger to auto-expire delegations
CREATE OR REPLACE FUNCTION check_delegation_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL 
     AND NEW.end_date <= NOW() 
     AND NEW.status = 'active' 
     AND NEW.auto_expire = true THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delegation_expiry_check
  BEFORE INSERT OR UPDATE ON user_delegations
  FOR EACH ROW
  EXECUTE FUNCTION check_delegation_expiry();

-- ============================================
-- DEMO DATA
-- ============================================

DO $$
DECLARE
  user_ids UUID[];
  tenant_ids UUID[];
  delegation_count INTEGER;
  delegator_id UUID;
  delegate_id UUID;
  tenant_id UUID;
  i INTEGER;
  scope_types VARCHAR[] := ARRAY['admin', 'manager', 'editor', 'viewer', 'approver', 'reviewer', 'auditor'];
  status_types VARCHAR[] := ARRAY['active', 'pending', 'expired', 'revoked'];
BEGIN
  -- Get real user IDs
  SELECT ARRAY(SELECT _id FROM users LIMIT 20) INTO user_ids;
  
  -- Get real tenant IDs
  SELECT ARRAY(SELECT _id FROM tenants LIMIT 10) INTO tenant_ids;
  
  IF array_length(user_ids, 1) IS NULL OR array_length(user_ids, 1) < 2 THEN
    RAISE NOTICE 'Not enough users. Skipping demo data.';
    RETURN;
  END IF;
  
  IF array_length(tenant_ids, 1) IS NULL THEN
    RAISE NOTICE 'No tenants found. Creating delegations without tenant scope.';
  END IF;
  
  RAISE NOTICE 'Creating user delegations for % users', array_length(user_ids, 1);
  
  delegation_count := 0;
  
  -- Create random delegations
  FOR i IN 1..50 LOOP
    -- Random delegator and delegate (different)
    delegator_id := user_ids[1 + floor(random() * array_length(user_ids, 1))];
    delegate_id := user_ids[1 + floor(random() * array_length(user_ids, 1))];
    
    -- Skip if same user
    IF delegator_id = delegate_id THEN
      CONTINUE;
    END IF;
    
    -- 70% have tenant scope
    IF array_length(tenant_ids, 1) > 0 AND random() < 0.7 THEN
      tenant_id := tenant_ids[1 + floor(random() * array_length(tenant_ids, 1))];
    ELSE
      tenant_id := NULL;
    END IF;
    
    BEGIN
      INSERT INTO user_delegations (
        delegator_id,
        delegate_id,
        tenant_id,
        scope,
        permissions,
        reason,
        notes,
        start_date,
        end_date,
        status,
        activated_at,
        auto_expire,
        notified_before_expiry,
        metadata
      ) VALUES (
        delegator_id,
        delegate_id,
        tenant_id,
        scope_types[1 + floor(random() * array_length(scope_types, 1))],
        -- Random permissions
        jsonb_build_array(
          CASE floor(random() * 5)
            WHEN 0 THEN 'read'
            WHEN 1 THEN 'write'
            WHEN 2 THEN 'delete'
            WHEN 3 THEN 'approve'
            ELSE 'manage'
          END,
          CASE floor(random() * 5)
            WHEN 0 THEN 'users'
            WHEN 1 THEN 'documents'
            WHEN 2 THEN 'settings'
            WHEN 3 THEN 'reports'
            ELSE 'billing'
          END
        ),
        -- Reason
        CASE floor(random() * 5)
          WHEN 0 THEN 'Nghỉ phép'
          WHEN 1 THEN 'Công tác'
          WHEN 2 THEN 'Hỗ trợ dự án'
          WHEN 3 THEN 'Chuyển giao công việc'
          ELSE 'Đào tạo nhân viên mới'
        END,
        -- Notes
        CASE floor(random() * 3)
          WHEN 0 THEN 'Cần theo dõi chặt chẽ'
          WHEN 1 THEN 'Ủy quyền tạm thời'
          ELSE 'Liên hệ qua email nếu cần'
        END,
        -- Start date: từ 3 tháng trước đến 1 tháng sau
        NOW() - (random() * INTERVAL '90 days') + (random() * INTERVAL '30 days'),
        -- End date: 60% có end_date
        CASE 
          WHEN random() < 0.6 THEN 
            NOW() + (random() * INTERVAL '180 days')
          ELSE NULL
        END,
        -- Status distribution: 60% active, 20% pending, 10% expired, 10% revoked
        CASE 
          WHEN random() < 0.6 THEN 'active'
          WHEN random() < 0.8 THEN 'pending'
          WHEN random() < 0.9 THEN 'expired'
          ELSE 'revoked'
        END,
        -- Activated at (if active)
        CASE 
          WHEN random() < 0.6 THEN NOW() - (random() * INTERVAL '60 days')
          ELSE NULL
        END,
        -- Auto expire
        random() < 0.8,
        -- Notified
        random() < 0.3,
        -- Metadata
        jsonb_build_object(
          'priority', CASE floor(random() * 3)
            WHEN 0 THEN 'high'
            WHEN 1 THEN 'medium'
            ELSE 'low'
          END,
          'category', CASE floor(random() * 4)
            WHEN 0 THEN 'temporary'
            WHEN 1 THEN 'permanent'
            WHEN 2 THEN 'project-based'
            ELSE 'training'
          END,
          'requires_approval', random() < 0.3
        )
      );
      
      delegation_count := delegation_count + 1;
      
    EXCEPTION
      WHEN others THEN
        -- Skip if any error
        NULL;
    END;
  END LOOP;
  
  -- Update some revoked delegations
  UPDATE user_delegations 
  SET 
    revoked_at = NOW() - (random() * INTERVAL '30 days'),
    revoked_reason = CASE floor(random() * 4)
      WHEN 0 THEN 'No longer needed'
      WHEN 1 THEN 'Security concern'
      WHEN 2 THEN 'Project completed'
      ELSE 'User request'
    END
  WHERE status = 'revoked';
  
  RAISE NOTICE 'Created % user delegations', delegation_count;
END $$;

-- ============================================
-- STATISTICS & VERIFICATION
-- ============================================

-- Summary by status
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_delegations
GROUP BY status
ORDER BY count DESC;

-- Summary by scope
SELECT 
  scope,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM user_delegations
GROUP BY scope
ORDER BY count DESC;

-- Top delegators
SELECT 
  u.email as delegator_email,
  u.full_name as delegator_name,
  COUNT(ud._id) as total_delegations,
  COUNT(*) FILTER (WHERE ud.status = 'active') as active_delegations,
  COUNT(*) FILTER (WHERE ud.status = 'expired') as expired_delegations
FROM user_delegations ud
JOIN users u ON u._id = ud.delegator_id
GROUP BY u._id, u.email, u.full_name
ORDER BY total_delegations DESC
LIMIT 10;

-- Top delegates
SELECT 
  u.email as delegate_email,
  u.full_name as delegate_name,
  COUNT(ud._id) as total_delegations,
  COUNT(*) FILTER (WHERE ud.status = 'active') as active_delegations,
  COUNT(*) FILTER (WHERE ud.status = 'pending') as pending_delegations
FROM user_delegations ud
JOIN users u ON u._id = ud.delegate_id
GROUP BY u._id, u.email, u.full_name
ORDER BY total_delegations DESC
LIMIT 10;

-- Delegations by tenant
SELECT 
  t.name as tenant_name,
  COUNT(ud._id) as total_delegations,
  COUNT(*) FILTER (WHERE ud.status = 'active') as active_delegations
FROM user_delegations ud
JOIN tenants t ON t._id = ud.tenant_id
GROUP BY t._id, t.name
ORDER BY total_delegations DESC
LIMIT 10;

-- Expiring soon (next 30 days)
SELECT 
  COUNT(*) as expiring_soon_count
FROM user_delegations
WHERE status = 'active'
  AND end_date IS NOT NULL
  AND end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days';

-- Recent delegations
SELECT 
  d.email as delegator,
  g.email as delegate,
  t.name as tenant,
  ud.scope,
  ud.status,
  ud.start_date,
  ud.end_date,
  ud.reason
FROM user_delegations ud
JOIN users d ON d._id = ud.delegator_id
JOIN users g ON g._id = ud.delegate_id
LEFT JOIN tenants t ON t._id = ud.tenant_id
ORDER BY ud.created_at DESC
LIMIT 20;

-- Verify
SELECT 
  COUNT(*) as total_delegations,
  COUNT(DISTINCT delegator_id) as unique_delegators,
  COUNT(DISTINCT delegate_id) as unique_delegates,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,
  COUNT(*) FILTER (WHERE status = 'revoked') as revoked,
  COUNT(*) FILTER (WHERE end_date IS NOT NULL) as with_end_date,
  COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as with_tenant_scope
FROM user_delegations;
