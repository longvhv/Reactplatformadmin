/**
 * EditUserPage Component
 * Full-featured user edit form with real data from Supabase
 * 
 * Features:
 * - Load user data by ID
 * - All fields from users schema
 * - Status management (ACTIVE, BANNED, DISABLED, PENDING)
 * - MFA toggle
 * - Support staff toggle
 * - Verification toggle
 * - Locale selection
 * - Avatar URL input
 * - Phone number input
 * - Real-time validation
 * - Success/Error handling
 * - Breadcrumb navigation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { userApi, User, UpdateUserRequest } from '../api/userApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  ArrowLeft, 
  Save, 
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  Shield,
  UserCheck,
  Lock,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING'>('ACTIVE');
  const [locale, setLocale] = useState('vi-VN');
  const [isSupportStaff, setIsSupportStaff] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/core/users');
      return;
    }
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await userApi.getById(id!);
      setUser(userData);
      
      // Populate form
      setFullName(userData.full_name);
      setEmail(userData.email);
      setPhoneNumber(userData.phone_number || '');
      setAvatarUrl(userData.avatar_url || '');
      setStatus(userData.status);
      setLocale(userData.locale);
      setIsSupportStaff(userData.is_support_staff);
      setMfaEnabled(userData.mfa_enabled);
      setIsVerified(userData.is_verified);
    } catch (error: any) {
      toast.error('Không thể tải thông tin người dùng: ' + error.message);
      navigate('/core/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    if (!email.trim()) {
      toast.error('Email không được để trống');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    if (avatarUrl && !avatarUrl.match(/^https?:\/\//)) {
      toast.error('Avatar URL phải bắt đầu với http:// hoặc https://');
      return;
    }

    try {
      setSaving(true);

      const updateData: UpdateUserRequest = {
        full_name: fullName,
        email: email,
        phone_number: phoneNumber || undefined,
        avatar_url: avatarUrl || undefined,
        status: status,
        locale: locale,
        is_support_staff: isSupportStaff,
        mfa_enabled: mfaEnabled,
        is_verified: isVerified,
      };

      await userApi.update(id!, updateData);
      
      toast.success('✅ Cập nhật người dùng thành công!');
      navigate(`/core/users/${id}`);
    } catch (error: any) {
      toast.error('❌ Không thể cập nhật người dùng: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.')) {
      navigate(`/core/users/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Không tìm thấy người dùng</p>
          <Button onClick={() => navigate('/core/users')}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/core/users/${id}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Chỉnh sửa người dùng
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Cập nhật thông tin cho {user.full_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className="w-full"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Số điện thoại
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+84 xxx xxx xxx"
                  className="w-full"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Avatar URL
                </label>
                <Input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full"
                />
                {avatarUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                    <img 
                      src={avatarUrl} 
                      alt="Avatar preview" 
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status & Security Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Trạng thái & Bảo mật
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trạng thái <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="ACTIVE">Active - Đang hoạt động</option>
                  <option value="PENDING">Pending - Chờ xác nhận</option>
                  <option value="DISABLED">Disabled - Vô hiệu hóa</option>
                  <option value="BANNED">Banned - Bị cấm</option>
                </select>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {status === 'ACTIVE' && '✅ Người dùng có thể đăng nhập và sử dụng hệ thống'}
                  {status === 'PENDING' && '⏳ Người dùng chờ xác nhận email/phone'}
                  {status === 'DISABLED' && '🔒 Người dùng tạm thời không thể đăng nhập'}
                  {status === 'BANNED' && '🚫 Người dùng bị cấm vĩnh viễn'}
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Is Verified */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Đã xác minh (Verified)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Người dùng đã xác minh email/phone
                    </p>
                  </div>
                </label>

                {/* MFA Enabled */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mfaEnabled}
                    onChange={(e) => setMfaEnabled(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        MFA Enabled (2FA)
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Xác thực hai yếu tố đã được kích hoạt
                    </p>
                  </div>
                </label>

                {/* Is Support Staff */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSupportStaff}
                    onChange={(e) => setIsSupportStaff(e.target.checked)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Support Staff
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Có quyền Impersonation (đăng nhập thay người dùng khác)
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Cấu hình
              </h2>
            </div>
            <div className="p-6">
              {/* Locale */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngôn ngữ (Locale) <span className="text-red-500">*</span>
                </label>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="vi-VN">🇻🇳 Tiếng Việt (vi-VN)</option>
                  <option value="en-US">🇺🇸 English (en-US)</option>
                  <option value="ja-JP">🇯🇵 日本語 (ja-JP)</option>
                  <option value="ko-KR">🇰🇷 한국어 (ko-KR)</option>
                  <option value="zh-CN">🇨🇳 简体中文 (zh-CN)</option>
                  <option value="th-TH">🇹🇭 ไทย (th-TH)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Metadata Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Thông tin bổ sung:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                <li>User ID: <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs">{user._id}</code></li>
                <li>Tạo lúc: {new Date(user.created_at).toLocaleString('vi-VN')}</li>
                <li>Cập nhật: {new Date(user.updated_at).toLocaleString('vi-VN')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
