/**
 * Location Types Page
 * Trang quản lý các loại địa điểm
 * ✅ CREATED: 2026-01-20
 * ✅ UPDATED: 2026-01-20 - Integrated LocationTypeFormDialog and locationTypesApi
 */
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Loader2, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { showToast } from '@/lib/toast';
import {
  locationTypesApi,
  LocationType,
  CreateLocationTypeData,
  UpdateLocationTypeData
} from '@/api/locationTypesApi';
import { LocationTypeFormDialog } from '@/components/locationTypes/LocationTypeFormDialog';

// Mock tenant ID for now - in a real app this would come from auth context
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';

function LocationTypesPage() {
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocationType, setSelectedLocationType] = useState<LocationType | undefined>(undefined);

  const fetchLocationTypes = async () => {
    try {
      setLoading(true);
      // In a real app, we would get the tenantId from the session/context
      // For now, we'll fetch all or filter by the mock tenant
      const data = await locationTypesApi.getAll({ tenant_id: MOCK_TENANT_ID });
      setLocationTypes(data);
    } catch (error: any) {
      console.error('Error fetching location types:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách location types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationTypes();
  }, []);

  const filteredLocationTypes = locationTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedLocationType(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (type: LocationType) => {
    setSelectedLocationType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa loại địa điểm "${name}"?`)) return;

    try {
      await locationTypesApi.delete(id);
      showToast.success('Thành công', 'Đã xóa loại địa điểm');
      fetchLocationTypes();
    } catch (error: any) {
      console.error('Error deleting location type:', error);
      showToast.error('Lỗi', error.message || 'Không thể xóa loại địa điểm');
    }
  };

  const handleSubmit = async (data: CreateLocationTypeData | UpdateLocationTypeData, id?: string) => {
    try {
      if (id) {
        await locationTypesApi.update(id, data as UpdateLocationTypeData);
        showToast.success('Thành công', 'Đã cập nhật loại địa điểm');
      } else {
        await locationTypesApi.create(data as CreateLocationTypeData);
        showToast.success('Thành công', 'Đã tạo loại địa điểm mới');
      }
      fetchLocationTypes();
    } catch (error: any) {
      console.error('Error saving location type:', error);
      throw error; // Rethrow to be handled by the modal
    }
  };

  return (
    <PageLayout
      icon={MapPin}
      title="Location Types"
      description="Quản lý các loại địa điểm trong hệ thống"
      actions={
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Location Type
        </Button>
      }
    >
      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm location types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Location Types List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải location types...</span>
          </div>
        ) : filteredLocationTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có location types'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu bằng cách tạo location type đầu tiên'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Location Type Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold">Code</th>
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="text-left py-3 px-4 font-semibold">Extra Fields</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-right py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocationTypes.map((type) => (
                  <tr
                    key={type._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4">
                      <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                        {type.code}
                      </code>
                    </td>
                    <td className="py-3 px-4 font-medium">{type.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {type.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {type.extra_fields?.length || 0} fields
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          type.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(type)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                        </Button>
                        {!type.is_system && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(type._id, type.name)}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <LocationTypeFormDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editData={selectedLocationType}
        tenantId={MOCK_TENANT_ID}
      />
    </PageLayout>
  );
}

export default LocationTypesPage;
