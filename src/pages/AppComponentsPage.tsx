/**
 * App Components Page
 * Manage application components with hierarchy structure
 * Table: app_components
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Plus, Search, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { appComponentApi, AppComponent } from '@/api/appComponentApi';
import { toast } from 'sonner@2.0.3';

export function AppComponentsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [components, setComponents] = useState<AppComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      const data = await appComponentApi.getAll({
        search: searchTerm || undefined,
      });
      setComponents(data);
    } catch (error) {
      toast.error('Không thể tải danh sách components');
      console.error('Load components error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadComponents();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Xóa component "${title}"?`)) {
      return;
    }

    try {
      await appComponentApi.delete(id);
      toast.success('Đã xóa component');
      loadComponents();
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa component');
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-xl flex items-center justify-center">
              <Box className="h-6 w-6 text-white" />
            </div>
            App Components
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Quản lý các thành phần của ứng dụng
          </p>
        </div>
        
        <Button
          onClick={() => navigate('/app-components/add')}
          className="bg-[#6366f1] hover:bg-[#4f46e5] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm Component
        </Button>
      </div>

      {/* Search Card */}
      <Card className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo ID hoặc tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#6366f1] focus:border-transparent bg-white dark:bg-gray-800"
            />
          </div>
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Components Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Component ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : components.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                components.map((component) => (
                  <tr
                    key={component.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {component._id}
                      </code>
                    </td>
                    <td className="px-6 py-4 font-medium">{component.title}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {component.parent_id ? (
                        <div className="flex items-center gap-1">
                          <ChevronRight className="h-3 w-3" />
                          <code className="text-xs">{component.parent_id}</code>
                        </div>
                      ) : (
                        <span className="text-gray-400">Root</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {component.order}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={component.is_active ? 'success' : 'secondary'}>
                        {component.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app-components/edit/${component.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(component.id!, component.title)}
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
