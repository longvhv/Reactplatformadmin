/**
 * Create User Delegation Page
 * Trang tạo mới ủy quyền
 * ✅ CREATED: 2026-01-20
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { UserCog, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { useUserDelegations } from '@/hooks/useUserDelegations';
import { DelegationScopeHelper } from '@/api/userDelegationsApi';
import { showToast } from '@/lib/toast';
import { supabase } from '@/utils/supabase/client';

function CreateUserDelegationPage() {
  const router = useRouter();
  const { createDelegation } = useUserDelegations();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Array<{ _id: string; email: string; full_name?: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ _id: string; name: string }>>([]);
  
  const [formData, setFormData] = useState({
    delegator_id: '',
    delegate_id: '',
    tenant_id: '',
    scope: 'viewer' as string,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    reason: '',
    custom_permissions: '',
  });

  useEffect(() => {
    loadUsers();
    loadTenants();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('_id, email, full_name')
      .order('email')
      .limit(200);
    setUsers(data || []);
  };

  const loadTenants = async () => {
    const { data } = await supabase
      .from('tenants')
      .select('_id, name')
      .order('name')
      .limit(100);
    setTenants(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.delegator_id || !formData.delegate_id) {
      showToast.error('Lỗi', 'Vui lòng chọn người ủy quyền và người được ủy quyền');
      return;
    }
    
    if (formData.delegator_id === formData.delegate_id) {
      showToast.error('Lỗi', 'Không thể ủy quyền cho chính mình');
      return;
    }
    
    if (!formData.end_date) {
      showToast.error('Lỗi', 'Vui lòng chọn ngày kết thúc');
      return;
    }
    
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      showToast.error('Lỗi', 'Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    setLoading(true);
    try {
      const delegator = users.find(u => u._id === formData.delegator_id);
      const delegate = users.find(u => u._id === formData.delegate_id);
      const tenant = tenants.find(t => t._id === formData.tenant_id);

      await createDelegation({
        delegator_id: formData.delegator_id,
        delegator_name: delegator?.full_name || delegator?.email || '',
        delegator_email: delegator?.email || '',
        delegate_id: formData.delegate_id,
        delegate_name: delegate?.full_name || delegate?.email || '',
        delegate_email: delegate?.email || '',
        tenant_id: formData.tenant_id || null,
        tenant_name: tenant?.name || null,
        scope: formData.scope,
        status: 'pending',
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason || null,
        custom_permissions: formData.custom_permissions ? JSON.parse(formData.custom_permissions) : null,
        can_reassign: false,
        is_auto_approved: false,
      });
      
      showToast.success('Thành công', 'Đã tạo ủy quyền mới');
      router.push('/admin/user-delegations');
    } catch (error: any) {
      showToast.error('Lỗi', error.message || 'Không thể tạo ủy quyền');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Fragment>
      <PageLayout
        icon={UserCog}
        title="Tạo ủy quyền mới"
        description="Tạo ủy quyền quyền hạn cho người dùng"
        actions={
          <Button variant="outline" onClick={() => router.push('/admin/user-delegations')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        }
      >
        <Card className="p-6 max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delegator Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Người ủy quyền <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.delegator_id}
                onChange={(e) => handleChange('delegator_id', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Chọn người ủy quyền...</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.full_name || user.email} ({user.email})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Người sẽ ủy quyền quyền hạn của mình
              </p>
            </div>

            {/* Delegate Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Người được ủy quyền <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.delegate_id}
                onChange={(e) => handleChange('delegate_id', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Chọn người được ủy quyền...</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.full_name || user.email} ({user.email})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Người sẽ nhận được quyền hạn
              </p>
            </div>

            {/* Tenant Selection (Optional) */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Tenant (Tùy chọn)
              </label>
              <select
                value={formData.tenant_id}
                onChange={(e) => handleChange('tenant_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Tất cả tenants</option>
                {tenants.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Giới hạn ủy quyền trong một tenant cụ thể
              </p>
            </div>

            {/* Scope Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Phạm vi quyền hạn <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.scope}
                onChange={(e) => handleChange('scope', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="admin">Admin - Toàn quyền quản trị</option>
                <option value="manager">Manager - Quản lý và điều phối</option>
                <option value="editor">Editor - Chỉnh sửa nội dung</option>
                <option value="viewer">Viewer - Chỉ xem</option>
                <option value="approver">Approver - Phê duyệt</option>
                <option value="reviewer">Reviewer - Đánh giá</option>
                <option value="auditor">Auditor - Kiểm toán</option>
                <option value="custom">Custom - Tùy chỉnh</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Ngày kết thúc <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Lý do ủy quyền
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Nhập lý do ủy quyền (tùy chọn)..."
              />
            </div>

            {/* Custom Permissions (for custom scope) */}
            {formData.scope === 'custom' && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Custom Permissions (JSON)
                </label>
                <textarea
                  value={formData.custom_permissions}
                  onChange={(e) => handleChange('custom_permissions', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder='{"read": true, "write": false, ...}'
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Nhập JSON object cho quyền hạn tùy chỉnh
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Đang tạo...' : 'Tạo ủy quyền'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/user-delegations')}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Card>
      </PageLayout>
    </Fragment>
  );
}

export { CreateUserDelegationPage };
export default CreateUserDelegationPage;
