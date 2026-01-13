-- Create system_jobs table
CREATE TABLE IF NOT EXISTS system_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(255) NOT NULL,
  job_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  schedule_type VARCHAR(50),
  cron_expression VARCHAR(100),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  last_run_duration INTEGER,
  last_run_status VARCHAR(50),
  last_run_error TEXT,
  run_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_system_jobs_status ON system_jobs(status);
CREATE INDEX IF NOT EXISTS idx_system_jobs_type ON system_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_system_jobs_active ON system_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_system_jobs_next_run ON system_jobs(next_run_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_jobs_updated_at
  BEFORE UPDATE ON system_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert demo data
INSERT INTO system_jobs (job_name, job_type, description, status, priority, schedule_type, cron_expression, last_run_at, next_run_at, last_run_duration, last_run_status, run_count, success_count, failure_count, is_active, created_by) VALUES
('Backup Database', 'backup', 'Thực hiện sao lưu toàn bộ cơ sở dữ liệu', 'running', 'high', 'scheduled', '0 2 * * *', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '22 hours', 180, 'success', 45, 44, 1, true, 'system'),
('Clean Temp Files', 'cleanup', 'Xóa các file tạm thời cũ hơn 7 ngày', 'completed', 'normal', 'scheduled', '0 3 * * 0', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 45, 'success', 12, 12, 0, true, 'system'),
('Generate Reports', 'report', 'Tạo báo cáo tổng hợp hàng tháng', 'pending', 'normal', 'scheduled', '0 0 1 * *', NOW() - INTERVAL '25 days', NOW() + INTERVAL '5 days', 120, 'success', 3, 3, 0, true, 'admin'),
('Sync User Data', 'sync', 'Đồng bộ dữ liệu người dùng từ hệ thống khác', 'failed', 'high', 'scheduled', '*/15 * * * *', NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '5 minutes', 30, 'failed', 1440, 1420, 20, true, 'system'),
('Send Email Notifications', 'notification', 'Gửi thông báo email cho người dùng', 'running', 'high', 'scheduled', '*/5 * * * *', NOW() - INTERVAL '3 minutes', NOW() + INTERVAL '2 minutes', 15, 'success', 2880, 2850, 30, true, 'system'),
('Archive Old Data', 'archive', 'Lưu trữ dữ liệu cũ hơn 1 năm', 'completed', 'low', 'scheduled', '0 4 1 * *', NOW() - INTERVAL '15 days', NOW() + INTERVAL '15 days', 300, 'success', 6, 6, 0, true, 'admin'),
('Health Check', 'monitoring', 'Kiểm tra sức khỏe các dịch vụ hệ thống', 'running', 'critical', 'scheduled', '*/1 * * * *', NOW() - INTERVAL '30 seconds', NOW() + INTERVAL '30 seconds', 5, 'success', 43200, 43150, 50, true, 'system'),
('Update Search Index', 'indexing', 'Cập nhật chỉ mục tìm kiếm', 'pending', 'normal', 'scheduled', '0 */6 * * *', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '3 hours', 90, 'success', 120, 118, 2, true, 'system'),
('Process Payment Queue', 'payment', 'Xử lý hàng đợi thanh toán', 'paused', 'high', 'scheduled', '*/10 * * * *', NOW() - INTERVAL '2 hours', NULL, 20, 'success', 144, 142, 2, false, 'admin'),
('Generate Invoices', 'billing', 'Tạo hóa đơn tự động cho khách hàng', 'completed', 'high', 'scheduled', '0 0 * * *', NOW() - INTERVAL '5 hours', NOW() + INTERVAL '19 hours', 240, 'success', 30, 30, 0, true, 'system'),
('Security Scan', 'security', 'Quét bảo mật hệ thống', 'running', 'critical', 'scheduled', '0 1 * * *', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '23.5 hours', 180, 'success', 90, 89, 1, true, 'security-team'),
('Cache Warmup', 'optimization', 'Làm nóng cache cho hiệu suất tốt hơn', 'completed', 'normal', 'manual', NULL, NOW() - INTERVAL '1 hour', NULL, 60, 'success', 5, 5, 0, true, 'admin'),
('Log Rotation', 'maintenance', 'Xoay vòng và nén file log', 'pending', 'low', 'scheduled', '0 0 * * 0', NOW() - INTERVAL '6 days', NOW() + INTERVAL '1 day', 30, 'success', 52, 52, 0, true, 'system'),
('Data Validation', 'validation', 'Kiểm tra tính toàn vẹn dữ liệu', 'failed', 'normal', 'scheduled', '0 6 * * *', NOW() - INTERVAL '6 hours', NOW() + INTERVAL '18 hours', 150, 'failed', 180, 175, 5, true, 'system'),
('API Rate Limit Reset', 'api', 'Reset bộ đếm giới hạn tốc độ API', 'running', 'normal', 'scheduled', '0 * * * *', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '45 minutes', 2, 'success', 720, 720, 0, true, 'system');

-- Grant permissions (if using RLS)
ALTER TABLE system_jobs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read system_jobs"
  ON system_jobs FOR SELECT
  TO authenticated
  USING (true);

-- Policy for service role to do everything
CREATE POLICY "Allow service role full access to system_jobs"
  ON system_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
