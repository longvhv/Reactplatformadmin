/**
 * Edit System Announcement Page
 */

'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import { Bell, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { AnnouncementForm } from '../../../../../../components/announcements/AnnouncementForm';
import { useSystemAnnouncement, useSystemAnnouncements } from '../../../../../../hooks/useSystemAnnouncements';
import { UpdateSystemAnnouncementRequest } from '../../../../../../api/systemAnnouncementsApi';
import { showToast } from '../../../../../../lib/toast';

export default function EditSystemAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const { announcement, loading: fetching } = useSystemAnnouncement(id);
  const { updateAnnouncement } = useSystemAnnouncements({ autoLoad: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await updateAnnouncement(id, data as UpdateSystemAnnouncementRequest);
      showToast.success('Thành công', 'Đã cập nhật thông báo');
      router.push('/platform/system-announcements');
    } catch (error: any) {
      console.error('Failed to update announcement:', error);
      showToast.error('Lỗi', error.message || 'Không thể cập nhật thông báo');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">Không tìm thấy thông báo</p>
        <Button variant="link" onClick={() => router.push('/platform/system-announcements')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <PageLayout
      icon={Bell}
      title="Chỉnh sửa thông báo"
      description={`Cập nhật thông tin cho thông báo: ${announcement.title}`}
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/system-announcements')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <AnnouncementForm
          announcement={announcement}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/system-announcements')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}