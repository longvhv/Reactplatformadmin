/**
 * Reserved Slugs Page
 * Trang quản lý các slug đã được đặt trước
 * ✅ CREATED: 2026-01-20
 * ✅ MERGED: Consolidated from /app/(admin)/reserved-slugs/page.tsx
 */
'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Shield, Plus, Search } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { showToast } from '../../../../lib/toast';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

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
      showToast.error('Error', error.message || 'Failed to load reserved slugs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservedSlugs();
  }, []);

  const filteredSlugs = reservedSlugs.filter((slug) =>
    slug.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (slug.description && slug.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageLayout
      icon={Shield}
      title="Reserved Slugs"
      description="Manage reserved slugs and entity identifiers"
      actions={
        <Button onClick={() => router.push('/platform/reserved-slugs/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Reserved Slug
        </Button>
      }
    >
      <Card className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search slugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reserved slugs...</p>
          </div>
        ) : filteredSlugs.length === 0 ? (
          <div className="text-center py-12">
            {!searchTerm && (
              <Button onClick={() => router.push('/platform/reserved-slugs/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Reserved Slug
              </Button>
            )}
            {searchTerm && (
              <p className="text-gray-500">No reserved slugs found matching "{searchTerm}"</p>
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Description</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSlugs.map((slug) => (
                  <tr
                    key={slug._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => router.push(`/platform/reserved-slugs/${slug._id}`)}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {slug.slug}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {slug.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {slug.entity_type || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        slug.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
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

export { ReservedSlugsPage };
export default ReservedSlugsPage;