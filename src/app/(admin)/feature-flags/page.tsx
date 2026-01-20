/**
 * Feature Flags List Page
 * Trang quản lý feature flags
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Flag, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { showToast } from '@/lib/toast';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

interface FeatureFlag {
  _id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  environments?: string[];
  created_at?: string;
  updated_at?: string;
}

function FeatureFlagsPage() {
  const router = useRouter();
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0`;

  const fetchFeatureFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/feature-flags`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }

      const result = await response.json();
      setFeatureFlags(result.data || []);
    } catch (error: any) {
      console.error('Error fetching feature flags:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const handleToggleFlag = async (flag: FeatureFlag) => {
    try {
      const response = await fetch(`${baseUrl}/feature-flags/${flag._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...flag,
          enabled: !flag.enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle feature flag');
      }

      showToast.success('Thành công', `Đã ${!flag.enabled ? 'bật' : 'tắt'} feature flag`);
      fetchFeatureFlags();
    } catch (error: any) {
      console.error('Error toggling feature flag:', error);
      showToast.error('Lỗi', 'Không thể cập nhật feature flag');
    }
  };

  const filteredFlags = featureFlags.filter(flag =>
    flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flag.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      icon={Flag}
      title="Feature Flags"
      description="Quản lý tính năng động cho ứng dụng"
      actions={
        <Button onClick={() => router.push('/platform/feature-flags/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Feature Flag
        </Button>
      }
    >
      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm feature flags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Feature Flags List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải feature flags...</span>
          </div>
        ) : filteredFlags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có feature flags'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu bằng cách tạo feature flag đầu tiên'}
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push('/platform/feature-flags/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Feature Flag Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFlags.map((flag) => (
              <div
                key={flag._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex-1 cursor-pointer" onClick={() => router.push(`/platform/feature-flags/${flag._id}`)}>
                  <div className="flex items-center gap-3">
                    <Flag className={`w-5 h-5 ${flag.enabled ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-semibold">{flag.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{flag.key}</p>
                      {flag.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{flag.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFlag(flag);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flag.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export default FeatureFlagsPage;
