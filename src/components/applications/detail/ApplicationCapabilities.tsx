/**
 * Application Capabilities Component
 * Displays and manages capabilities (FEATURE/LIMIT) for an application
 */

import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Archive,
  ExternalLink,
  Copy,
  ArrowUp,
  ArrowDown,
  Shield,
  CheckSquare,
  Zap,
  Hash,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card } from '../../ui/card';
import { useCapabilities } from '../../../hooks/useCapabilities';
import { 
  type CapabilityType, 
  type CapabilityStatus,
  type Capability,
  type AppCapability,
  type CreateCapabilityRequest,
  type UpdateCapabilityRequest,
} from '../../../api/appCapabilityApi';
import { CapabilityForm } from '../../capabilities/CapabilityForm';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface ApplicationCapabilitiesProps {
  appId: string;
  tenantId?: string;
}

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
  const { t } = useTranslation();

  const handleFormSubmit = async (data: Partial<AppCapability>) => {
    try {
      if (editingId) {
        // Update
        const currentCap = capabilities.find(c => c._id === editingId);
        if (!currentCap) return;

        const updateData: UpdateCapabilityRequest = {
          name: data.name,
          description: data.description,
          type: data.type,
          default_value: data.default_value,
          display_order: data.display_order,
          is_required: data.is_required,
          status: data.status,
          validation_rules: data.validation_rules,
          metadata: data.metadata,
          version: currentCap.version,
        };

        await updateCapability(editingId, updateData);
        setEditingId(null);
        toast.success('Cập nhật khả năng thành công');
      } else {
        // Create
        const createData: CreateCapabilityRequest = {
          tenant_id: tenantId || '',
          app_id: appId,
          code: data.code!,
          name: data.name!,
          description: data.description,
          type: data.type!,
          default_value: data.default_value!,
          display_order: data.display_order || 0,
          is_required: data.is_required || false,
          validation_rules: data.validation_rules || {},
          status: data.status || 'active',
          metadata: data.metadata || {},
        };

        await createCapability(createData);
        setShowAddForm(false);
        toast.success('Tạo khả năng mới thành công');
      }
    } catch (err: any) {
      console.error('Failed to save capability:', err);
      toast.error('Lỗi lưu khả năng', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa khả năng này?')) return;
    
    try {
      await deleteCapability(id);
      toast.success('Đã xóa khả năng');
    } catch (err) {
      console.error('Failed to delete capability:', err);
      toast.error('Lỗi xóa', 'Không thể xóa khả năng này');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: CapabilityStatus, version: number) => {
    const newStatus: CapabilityStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await changeStatus(id, newStatus, version);
      toast.success(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} khả năng`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      toast.error('Lỗi cập nhật trạng thái');
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
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingId(null);
            }}
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
            <CapabilityForm
              appId={appId}
              onSubmit={handleFormSubmit}
              onCancel={() => setShowAddForm(false)}
            />
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
                  // Edit Form
                  <div className="space-y-4">
                    <h3 className="font-medium mb-4">Chỉnh sửa khả năng</h3>
                    <CapabilityForm
                      appId={appId}
                      capability={cap}
                      onSubmit={handleFormSubmit}
                      onCancel={() => setEditingId(null)}
                    />
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
                        onClick={() => {
                          setEditingId(cap._id);
                          setShowAddForm(false);
                        }}
                        title="Chỉnh sửa"
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
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