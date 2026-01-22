/**
 * Reserved Slugs Page
 * Trang quản lý các slug được bảo lưu
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Shield, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { showToast } from '@/lib/toast';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

interface ReservedSlug {
  _id: string;
  slug: string;
  description?: string;
  entity_type?: string;
  is_active: boolean;
  created_at?: string;
}

function ReservedSlugsPage() {
  const router = useRouter();
  const [reservedSlugs, setReservedSlugs] = useState<ReservedSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0`;

  const fetchReservedSlugs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/core/reserved-slugs`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reserved slugs');
      }

      const result = await response.json();
      setReservedSlugs(result.data || []);
    } catch (error: any) {
      console.error('Error fetching reserved slugs:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách reserved slugs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservedSlugs();
  }, []);

  const filteredSlugs = reservedSlugs.filter(slug =>
    slug.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slug.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slug.entity_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      icon={Shield}
      title="Reserved Slugs"
      description="Quản lý các slug được bảo lưu trong hệ thống"
      actions={
        <Button onClick={() => router.push('/platform/reserved-slugs/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Reserved Slug
        </Button>
      }
    >
      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm reserved slugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Reserved Slugs List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải reserved slugs...</span>
          </div>
        ) : filteredSlugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có reserved slugs'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu bằng cách tạo reserved slug đầu tiên'}
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push('/platform/reserved-slugs/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Reserved Slug Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold">Slug</th>
                  <th className="text-left py-3 px-4 font-semibold">Entity Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlugs.map((slug) => (
                  <tr
                    key={slug._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => router.push(`/platform/reserved-slugs/${slug._id}`)}
                  >
                    <td className="py-3 px-4">
                      <code className="text-sm bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                        /{slug.slug}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      {slug.entity_type && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {slug.entity_type}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {slug.description || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          slug.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {slug.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export default ReservedSlugsPage;