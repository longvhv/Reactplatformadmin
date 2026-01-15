/**
 * Regions Page
 * Manage regions (Country, Province, District) with date range
 * Table: regions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Plus, Search, Pencil, Trash2, Globe, Building, MapPinned } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { regionsApi, Region } from '@/api/regionsApi';
import { toast } from 'sonner@2.0.3';

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
      toast.error('Không thể tải danh sách regions');
      console.error('Load regions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadRegions();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa region "${name}"?`)) {
      return;
    }

    try {
      await regionsApi.delete(id);
      toast.success('Đã xóa region');
      loadRegions();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa region');
      console.error('Delete error:', error);
    }
  };

  const isActive = (region: Region) => {
    const now = new Date().toISOString().split('T')[0];
    return region.start_date <= now && (region.end_date === null || region.end_date > now);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            Quản lý Địa giới
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Quản lý quốc gia, tỉnh thành, quận huyện
          </p>
        </div>
        
        <Button
          onClick={() => navigate(`/regions/add?type=${selectedType}`)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm Region
        </Button>
      </div>

      {/* Type Selection */}
      <Card className="p-6">
        <label className="block font-medium mb-3">Chọn loại địa giới</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REGION_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value as any)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${ 
                  selectedType === type.value
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-medium">{type.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Search & Table */}
      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã hoặc tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Tên EN</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Ngày bắt đầu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Ngày kết thúc</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">{t('common.loading')}</td>
                </tr>
              ) : regions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">{t('common.noData')}</td>
                </tr>
              ) : (
                regions.map((region) => (
                  <tr key={region.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {region.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 font-medium">{region.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{region.name_en || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{region.start_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{region.end_date || 'Vô thời hạn'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={isActive(region) ? 'success' : 'secondary'}>
                        {isActive(region) ? 'Đang áp dụng' : 'Không áp dụng'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/regions/edit/${region.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(region.id!, region.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default RegionsPage;