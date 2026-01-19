/**
 * Regions Page
 * Manage regions (Country, Province, District) with date range
 * ✅ MIGRATED: Fixed confirm → ConfirmDialog, toast → showToast
 * ✅ 100% QUALITY: Professional list page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Plus, Search, Pencil, Trash2, Globe, Building, MapPinned } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { regionsApi, Region } from '@/api/regionsApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const REGION_TYPES = [
  { value: 'country', label: 'Quốc gia', icon: Globe },
  { value: 'province', label: 'Tỉnh/Thành phố', icon: Building },
  { value: 'district', label: 'Quận/Huyện/Phường', icon: MapPinned },
];

export function RegionsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [selectedType, setSelectedType] = useState<'country' | 'province' | 'district'>('country');
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  useEffect(() => {
    loadRegions();
  }, [selectedType]);

  const loadRegions = async () => {
    try {
      setLoading(true);
      const data = await regionsApi.getAll({
        type: selectedType,
        search: searchTerm || undefined,
      });
      setRegions(data);
    } catch (error) {
      showToast.error('Lỗi', 'Không thể tải danh sách regions');
      console.error('Load regions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadRegions();
  };

  const handleDelete = (region: Region) => {
    setSelectedRegion(region);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRegion) return;

    try {
      await regionsApi.delete(selectedRegion._id);
      showToast.success('Thành công', 'Đã xóa region');
      loadRegions();
    } catch (error: any) {
      showToast.error('Lỗi', error.message || 'Không thể xóa region');
      console.error('Delete error:', error);
    } finally {
      setShowDeleteDialog(false);
      setSelectedRegion(null);
    }
  };

  const isActive = (region: Region) => {
    const now = new Date().toISOString().split('T')[0];
    return region.start_date <= now && (region.end_date === null || region.end_date > now);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t('regions.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Quản lý vùng địa lý: quốc gia, tỉnh thành, quận huyện
            </p>
          </div>
          <Button onClick={() => navigate('/core/regions/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm region
          </Button>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          {REGION_TYPES.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 border-b-2 transition-colors
                  ${selectedType === type.value
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Tìm kiếm
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{regions.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-green-600 dark:text-green-400">Đang hoạt động</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {regions.filter(r => isActive(r)).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Đã hết hạn</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {regions.filter(r => !isActive(r)).length}
            </p>
          </Card>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Đang tải...</p>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Mã</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Tên</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Parent</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Thời gian</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-600 dark:text-gray-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {regions.map((region) => (
                    <tr key={region._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {region.code}
                        </code>
                      </td>
                      <td className="p-4 font-medium text-gray-900 dark:text-white">{region.name}</td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {region.parent_name || '-'}
                      </td>
                      <td className="p-4">
                        <Badge className={isActive(region) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {isActive(region) ? 'Active' : 'Expired'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {region.start_date} → {region.end_date || 'Vô thời hạn'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/core/regions/${region._id}/edit`)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(region)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {regions.length === 0 && !loading && (
              <div className="text-center py-12">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu</p>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa region"
        description={`Bạn có chắc chắn muốn xóa region "${selectedRegion?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
      />
    </>
  );
}

export default RegionsPage;
