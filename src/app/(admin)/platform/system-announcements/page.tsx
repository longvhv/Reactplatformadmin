import React, { useState, useEffect } from 'react';
import { useRouter } from '@/components/shim/next-navigation';
import { Bell, Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { AnnouncementTable } from '@/components/announcements/AnnouncementTable';
import { systemAnnouncementsApi, SystemAnnouncement } from '@/api/systemAnnouncementsApi';
import { showToast } from '@/lib/toast';

export default function SystemAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await systemAnnouncementsApi.getAll({
        include_deleted: false,
      });
      setAnnouncements(data);
    } catch (error: any) {
      console.error('Failed to load announcements:', error);
      showToast.error('Lỗi', 'Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Client-side filtering for simplicity, or implement API search
  };

  const filteredAnnouncements = announcements.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    
    try {
      await systemAnnouncementsApi.delete(id);
      showToast.success('Thành công', 'Đã xóa thông báo');
      loadAnnouncements();
    } catch (error: any) {
      showToast.error('Lỗi', 'Không thể xóa thông báo');
    }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    try {
      await systemAnnouncementsApi.update(id, { status: status as any });
      showToast.success('Thành công', 'Đã cập nhật trạng thái');
      loadAnnouncements();
    } catch (error) {
      showToast.error('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    try {
      if (isPublished) {
        await systemAnnouncementsApi.publish(id);
      } else {
        await systemAnnouncementsApi.unpublish(id);
      }
      showToast.success('Thành công', `Đã ${isPublished ? 'xuất bản' : 'ngừng xuất bản'}`);
      loadAnnouncements();
    } catch (error) {
      showToast.error('Lỗi', 'Không thể cập nhật trạng thái xuất bản');
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      if (isPinned) {
        await systemAnnouncementsApi.pin(id);
      } else {
        await systemAnnouncementsApi.unpin(id);
      }
      showToast.success('Thành công', `Đã ${isPinned ? 'ghim' : 'bỏ ghim'}`);
      loadAnnouncements();
    } catch (error) {
      showToast.error('Lỗi', 'Không thể cập nhật trạng thái ghim');
    }
  };

  return (
    <PageLayout
      icon={Bell}
      title="Thông báo hệ thống"
      description="Quản lý các thông báo hiển thị cho người dùng và Tenant"
      actions={
        <Button onClick={() => router.push('/platform/system-announcements/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo thông báo
        </Button>
      }
    >
      <Card className="p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            placeholder="Tìm kiếm thông báo..." 
            value={searchTerm} 
            onChange={(e) => handleSearch(e.target.value)} 
            className="pl-10 max-w-md" 
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <AnnouncementTable
            announcements={filteredAnnouncements}
            onEdit={(item) => router.push(`/platform/system-announcements/edit/${item._id}`)}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            onTogglePublish={handleTogglePublish}
            onTogglePin={handleTogglePin}
          />
        )}
      </Card>
    </PageLayout>
  );
}