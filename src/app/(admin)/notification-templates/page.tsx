/**
 * Notification Templates Page
 * Trang quản lý templates thông báo
 * ✅ CREATED: 2026-01-20
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Mail, Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { showToast } from '@/lib/toast';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

interface NotificationTemplate {
  _id: string;
  code: string;
  name: string;
  description?: string;
  subject?: string;
  channel: string;
  is_active: boolean;
  created_at?: string;
}

function NotificationTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0`;

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/notification-templates`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification templates');
      }

      const result = await response.json();
      setTemplates(result.data || []);
    } catch (error: any) {
      console.error('Error fetching notification templates:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách notification templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getChannelColor = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'sms':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'push':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <PageLayout
      icon={Mail}
      title="Notification Templates"
      description="Quản lý templates cho các thông báo hệ thống"
      actions={
        <Button onClick={() => router.push('/admin/notification-templates/create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Template
        </Button>
      }
    >
      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Templates List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải templates...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có templates'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Bắt đầu bằng cách tạo template đầu tiên'}
            </p>
            {!searchTerm && (
              <Button onClick={() => router.push('/admin/notification-templates/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo Template Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <div
                key={template._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/notification-templates/${template._id}`)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getChannelColor(template.channel)}`}>
                        {template.channel}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{template.code}</p>
                    {template.subject && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Subject: {template.subject}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    template.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export default NotificationTemplatesPage;
