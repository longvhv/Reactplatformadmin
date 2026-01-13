-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(255) UNIQUE NOT NULL,
  flag_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  environment VARCHAR(50) DEFAULT 'production',
  flag_type VARCHAR(50) NOT NULL DEFAULT 'boolean',
  target_audience VARCHAR(100),
  percentage_rollout INTEGER DEFAULT 0,
  conditions JSONB,
  metadata JSONB,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_type ON feature_flags(flag_type);

-- Create updated_at trigger
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled, environment, flag_type, target_audience, percentage_rollout, created_by, enabled_at) VALUES
('new_dashboard_ui', 'New Dashboard UI', 'Giao diện dashboard mới với biểu đồ tương tác', true, 'production', 'boolean', 'all', 100, 'admin', NOW() - INTERVAL '10 days'),
('dark_mode', 'Dark Mode', 'Chế độ giao diện tối cho ứng dụng', true, 'production', 'boolean', 'all', 100, 'admin', NOW() - INTERVAL '30 days'),
('advanced_analytics', 'Advanced Analytics', 'Phân tích nâng cao với AI/ML insights', false, 'staging', 'boolean', 'premium', 0, 'admin', NULL),
('two_factor_auth', 'Two-Factor Authentication', 'Xác thực hai yếu tố cho bảo mật nâng cao', true, 'production', 'boolean', 'all', 100, 'security-team', NOW() - INTERVAL '60 days'),
('export_pdf', 'PDF Export', 'Xuất báo cáo dạng PDF', true, 'production', 'feature', 'business', 100, 'admin', NOW() - INTERVAL '15 days'),
('beta_features', 'Beta Features Access', 'Truy cập các tính năng thử nghiệm', false, 'beta', 'boolean', 'beta-testers', 30, 'product-team', NULL),
('mobile_app_v2', 'Mobile App V2', 'Phiên bản 2 của ứng dụng di động', false, 'development', 'release', 'internal', 10, 'mobile-team', NULL),
('real_time_notifications', 'Real-time Notifications', 'Thông báo thời gian thực qua WebSocket', true, 'production', 'feature', 'all', 100, 'backend-team', NOW() - INTERVAL '5 days'),
('advanced_search', 'Advanced Search', 'Tìm kiếm nâng cao với filters phức tạp', true, 'production', 'feature', 'all', 100, 'admin', NOW() - INTERVAL '20 days'),
('api_v3', 'API Version 3', 'REST API phiên bản 3 với GraphQL', false, 'staging', 'release', 'developers', 25, 'api-team', NULL),
('collaborative_editing', 'Collaborative Editing', 'Chỉnh sửa đồng thời nhiều người dùng', false, 'development', 'feature', 'enterprise', 0, 'product-team', NULL),
('ai_assistant', 'AI Assistant', 'Trợ lý AI hỗ trợ người dùng', false, 'beta', 'feature', 'premium', 5, 'ai-team', NULL),
('custom_themes', 'Custom Themes', 'Tùy chỉnh giao diện theo sở thích', true, 'production', 'feature', 'premium', 100, 'design-team', NOW() - INTERVAL '45 days'),
('offline_mode', 'Offline Mode', 'Làm việc offline và đồng bộ khi online', false, 'development', 'feature', 'mobile', 0, 'mobile-team', NULL),
('sso_integration', 'SSO Integration', 'Đăng nhập một lần với SAML/OAuth', true, 'production', 'feature', 'enterprise', 100, 'security-team', NOW() - INTERVAL '90 days'),
('data_export', 'Data Export', 'Xuất dữ liệu hàng loạt (CSV, Excel)', true, 'production', 'feature', 'business', 100, 'admin', NOW() - INTERVAL '25 days'),
('webhook_support', 'Webhook Support', 'Hỗ trợ webhooks cho tích hợp bên thứ 3', true, 'production', 'feature', 'developers', 100, 'api-team', NOW() - INTERVAL '40 days'),
('audit_logs', 'Audit Logs', 'Nhật ký kiểm toán chi tiết hoạt động', true, 'production', 'feature', 'enterprise', 100, 'security-team', NOW() - INTERVAL '50 days'),
('multi_language', 'Multi-language Support', 'Hỗ trợ đa ngôn ngữ (i18n)', true, 'production', 'feature', 'all', 100, 'i18n-team', NOW() - INTERVAL '70 days'),
('performance_mode', 'Performance Mode', 'Chế độ hiệu suất cao cho thiết bị yếu', false, 'staging', 'feature', 'all', 50, 'optimization-team', NULL);

-- Grant permissions (if using RLS)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read feature_flags"
  ON feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Policy for service role to do everything
CREATE POLICY "Allow service role full access to feature_flags"
  ON feature_flags FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
