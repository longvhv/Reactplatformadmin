/**
 * EditUserPage Component
 * Full-featured user edit form with real data from Supabase
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 * 
 * Features:
 * - Load user data by ID
 * - All fields from users schema
 * - Status management (ACTIVE, BANNED, DISABLED, PENDING)
 * - MFA toggle, Support staff toggle, Verification toggle
 * - Locale selection, Avatar URL, Phone number
 * - Real-time validation, Success/Error handling
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { User as UserIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { userApi, User, UpdateUserRequest } from '../api/userApi';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { UserForm } from '../components/users/UserForm';
import { Button } from '../components/ui/button';
import { toast } from 'sonner@2.0.3';

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
    } catch (error: any) {
      toast.error('Không thể tải thông tin người dùng: ' + error.message);
      navigate('/core/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UpdateUserRequest) => {
    // Validation
    if (!data.full_name?.trim()) {
      toast.error('Họ và tên không được để trống');
      throw new Error('Missing full_name');
    }

    if (!data.email?.trim()) {
      toast.error('Email không được để trống');
      throw new Error('Missing email');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toast.error('Email không hợp lệ');
      throw new Error('Invalid email');
    }

    if (data.avatar_url && !data.avatar_url.match(/^https?:\/\//)) {
      toast.error('Avatar URL phải bắt đầu với http:// hoặc https://');
      throw new Error('Invalid avatar_url');
    }

    try {
      setSaving(true);
      await userApi.update(id!, data);
      toast.success('✅ Cập nhật người dùng thành công!');
      navigate(`/core/users/${id}`);
    } catch (error: any) {
      toast.error('❌ Không thể cập nhật người dùng: ' + error.message);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/core/users/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Không tìm thấy người dùng</p>
          <Button onClick={() => navigate('/core/users')}>Quay lại danh sách</Button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh sửa người dùng"
      description={`Cập nhật thông tin cho ${user.full_name}`}
      icon={UserIcon}
      backPath={`/core/users/${id}`}
      backLabel="Quay lại"
    >
      <UserForm
        user={user}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
      />
    </FormPageLayout>
  );
}