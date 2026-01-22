/**
 * Product Types Page
 * Trang quản lý các loại sản phẩm
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Package, Plus, Search } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { showToast } from '../../../../lib/toast';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

interface ProductType {
  _id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
}

function ProductTypesPage() {
  const router = useRouter();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0`;

  const fetchProductTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/product-types`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product types');
      }

      const result = await response.json();
      setProductTypes(result.data || []);
    } catch (error: any) {
      console.error('Error fetching product types:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách product types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const filteredProductTypes = productTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      icon={Package}
      title="Product Types"
      description="Quản lý các loại sản phẩm trong hệ thống"
      actions={
        <Button onClick={() => router.push('/platform/product-types/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Product Type
        </Button>
      }
    >
      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm product types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Product Types List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải product types...</span>
          </div>
        ) : filteredProductTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có product types'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu bằng cách tạo product type đầu tiên'}
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push('/platform/product-types/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Product Type Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProductTypes.map((type) => (
              <Card
                key={type._id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/platform/product-types/${type._id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <Package className="w-8 h-8 text-blue-500" />
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      type.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {type.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h3 className="font-semibold mb-1">{type.name}</h3>
                <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {type.code}
                </code>
                {type.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {type.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export default ProductTypesPage;