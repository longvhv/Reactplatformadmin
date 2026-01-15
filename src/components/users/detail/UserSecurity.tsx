/**
 * UserSecurity Component
 * Cài đặt bảo mật của user
 */

import { useState } from 'react';
import { 
  Shield, 
  Lock,
  Key,
  Mail,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User } from '@/data/users';

interface UserSecurityProps {
  user: User;
  onUpdate: (data: Partial<User>) => Promise<void>;
}

export function UserSecurity({ user, onUpdate }: UserSecurityProps) {
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });

  const handleToggleMFA = async () => {
    if (!confirm(`Bạn có chắc muốn ${user.mfa_enabled ? 'tắt' : 'bật'} MFA?`)) return;
    try {
      await onUpdate({ mfa_enabled: !user.mfa_enabled });
    } catch (err) {
      alert('Cập nhật MFA thất bại');
    }
  };

  const handleToggleVerified = async () => {
    if (!confirm(`Bạn có chắc muốn ${user.is_verified ? 'hủy' : 'xác thực'} email?`)) return;
    try {
      await onUpdate({ is_verified: !user.is_verified });
    } catch (err) {
      alert('Cập nhật thất bại');
    }
  };

  const handleResetPassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('Mật khẩu không khớp');
      return;
    }
    if (passwordData.new_password.length < 8) {
      alert('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    // TODO: Call API to reset password
    alert('Tính năng đang được phát triển');
    setChangingPassword(false);
    setPasswordData({ new_password: '', confirm_password: '' });
  };

  return (
    <div className="space-y-6">
      {/* Email Verification */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Xác thực Email</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-500">
                  {user.is_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                </p>
              </div>
            </div>

            <Button
              variant={user.is_verified ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggleVerified}
              className="gap-2"
            >
              {user.is_verified ? (
                <>
                  <X className="w-4 h-4" />
                  Hủy xác thực
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Xác thực
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* MFA Settings */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Xác thực 2 yếu tố (MFA)</h2>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">
                  MFA {user.mfa_enabled ? 'Đã bật' : 'Đã tắt'}
                </p>
                <p className="text-sm text-gray-500">
                  {user.mfa_enabled 
                    ? 'Bảo vệ tài khoản với mã xác thực 6 chữ số'
                    : 'Tăng cường bảo mật bằng cách bật MFA'
                  }
                </p>
              </div>
            </div>

            <Button
              variant={user.mfa_enabled ? 'outline' : 'default'}
              size="sm"
              onClick={handleToggleMFA}
              className="gap-2"
            >
              {user.mfa_enabled ? (
                <>
                  <X className="w-4 h-4" />
                  Tắt MFA
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Bật MFA
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Password Management */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Mật khẩu</h2>
        </div>

        <div className="p-6">
          {!changingPassword ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Đặt lại mật khẩu</p>
                  <p className="text-sm text-gray-500">
                    Đặt mật khẩu mới cho người dùng
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangingPassword(true)}
                className="gap-2"
              >
                <Key className="w-4 h-4" />
                Đặt lại mật khẩu
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <Input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Nhập mật khẩu mới (min 8 ký tự)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu
                </label>
                <Input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({ new_password: '', confirm_password: '' });
                  }}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleResetPassword}
                >
                  Cập nhật mật khẩu
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Thông tin bảo mật</h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {user.is_verified ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">Email Verified</span>
              </div>
              <p className="text-sm text-gray-500">
                {user.is_verified ? 'Email đã được xác thực' : 'Email chưa xác thực'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {user.mfa_enabled ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">MFA Enabled</span>
              </div>
              <p className="text-sm text-gray-500">
                {user.mfa_enabled ? 'MFA đang được bật' : 'MFA chưa được bật'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {user.is_support_staff ? (
                  <Check className="w-5 h-5 text-purple-600" />
                ) : (
                  <X className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium">Support Staff</span>
              </div>
              <p className="text-sm text-gray-500">
                {user.is_support_staff ? 'Có quyền hỗ trợ' : 'Không có quyền hỗ trợ'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <span className="font-medium">Status</span>
              </div>
              <p className="text-sm text-gray-500">
                {user.status}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
