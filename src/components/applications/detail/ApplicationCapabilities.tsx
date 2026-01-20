/**
 * ApplicationCapabilities Component
 * Quản lý khả năng của application
 * 
 * ✅ FIXED 2026-01-14:
 * - Import correct types from /api/appCapabilityApi
 * - Use correct type enum: FEATURE | LIMIT (not BOOLEAN | NUMBER)
 * - Use correct status field (not is_active)
 * - Add all missing fields: display_order, is_required, validation_rules, status
 * - Display proper capability information
 * - Fix appCode → appId
 */

import { useState } from 'react';
import { 
  Plus,
  Edit,
  Trash2,
  CheckSquare,
  Hash,
  Shield,
  Zap,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useCapabilities } from '@/hooks/useCapabilities';
import { 
  type CapabilityType, 
  type CapabilityStatus,
  type CreateCapabilityRequest,
} from '@/api/appCapabilityApi';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ApplicationCapabilitiesProps {
  appId: string;
  tenantId?: string;
}

interface FormData {
  code: string;
  name: string;
  type: CapabilityType;
  description: string;
  display_order: string;
  is_required: boolean;
  status: CapabilityStatus;
  // For default_value
  enabled: boolean;
  value: string;
  unit: string;
}

const INITIAL_FORM_DATA: FormData = {
  code: '',
  name: '',
  type: 'FEATURE',
  description: '',
  display_order: '0',
  is_required: false,
  status: 'active',
  enabled: false,
  value: '0',
  unit: '',
};

export function ApplicationCapabilities({ appId, tenantId }: ApplicationCapabilitiesProps) {
  const { 
    capabilities, 
    loading, 
    createCapability, 
    updateCapability, 
    deleteCapability,
    changeStatus,
    getFeatures,
    getLimits,
    getActiveCapabilities,
  } = useCapabilities(appId, tenantId);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const { t } = useTranslation();

  const handleAdd = async () => {
    try {
      // Validate
      if (!formData.code || !formData.name) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Build default_value based on type
      const default_value = formData.type === 'FEATURE'
        ? { enabled: formData.enabled }
        : { 
            value: parseInt(formData.value) || 0,
            unit: formData.unit || undefined,
          };

      const data: CreateCapabilityRequest = {
        tenant_id: tenantId || '',
        app_id: appId,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        default_value,
        display_order: parseInt(formData.display_order) || 0,
        is_required: formData.is_required,
        validation_rules: {},
        status: formData.status,
        metadata: {},
      };

      await createCapability(data);
      
      setShowAddForm(false);
      setFormData(INITIAL_FORM_DATA);
    } catch (err) {
      console.error('Failed to create capability:', err);
    }
  };

  const handleEdit = (cap: any) => {
    setEditingId(cap._id);
    setFormData({
      code: cap.code,
      name: cap.name,
      type: cap.type,
      description: cap.description || '',
      display_order: cap.display_order?.toString() || '0',
      is_required: cap.is_required || false,
      status: cap.status || 'active',
      enabled: cap.default_value?.enabled || false,
      value: cap.default_value?.value?.toString() || '0',
      unit: cap.default_value?.unit || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    
    const cap = capabilities.find(c => c._id === editingId);
    if (!cap) return;

    try {
      // Build default_value based on type
      const default_value = formData.type === 'FEATURE'
        ? { enabled: formData.enabled }
        : { 
            value: parseInt(formData.value) || 0,
            unit: formData.unit || undefined,
          };

      await updateCapability(editingId, {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        default_value,
        display_order: parseInt(formData.display_order) || 0,
        is_required: formData.is_required,
        status: formData.status,
        version: cap.version,
      });

      setEditingId(null);
      setFormData(INITIAL_FORM_DATA);
    } catch (err) {
      console.error('Failed to update capability:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa khả năng này?')) return;
    
    try {
      await deleteCapability(id);
    } catch (err) {
      console.error('Failed to delete capability:', err);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: CapabilityStatus, version: number) => {
    const newStatus: CapabilityStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await changeStatus(id, newStatus, version);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const getTypeIcon = (type: CapabilityType) => {
    return type === 'FEATURE' ? Zap : Hash;
  };

  const getTypeColor = (type: CapabilityType) => {
    return type === 'FEATURE' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  const getStatusColor = (status?: CapabilityStatus | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDefaultValue = (type: CapabilityType, value: any) => {
    if (type === 'FEATURE') {
      return value?.enabled ? 'Enabled' : 'Disabled';
    }
    return `${value?.value || 0}${value?.unit ? ' ' + value.unit : ''}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const features = getFeatures();
  const limits = getLimits();
  const activeCount = getActiveCapabilities().length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Khả năng ứng dụng</h2>
            <p className="text-sm text-gray-500 mt-1">
              Quản lý các tính năng (features) và giới hạn (limits) của ứng dụng
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm khả năng
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="font-medium mb-4">Thêm khả năng mới</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mã khả năng (lowercase) *
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  placeholder="max_users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên hiển thị *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Maximum Users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CapabilityType })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="FEATURE">Feature (Tính năng)</option>
                  <option value="LIMIT">Limit (Giới hạn)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thứ tự hiển thị
                </label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  placeholder="0"
                />
              </div>

              {/* Default Value - conditional based on type */}
              {formData.type === 'FEATURE' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mặc định bật?
                  </label>
                  <select
                    value={formData.enabled ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="false">Disabled</option>
                    <option value="true">Enabled</option>
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giá trị mặc định
                    </label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn vị
                    </label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="users, MB, requests..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CapabilityStatus })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="active">{t('common.active')}</option>
                  <option value="inactive">{t('common.inactive')}</option>
                  <option value="archived">{t('common.archived')}</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_required}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Bắt buộc?
                  </span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  placeholder="Mô tả khả năng..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleAdd}>
                Thêm
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setShowAddForm(false);
                  setFormData(INITIAL_FORM_DATA);
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-gray-500">Tổng khả năng</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {capabilities.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Features</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            {features.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">Limits</p>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {limits.length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-gray-500">{t('common.active')}</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {activeCount}
          </p>
        </Card>
      </div>

      {/* Capabilities List */}
      {capabilities.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có khả năng nào</p>
          <Button 
            size="sm" 
            onClick={() => setShowAddForm(true)} 
            className="mt-4 gap-2"
          >
            <Plus className="w-4 h-4" />
            Thêm khả năng đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {capabilities.map((cap) => {
            const TypeIcon = getTypeIcon(cap.type);
            const isEditing = editingId === cap._id;
            
            return (
              <Card key={cap._id} className="p-6">
                {isEditing ? (
                  // Edit Form - Same as Add Form but with Update button
                  <div className="space-y-4">
                    <h3 className="font-medium mb-4">Chỉnh sửa khả năng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mã khả năng (read-only)
                        </label>
                        <Input
                          value={formData.code}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên hiển thị *
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loại *
                        </label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as CapabilityType })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="FEATURE">Feature (Tính năng)</option>
                          <option value="LIMIT">Limit (Giới hạn)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thứ tự hiển thị
                        </label>
                        <Input
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                        />
                      </div>

                      {formData.type === 'FEATURE' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mặc định bật?
                          </label>
                          <select
                            value={formData.enabled ? 'true' : 'false'}
                            onChange={(e) => setFormData({ ...formData, enabled: e.target.value === 'true' })}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="false">Disabled</option>
                            <option value="true">Enabled</option>
                          </select>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Giá trị mặc định
                            </label>
                            <Input
                              type="number"
                              value={formData.value}
                              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Đơn vị
                            </label>
                            <Input
                              value={formData.unit}
                              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trạng thái
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as CapabilityStatus })}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="active">{t('common.active')}</option>
                          <option value="inactive">{t('common.inactive')}</option>
                          <option value="archived">{t('common.archived')}</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.is_required}
                            onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Bắt buộc?
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mô tả
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-3 py-2 border rounded-md"
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate}>
                        Cập nhật
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancelEdit}
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-lg ${getTypeColor(cap.type).split(' ')[0]}`}>
                        <TypeIcon className={`w-6 h-6 ${getTypeColor(cap.type).split(' ')[1]}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-gray-900">{cap.name}</h3>
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {cap.code}
                          </code>
                          <Badge className={getTypeColor(cap.type)}>
                            {cap.type}
                          </Badge>
                          <Badge className={getStatusColor(cap.status)}>
                            {cap.status || 'active'}
                          </Badge>
                          {cap.is_required && (
                            <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Required
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            #{cap.display_order}
                          </span>
                        </div>

                        {cap.description && (
                          <p className="mt-2 text-sm text-gray-600">
                            {cap.description}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Default: <strong>{formatDefaultValue(cap.type, cap.default_value)}</strong>
                          </span>
                          <span>v{cap.version}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cap)}
                        title="Chỉnh sửa"
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(cap._id, cap.status || 'active', cap.version)}
                        title={cap.status === 'active' ? 'Deactivate' : 'Activate'}
                        className={cap.status === 'active' ? 'text-green-600' : 'text-gray-400'}
                      >
                        {cap.status === 'active' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cap._id)}
                        className="hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Về Capabilities</h4>
            <p className="text-sm text-blue-800">
              <strong>Features</strong> là các tính năng có thể bật/tắt (enabled/disabled).
              <strong className="ml-2">Limits</strong> là các giới hạn số lượng (ví dụ: max users, storage size).
              Capabilities được dùng để định nghĩa những gì tenant có thể làm với ứng dụng này.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}