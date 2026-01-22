/**
 * Rate Limits Page
 * Trang quản lý giới hạn tốc độ API
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Gauge, Plus, Search, Loader2, AlertCircle, Zap } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { showToast } from '../../../../lib/toast';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';

interface RateLimit {
  _id: string;
  key: string;
  name: string;
  description?: string;
  max_requests: number;
  window_seconds: number;
  is_active: boolean;
  created_at?: string;
}

function RateLimitsPage() {
  const router = useRouter();
  const [rateLimits, setRateLimits] = useState<RateLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0`;

  const fetchRateLimits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/rate-limits`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If endpoint doesn't exist yet, show empty state instead of error
        if (response.status === 404) {
          setRateLimits([]);
          return;
        }
        throw new Error('Failed to fetch rate limits');
      }

      const result = await response.json();
      setRateLimits(result.data || []);
    } catch (error: any) {
      console.error('Error fetching rate limits:', error);
      // Don't show error toast for 404 - just show empty state
      if (!error.message.includes('404')) {
        showToast.error('Lỗi', 'Không thể tải danh sách rate limits');
      }
      setRateLimits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateLimits();
  }, []);

  const filteredRateLimits = rateLimits.filter(limit =>
    limit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    limit.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    limit.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatWindow = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  return (
    <PageLayout
      icon={Gauge}
      title="Rate Limits"
      description="Quản lý giới hạn tốc độ truy cập API"
      actions={
        <Button onClick={() => router.push('/admin/rate-limits/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Rate Limit
        </Button>
      }
    >
      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm rate limits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Rate Limits List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải rate limits...</span>
          </div>
        ) : filteredRateLimits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có rate limits'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu bằng cách tạo rate limit đầu tiên'}
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push('/admin/rate-limits/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Rate Limit Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRateLimits.map((limit) => (
              <div
                key={limit._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/rate-limits/${limit._id}`)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{limit.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{limit.key}</p>
                    {limit.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {limit.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {limit.max_requests}
                    </div>
                    <div className="text-xs text-gray-500">requests / {formatWindow(limit.window_seconds)}</div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      limit.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {limit.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export default RateLimitsPage;