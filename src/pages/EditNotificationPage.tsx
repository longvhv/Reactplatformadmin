/**
 * Edit System Announcement Page
 * Page for editing an existing system announcement/notification
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Bell, RefreshCw, AlertCircle } from 'lucide-react';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { AnnouncementForm } from '../components/announcements/AnnouncementForm';
import { 
  systemAnnouncementApi, 
  SystemAnnouncement,
  UpdateSystemAnnouncementRequest 
} from '../api/systemAnnouncementsApi';
import { toast } from 'sonner@2.0.3';

export default function EditNotificationPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load announcement data
  useEffect(() => {
    const loadAnnouncement = async () => {
      if (!id) {
        setError('ID thông báo không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        console.log('📥 Loading system announcement:', id);
        
        const data = await systemAnnouncementApi.getById(id);
        
        console.log('✅ System announcement loaded:', data);
        setAnnouncement(data);
        setError(null);
        
      } catch (err: any) {
        console.error('❌ Error loading system announcement:', err);
        
        const errorMessage = err?.message || 'Không thể tải thông báo';
        setError(errorMessage);
        
        toast.error('Lỗi tải thông báo', {
          description: errorMessage,
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [id]);

  const handleSubmit = async (data: UpdateSystemAnnouncementRequest) => {
    if (!id || !announcement) return;
    
    setUpdating(true);
    
    try {
      console.log('📝 Updating system announcement:', id, data);
      
      const response = await systemAnnouncementApi.update(id, data);
      
      console.log('✅ System announcement updated:', response);
      
      // Show success toast
      toast.success('Cập nhật thông báo thành công!', {
        description: `Thông báo đã được cập nhật`,
        duration: 5000,
      });
      
      // Navigate back to list
      navigate('/platform/system-announcements', { replace: true });
      
    } catch (err: any) {
      console.error('❌ Error updating system announcement:', err);
      
      const errorMessage = err?.message || 'Không thể cập nhật thông báo';
      
      toast.error('Cập nhật thông báo thất bại', {
        description: errorMessage,
        duration: 7000,
      });
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    navigate('/platform/system-announcements');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !announcement) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Lỗi tải thông báo</h2>
          <p className="text-muted-foreground mb-6">{error || 'Thông báo không tồn tại'}</p>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Chỉnh Sửa Thông Báo"
      description={`Cập nhật: ${announcement?.title || ''}`}
      icon={Bell}
      backPath="/platform/system-announcements"
      backLabel="Quay lại danh sách"
    >
      <AnnouncementForm
        announcement={announcement}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={updating}
      />
    </FormPageLayout>
  );
}