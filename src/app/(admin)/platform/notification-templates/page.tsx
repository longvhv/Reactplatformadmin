'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Mail, Plus } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { notificationTemplateApi, NotificationTemplate } from '../../../../api/notificationTemplateApi';
import { showToast } from '../../../../lib/toast';

function NotificationTemplatesPage() {
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

  const filteredTemplates = templates.filter(t => 
    t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.template_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge variant="default" className="bg-green-600">Active</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'inactive': return <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
      case 'archived': return <Badge variant="outline" className="text-gray-400">Archived</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'email': return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Email</Badge>;
      case 'sms': return <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">SMS</Badge>;
      case 'push': return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Push</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <PageLayout
      icon={Mail}
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
            <Clock className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{template.template_name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">{template.template_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getTypeBadge(template.notification_type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(template.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col gap-1 text-xs">
                        <span>Used: {template.usage_count || 0}</span>
                        <span>Success: {template.success_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/platform/notification-templates/edit/${template._id}`)}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(template._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTemplates.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy template nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export default NotificationTemplatesPage;