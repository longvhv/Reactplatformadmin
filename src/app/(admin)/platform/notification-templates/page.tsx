import React, { useState, useEffect } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { 
  Bell, Plus, Search, Loader2 
} from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { notificationTemplateApi, NotificationTemplate } from '../../../../../api/notificationTemplateApi';
import { TemplateTable } from '../../../../../components/notification-templates/TemplateTable';
import { showToast } from '../../../../../lib/toast';

export default function NotificationTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await notificationTemplateApi.getAll();
      setTemplates(data);
    } catch (error: any) {
      console.error('Failed to load templates:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách mẫu thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa template này?')) return;
    try {
      await notificationTemplateApi.delete(id);
      showToast.success('Thành công', 'Đã xóa template');
      loadTemplates();
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể xóa template');
    }
  };

  const handleToggleStatus = async (template: NotificationTemplate) => {
    try {
      const newStatus = template.status === 'active' ? 'inactive' : 'active';
      await notificationTemplateApi.update(template._id, { status: newStatus });
      showToast.success('Thành công', `Đã chuyển trạng thái sang ${newStatus}`);
      loadTemplates();
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleDuplicate = async (template: NotificationTemplate) => {
    showToast.info('Thông báo', 'Tính năng nhân bản đang được phát triển');
  };

  const handlePreview = (template: NotificationTemplate) => {
     showToast.info('Thông báo', 'Tính năng xem trước đang được phát triển');
  }

  const filteredTemplates = templates.filter(t => 
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.template_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageLayout
      icon={Bell}
      title="Mẫu thông báo (Templates)"
      description="Quản lý các mẫu nội dung cho Email, SMS, Push Notification"
      actions={
        <Button onClick={() => router.push('/platform/notification-templates/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo Template
        </Button>
      }
    >
      <Card className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Tìm kiếm theo tên hoặc mã template..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 max-w-md" 
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <TemplateTable
            templates={filteredTemplates}
            onEdit={(t) => router.push(`/platform/notification-templates/edit/${t._id}`)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
            onPreview={handlePreview}
          />
        )}
      </Card>
    </PageLayout>
  );
}
