-- ============================================
-- Notification Templates Table Migration
-- Purpose: Store reusable notification templates
-- Created: 2026-01-13
-- ============================================

CREATE TABLE IF NOT EXISTS notification_templates (
  -- Primary Key
  _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  tenant_id UUID NOT NULL,
  template_code VARCHAR(100) NOT NULL UNIQUE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Template Content
  subject VARCHAR(500),
  body_text TEXT,
  body_html TEXT,
  
  -- Classification
  notification_type VARCHAR(50) NOT NULL DEFAULT 'email', -- email, sms, push, in-app, webhook
  category VARCHAR(100), -- system, marketing, transactional, alert, reminder
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Localization
  language_code VARCHAR(10) DEFAULT 'vi',
  
  -- Template Variables
  variables JSONB DEFAULT '[]'::jsonb, -- [{name, type, required, default}]
  sample_data JSONB, -- Sample data for preview
  
  -- Delivery Settings
  delivery_channels VARCHAR(50)[] DEFAULT ARRAY['email'], -- email, sms, push, in-app
  send_immediately BOOLEAN DEFAULT true,
  scheduled_send_time TIME,
  
  -- Status & Visibility
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, draft, archived
  is_system_template BOOLEAN DEFAULT false,
  is_editable BOOLEAN DEFAULT true,
  
  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  
  -- Version Control
  version INTEGER DEFAULT 1,
  parent_template_id UUID REFERENCES notification_templates(_id),
  
  -- Additional Settings
  attachments JSONB,
  headers JSONB,
  metadata JSONB,
  tags VARCHAR(100)[],
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255),
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by VARCHAR(255)
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_notification_templates_tenant ON notification_templates(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_templates_code ON notification_templates(template_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_templates_type ON notification_templates(notification_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_templates_category ON notification_templates(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_templates_status ON notification_templates(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_templates_language ON notification_templates(language_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_notification_templates_created_at ON notification_templates(created_at DESC) WHERE deleted_at IS NULL;

-- ============================================
-- Demo Data
-- ============================================

INSERT INTO notification_templates (
  tenant_id, template_code, template_name, description, subject, body_text, body_html,
  notification_type, category, priority, language_code, variables, delivery_channels,
  status, is_system_template, is_editable, usage_count, success_count, 
  created_by, updated_by, tags
) VALUES
  -- Welcome Email
  (
    '00000000-0000-0000-0000-000000000001',
    'WELCOME_EMAIL',
    'Email chào mừng người dùng mới',
    'Email tự động gửi khi người dùng đăng ký thành công',
    'Chào mừng {{userName}} đến với {{appName}}!',
    'Xin chào {{userName}},\n\nCảm ơn bạn đã đăng ký tài khoản tại {{appName}}. Chúng tôi rất vui mừng được đón bạn!\n\nThông tin tài khoản:\n- Email: {{userEmail}}\n- Ngày đăng ký: {{registrationDate}}\n\nTruy cập: {{loginUrl}}\n\nTrân trọng,\nĐội ngũ {{appName}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #6366f1;">Xin chào {{userName}}!</h2><p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>{{appName}}</strong>.</p><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3>Thông tin tài khoản</h3><ul><li><strong>Email:</strong> {{userEmail}}</li><li><strong>Ngày đăng ký:</strong> {{registrationDate}}</li></ul></div><a href="{{loginUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">Đăng nhập ngay</a></div>',
    'email',
    'system',
    'normal',
    'vi',
    '[{"name": "userName", "type": "string", "required": true}, {"name": "appName", "type": "string", "required": true}, {"name": "userEmail", "type": "string", "required": true}, {"name": "registrationDate", "type": "date", "required": false}, {"name": "loginUrl", "type": "url", "required": true}]'::jsonb,
    ARRAY['email'],
    'active',
    true,
    true,
    1247,
    1198,
    'system',
    'system',
    ARRAY['onboarding', 'welcome', 'user']
  ),
  
  -- Password Reset
  (
    '00000000-0000-0000-0000-000000000001',
    'PASSWORD_RESET',
    'Đặt lại mật khẩu',
    'Email gửi link đặt lại mật khẩu cho người dùng',
    'Yêu cầu đặt lại mật khẩu - {{appName}}',
    'Xin chào {{userName}},\n\nChúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.\n\nNhấp vào link sau để đặt lại mật khẩu:\n{{resetUrl}}\n\nLink có hiệu lực trong {{expiryMinutes}} phút.\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\nTrân trọng,\n{{appName}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2>Đặt lại mật khẩu</h2><p>Xin chào <strong>{{userName}}</strong>,</p><p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p><div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;"><p style="margin: 0;"><strong>⏰ Link có hiệu lực trong {{expiryMinutes}} phút</strong></p></div><a href="{{resetUrl}}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">Đặt lại mật khẩu</a><p style="color: #6b7280; margin-top: 20px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p></div>',
    'email',
    'system',
    'high',
    'vi',
    '[{"name": "userName", "type": "string", "required": true}, {"name": "appName", "type": "string", "required": true}, {"name": "resetUrl", "type": "url", "required": true}, {"name": "expiryMinutes", "type": "number", "required": true, "default": 30}]'::jsonb,
    ARRAY['email'],
    'active',
    true,
    true,
    856,
    823,
    'system',
    'system',
    ARRAY['security', 'password', 'authentication']
  ),
  
  -- Order Confirmation
  (
    '00000000-0000-0000-0000-000000000001',
    'ORDER_CONFIRMATION',
    'Xác nhận đơn hàng',
    'Email xác nhận đơn hàng đã được đặt thành công',
    'Đơn hàng #{{orderNumber}} đã được xác nhận',
    'Xin chào {{customerName}},\n\nCảm ơn bạn đã đặt hàng!\n\nThông tin đơn hàng:\n- Mã đơn: {{orderNumber}}\n- Ngày đặt: {{orderDate}}\n- Tổng tiền: {{totalAmount}} {{currency}}\n\nChi tiết: {{orderDetailsUrl}}\n\nTrân trọng,\n{{companyName}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #10b981;">✅ Đơn hàng đã được xác nhận!</h2><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Cảm ơn bạn đã đặt hàng tại {{companyName}}.</p><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3>Thông tin đơn hàng</h3><ul><li><strong>Mã đơn:</strong> {{orderNumber}}</li><li><strong>Ngày đặt:</strong> {{orderDate}}</li><li><strong>Tổng tiền:</strong> <span style="color: #10b981; font-size: 20px;">{{totalAmount}} {{currency}}</span></li></ul></div><a href="{{orderDetailsUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Xem chi tiết đơn hàng</a></div>',
    'email',
    'transactional',
    'high',
    'vi',
    '[{"name": "customerName", "type": "string", "required": true}, {"name": "orderNumber", "type": "string", "required": true}, {"name": "orderDate", "type": "date", "required": true}, {"name": "totalAmount", "type": "number", "required": true}, {"name": "currency", "type": "string", "required": true, "default": "VND"}, {"name": "orderDetailsUrl", "type": "url", "required": true}, {"name": "companyName", "type": "string", "required": true}]'::jsonb,
    ARRAY['email', 'sms'],
    'active',
    false,
    true,
    3421,
    3398,
    'admin',
    'admin',
    ARRAY['orders', 'transactional', 'e-commerce']
  ),
  
  -- Payment Success
  (
    '00000000-0000-0000-0000-000000000001',
    'PAYMENT_SUCCESS',
    'Thanh toán thành công',
    'Thông báo thanh toán đã được xử lý thành công',
    '💳 Thanh toán thành công - {{invoiceNumber}}',
    'Xin chào {{customerName}},\n\nThanh toán của bạn đã được xử lý thành công!\n\n- Số hóa đơn: {{invoiceNumber}}\n- Số tiền: {{amount}} {{currency}}\n- Phương thức: {{paymentMethod}}\n- Thời gian: {{paymentTime}}\n\nTải hóa đơn: {{invoiceUrl}}\n\nCảm ơn bạn!\n{{companyName}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;"><h2 style="margin: 0;">💳 Thanh toán thành công!</h2></div><div style="padding: 20px;"><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Thanh toán của bạn đã được xử lý thành công.</p><table style="width: 100%; border-collapse: collapse; margin: 20px 0;"><tr style="background: #f9fafb;"><td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Số hóa đơn</strong></td><td style="padding: 12px; border: 1px solid #e5e7eb;">{{invoiceNumber}}</td></tr><tr><td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Số tiền</strong></td><td style="padding: 12px; border: 1px solid #e5e7eb; color: #10b981; font-size: 18px;">{{amount}} {{currency}}</td></tr><tr style="background: #f9fafb;"><td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Phương thức</strong></td><td style="padding: 12px; border: 1px solid #e5e7eb;">{{paymentMethod}}</td></tr><tr><td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Thời gian</strong></td><td style="padding: 12px; border: 1px solid #e5e7eb;">{{paymentTime}}</td></tr></table><a href="{{invoiceUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Tải hóa đơn</a></div></div>',
    'email',
    'transactional',
    'high',
    'vi',
    '[{"name": "customerName", "type": "string", "required": true}, {"name": "invoiceNumber", "type": "string", "required": true}, {"name": "amount", "type": "number", "required": true}, {"name": "currency", "type": "string", "required": true}, {"name": "paymentMethod", "type": "string", "required": true}, {"name": "paymentTime", "type": "datetime", "required": true}, {"name": "invoiceUrl", "type": "url", "required": true}, {"name": "companyName", "type": "string", "required": true}]'::jsonb,
    ARRAY['email', 'sms', 'push'],
    'active',
    false,
    true,
    2876,
    2864,
    'admin',
    'admin',
    ARRAY['payment', 'billing', 'transactional']
  ),
  
  -- Subscription Expiry Reminder
  (
    '00000000-0000-0000-0000-000000000001',
    'SUBSCRIPTION_EXPIRY',
    'Nhắc nhở hết hạn subscription',
    'Email nhắc nhở trước khi subscription hết hạn',
    '⏰ Subscription sắp hết hạn trong {{daysLeft}} ngày',
    'Xin chào {{customerName}},\n\nSubscription {{planName}} của bạn sẽ hết hạn vào {{expiryDate}}.\n\nCòn lại: {{daysLeft}} ngày\n\nGia hạn ngay để tiếp tục sử dụng dịch vụ: {{renewUrl}}\n\nTrân trọng,\n{{appName}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;"><h2 style="margin: 0;">⏰ Subscription sắp hết hạn</h2></div><div style="padding: 20px;"><p>Xin chào <strong>{{customerName}}</strong>,</p><p>Subscription <strong>{{planName}}</strong> của bạn sẽ hết hạn vào <strong>{{expiryDate}}</strong>.</p><div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;"><p style="margin: 0; font-size: 18px;"><strong>Còn lại: {{daysLeft}} ngày</strong></p></div><p>Gia hạn ngay để tiếp tục sử dụng các tính năng premium.</p><a href="{{renewUrl}}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">Gia hạn ngay</a></div></div>',
    'email',
    'reminder',
    'high',
    'vi',
    '[{"name": "customerName", "type": "string", "required": true}, {"name": "planName", "type": "string", "required": true}, {"name": "expiryDate", "type": "date", "required": true}, {"name": "daysLeft", "type": "number", "required": true}, {"name": "renewUrl", "type": "url", "required": true}, {"name": "appName", "type": "string", "required": true}]'::jsonb,
    ARRAY['email', 'push'],
    'active',
    false,
    true,
    892,
    881,
    'admin',
    'admin',
    ARRAY['subscription', 'reminder', 'billing']
  ),
  
  -- System Maintenance Alert
  (
    '00000000-0000-0000-0000-000000000001',
    'MAINTENANCE_ALERT',
    'Cảnh báo bảo trì hệ thống',
    'Thông báo về lịch bảo trì hệ thống sắp tới',
    '🔧 Thông báo bảo trì hệ thống - {{maintenanceDate}}',
    'Kính gửi quý khách,\n\nHệ thống sẽ được bảo trì vào:\n- Ngày: {{maintenanceDate}}\n- Thời gian: {{startTime}} - {{endTime}}\n- Dự kiến: {{duration}} giờ\n\nTrong thời gian này, dịch vụ có thể bị gián đoạn.\n\nVui lòng lưu công việc trước thời điểm trên.\n\nTrân trọng,\n{{companyName}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;"><h2 style="margin: 0;">🔧 Thông báo bảo trì hệ thống</h2></div><div style="padding: 20px;"><p>Kính gửi quý khách,</p><p>Chúng tôi sẽ thực hiện bảo trì hệ thống để nâng cao chất lượng dịch vụ.</p><div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;"><h3 style="margin-top: 0;">Thời gian bảo trì</h3><ul style="margin-bottom: 0;"><li><strong>Ngày:</strong> {{maintenanceDate}}</li><li><strong>Thời gian:</strong> {{startTime}} - {{endTime}}</li><li><strong>Dự kiến:</strong> {{duration}} giờ</li></ul></div><p style="color: #dc2626;"><strong>⚠️ Trong thời gian này, dịch vụ có thể bị gián đoạn.</strong></p><p>Vui lòng lưu công việc trước thời điểm trên.</p></div></div>',
    'email',
    'alert',
    'urgent',
    'vi',
    '[{"name": "maintenanceDate", "type": "date", "required": true}, {"name": "startTime", "type": "time", "required": true}, {"name": "endTime", "type": "time", "required": true}, {"name": "duration", "type": "number", "required": true}, {"name": "companyName", "type": "string", "required": true}]'::jsonb,
    ARRAY['email', 'sms', 'push'],
    'active',
    true,
    true,
    234,
    231,
    'system',
    'system',
    ARRAY['system', 'maintenance', 'alert']
  ),
  
  -- New Feature Announcement
  (
    '00000000-0000-0000-0000-000000000001',
    'NEW_FEATURE',
    'Thông báo tính năng mới',
    'Email giới thiệu tính năng mới cho người dùng',
    '🚀 Tính năng mới: {{featureName}}',
    'Xin chào {{userName}},\n\nChúng tôi vừa ra mắt tính năng mới: {{featureName}}\n\n{{featureDescription}}\n\nLợi ích:\n{{benefits}}\n\nTrải nghiệm ngay: {{featureUrl}}\n\nTrân trọng,\n{{appName}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;"><h2 style="margin: 0;">🚀 Tính năng mới!</h2><h3 style="margin: 10px 0 0 0;">{{featureName}}</h3></div><div style="padding: 20px;"><p>Xin chào <strong>{{userName}}</strong>,</p><p>{{featureDescription}}</p><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3>Lợi ích</h3><div>{{benefits}}</div></div><a href="{{featureUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Trải nghiệm ngay</a></div></div>',
    'email',
    'marketing',
    'normal',
    'vi',
    '[{"name": "userName", "type": "string", "required": true}, {"name": "featureName", "type": "string", "required": true}, {"name": "featureDescription", "type": "string", "required": true}, {"name": "benefits", "type": "string", "required": false}, {"name": "featureUrl", "type": "url", "required": true}, {"name": "appName", "type": "string", "required": true}]'::jsonb,
    ARRAY['email', 'push', 'in-app'],
    'active',
    false,
    true,
    567,
    552,
    'marketing',
    'marketing',
    ARRAY['marketing', 'feature', 'announcement']
  ),
  
  -- SMS OTP Template
  (
    '00000000-0000-0000-0000-000000000001',
    'SMS_OTP',
    'Mã OTP xác thực',
    'SMS gửi mã OTP cho xác thực 2 lớp',
    NULL,
    'Ma OTP cua ban la: {{otpCode}}. Ma co hieu luc trong {{expiryMinutes}} phut. KHONG chia se ma nay voi bat ky ai.',
    NULL,
    'sms',
    'system',
    'urgent',
    'vi',
    '[{"name": "otpCode", "type": "string", "required": true}, {"name": "expiryMinutes", "type": "number", "required": true, "default": 5}]'::jsonb,
    ARRAY['sms'],
    'active',
    true,
    false,
    4532,
    4498,
    'system',
    'system',
    ARRAY['sms', 'otp', 'security', 'authentication']
  ),
  
  -- Push Notification - New Message
  (
    '00000000-0000-0000-0000-000000000001',
    'PUSH_NEW_MESSAGE',
    'Tin nhắn mới',
    'Push notification khi nhận tin nhắn mới',
    'Tin nhắn mới từ {{senderName}}',
    '{{messagePreview}}',
    NULL,
    'push',
    'system',
    'normal',
    'vi',
    '[{"name": "senderName", "type": "string", "required": true}, {"name": "messagePreview", "type": "string", "required": true}]'::jsonb,
    ARRAY['push'],
    'active',
    false,
    true,
    8921,
    8876,
    'system',
    'system',
    ARRAY['push', 'messaging', 'notification']
  ),
  
  -- Draft Template
  (
    '00000000-0000-0000-0000-000000000001',
    'DRAFT_PROMO',
    'Email khuyến mãi (Nháp)',
    'Template khuyến mãi đang trong quá trình soạn thảo',
    'Ưu đãi đặc biệt dành cho bạn!',
    'Nội dung đang được hoàn thiện...',
    '<div>Đang soạn thảo...</div>',
    'email',
    'marketing',
    'low',
    'vi',
    '[]'::jsonb,
    ARRAY['email'],
    'draft',
    false,
    true,
    0,
    0,
    'marketing',
    'marketing',
    ARRAY['marketing', 'promotion', 'draft']
  );

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE notification_templates IS 'Reusable notification templates for various channels';
COMMENT ON COLUMN notification_templates.template_code IS 'Unique identifier for the template (e.g., WELCOME_EMAIL)';
COMMENT ON COLUMN notification_templates.notification_type IS 'Type: email, sms, push, in-app, webhook';
COMMENT ON COLUMN notification_templates.variables IS 'JSON array of template variables with metadata';
COMMENT ON COLUMN notification_templates.delivery_channels IS 'Array of channels to send through';
COMMENT ON COLUMN notification_templates.is_system_template IS 'System templates cannot be deleted';
