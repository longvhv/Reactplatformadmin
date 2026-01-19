/**
 * Add User Delegation Page
 * Create a new delegation of authority between users
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { UserCog, Save, X } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner@2.0.3';

// Mock data for users (In a real app, this would come from an API)
const MOCK_USERS = [
  { id: 'user-1', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com' },
  { id: 'user-2', name: 'Trần Thị B', email: 'tranthib@example.com' },
  { id: 'user-3', name: 'Lê Văn C', email: 'levanc@example.com' },
  { id: 'user-4', name: 'Phạm Thị D', email: 'phamthid@example.com' },
  { id: 'user-5', name: 'Hoàng Văn E', email: 'hoangvane@example.com' },
];

// Mock permissions
const AVAILABLE_PERMISSIONS = [
  { id: 'VIEW_REPORTS', label: 'Xem báo cáo (View Reports)' },
  { id: 'APPROVE_REQUESTS', label: 'Phê duyệt yêu cầu (Approve Requests)' },
  { id: 'MANAGE_USERS', label: 'Quản lý người dùng (Manage Users)' },
  { id: 'MANAGE_SETTINGS', label: 'Cấu hình hệ thống (Manage Settings)' },
];

export default function AddUserDelegationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state
  const [delegatorId, setDelegatorId] = useState('');
  const [delegateId, setDelegateId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!delegatorId || !delegateId) {
      toast.error('Vui lòng chọn người ủy quyền và người được ủy quyền');
      return;
    }

    if (delegatorId === delegateId) {
      toast.error('Người ủy quyền và người được ủy quyền không được trùng nhau');
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error('Vui lòng chọn ít nhất một quyền hạn');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Vui lòng chọn thời gian ủy quyền');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Tạo ủy quyền thành công');
      navigate('/admin/user-delegations');
    } catch (error: any) {
      toast.error('Lỗi khi tạo ủy quyền: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId)
        ? prev.filter(p => p !== permId)
        : [...prev, permId]
    );
  };

  return (
    <FormPageLayout
      mode="add"
      title="Thêm Ủy Quyền"
      description="Tạo mới ủy quyền quyền hạn giữa các người dùng"
      icon={UserCog}
      backPath="/admin/user-delegations"
      backLabel="Quay lại danh sách"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Users Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="delegator">Người ủy quyền (Delegator) <span className="text-red-500">*</span></Label>
                <Select value={delegatorId} onValueChange={setDelegatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn người ủy quyền" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_USERS.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delegate">Người được ủy quyền (Delegate) <span className="text-red-500">*</span></Label>
                <Select value={delegateId} onValueChange={setDelegateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn người nhận quyền" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_USERS.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>Quyền hạn được ủy quyền <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-4 bg-muted/20">
                {AVAILABLE_PERMISSIONS.map(perm => (
                  <div key={perm.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`perm-${perm.id}`}
                      checked={selectedPermissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={`perm-${perm.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      {perm.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu <span className="text-red-500">*</span></Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc <span className="text-red-500">*</span></Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do ủy quyền</Label>
              <Textarea
                id="reason"
                placeholder="VD: Nghỉ phép, đi công tác, hỗ trợ dự án..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-24"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/admin/user-delegations')}>
                <X className="w-4 h-4 mr-2" />
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Đang lưu...' : 'Lưu ủy quyền'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </FormPageLayout>
  );
}
