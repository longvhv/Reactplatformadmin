/**
 * Login Page - Authentication
 */
'use client';
import { Fragment, useState } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { showToast } from '@/lib/toast';
import { useAuthContext } from '@/providers/AuthProvider';

function LoginPage() {
  const router = useRouter();
  const { login } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      showToast.success('Thành công', 'Đăng nhập thành công!');
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check if it's a "user not found" or credentials error
      const errorMessage = error.message || 'Có lỗi xảy ra';
      
      if (errorMessage.includes('Tài khoản không tồn tại') || 
          errorMessage.includes('Invalid login credentials')) {
        showToast.error(
          'Tài khoản chưa được khởi tạo', 
          'Vui lòng truy cập trang /setup để khởi tạo hệ thống',
          {
            duration: 8000,
          }
        );
      } else {
        showToast.error('Lỗi', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Đăng Nhập
            </h1>
            <p className="text-gray-600">
              Vui lòng đăng nhập để tiếp tục
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Tài khoản mặc định:</p>
            <p className="font-mono mt-1">admin@saas.coquan.vn</p>
            <p className="font-mono">Vhv@2026</p>
            <p className="text-xs text-amber-600 mt-2">
              🔓 Bypass Mode: Chỉ cần email đúng là login được
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">
                Lần đầu sử dụng? Cần khởi tạo hệ thống?
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push('/setup')}
                className="text-xs"
              >
                Đi tới trang Setup
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Fragment>
  );
}

export { LoginPage };
export default LoginPage;