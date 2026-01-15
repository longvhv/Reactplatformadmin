/**
 * Add System Announcement Page
 * Page for creating a new system announcement/notification
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { AnnouncementForm } from '../components/announcements/AnnouncementForm';
import { systemAnnouncementApi, CreateSystemAnnouncementRequest } from '../api/systemAnnouncementApi';
import { toast } from 'sonner@2.0.3';

export default function AddNotificationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateSystemAnnouncementRequest) => {
    setLoading(true);
    
    try {
      console.log('📝 Creating system announcement:', data);
      
      const response = await systemAnnouncementApi.create(data);
      
      console.log('✅ System announcement created:', response);
      
      // Show success toast
      toast.success('Tạo thông báo thành công!', {
        description: `Thông báo "${data.title}" đã được tạo và đang hoạt động`,
        duration: 5000,
      });
      
      // Navigate back to list
      navigate('/core/system-announcements');
      
    } catch (error: any) {
      console.error('❌ Error creating system announcement:', error);
      
      const errorMessage = error?.message || 'Không thể tạo thông báo';
      
      toast.error('Tạo thông báo thất bại', {
        description: errorMessage,
        duration: 7000,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/system-announcements');
  };

  return (
    <FormPageLayout
      mode="add"
      title="Tạo thông báo hệ thống"
      description="Tạo thông báo mới cho toàn hệ thống"
      icon={Bell}
      backPath="/core/system-announcements"
      backLabel="Quay lại danh sách"
    >
      <AnnouncementForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </FormPageLayout>
  );
}