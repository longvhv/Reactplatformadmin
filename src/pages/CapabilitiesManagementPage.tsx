/**
 * Capabilities Management Page
 * Manage application features and limits
 * < 500 lines
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { appCapabilityApi, AppCapability, CapabilityType } from '../api/appCapabilityApi';
import { CapabilityForm } from '../components/capabilities/CapabilityForm';
import { CapabilityTable } from '../components/capabilities/CapabilityTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function CapabilitiesManagementPage() {
  const { id: appId } = useParams<{ id: string }>();
  const [capabilities, setCapabilities] = useState<AppCapability[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCapability, setEditingCapability] = useState<AppCapability | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<CapabilityType | 'all'>('all');
  const [statistics, setStatistics] = useState({
    total: 0,
    features: 0,
    limits: 0,
    active: 0,
    inactive: 0,
  });

  const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    if (appId) {
      loadCapabilities();
      loadStatistics();
    }
  }, [appId]);

  const loadCapabilities = async () => {
    if (!appId) return;

    try {
      setLoading(true);
      const data = await appCapabilityApi.getByAppId(appId, DEMO_TENANT_ID);
      setCapabilities(data);
    } catch (error: any) {
      toast.error('Không thể tải danh sách capabilities: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!appId) return;

    try {
      const stats = await appCapabilityApi.getStatistics(appId, DEMO_TENANT_ID);
      setStatistics(stats);
    } catch (error: any) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleAdd = () => {
    setEditingCapability(null);
    setShowForm(true);
  };

  const handleEdit = (capability: AppCapability) => {
    setEditingCapability(capability);
    setShowForm(true);
  };

  const handleDelete = async (capability: AppCapability) => {
    if (!confirm(`Bạn có chắc muốn xóa capability "${capability.name}"?`)) return;

    try {
      await appCapabilityApi.softDelete(capability._id!);
      toast.success('Đã xóa capability');
      loadCapabilities();
      loadStatistics();
    } catch (error: any) {
      toast.error('Không thể xóa: ' + error.message);
    }
  };

  const handleSubmit = async (data: Partial<AppCapability>) => {
    try {
      if (editingCapability) {
        await appCapabilityApi.update(
          editingCapability._id!,
          data,
          editingCapability.version!
        );
        toast.success('Đã cập nhật capability');
      } else {
        await appCapabilityApi.create({
          ...data,
          tenant_id: DEMO_TENANT_ID,
          app_id: appId!,
        } as any);
        toast.success('Đã tạo capability mới');
      }

      setShowForm(false);
      setEditingCapability(null);
      loadCapabilities();
      loadStatistics();
    } catch (error: any) {
      toast.error(editingCapability ? 'Không thể cập nhật' : 'Không thể tạo mới');
      throw error;
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCapability(null);
  };

  const handleSearch = () => {
    // Search is handled in filteredCapabilities
  };

  const filteredCapabilities = capabilities.filter(cap => {
    // Filter by type
    if (filterType !== 'all' && cap.type !== filterType) {
      return false;
    }

    // Search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      return (
        cap.name.toLowerCase().includes(search) ||
        cap.code.toLowerCase().includes(search) ||
        cap.description?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Capabilities
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tính năng và giới hạn của ứng dụng
          </p>
        </div>
        {!showForm && (
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm Capability
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {!showForm && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {statistics.total}
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">Tính năng</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 mt-1">
              {statistics.features}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
            <p className="text-sm text-purple-600 dark:text-purple-400">Giới hạn</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-300 mt-1">
              {statistics.limits}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4">
            <p className="text-sm text-green-600 dark:text-green-400">Hoạt động</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300 mt-1">
              {statistics.active}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Không hoạt động</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {statistics.inactive}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {editingCapability ? 'Chỉnh sửa Capability' : 'Thêm Capability mới'}
          </h2>
          <CapabilityForm
            capability={editingCapability}
            appId={appId!}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <>
          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm theo tên, mã, mô tả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="FEATURE">Tính năng</option>
                  <option value="LIMIT">Giới hạn</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <CapabilityTable
              capabilities={filteredCapabilities}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>
        </>
      )}
    </div>
  );
}
