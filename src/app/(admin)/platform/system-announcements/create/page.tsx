/**
 * Create System Announcement Page
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Bell, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { AnnouncementForm } from '../../../../../components/announcements/AnnouncementForm';
import { useSystemAnnouncements } from '../../../../../hooks/useSystemAnnouncements';
import { CreateSystemAnnouncementRequest } from '../../../../../api/systemAnnouncementsApi';
import { showToast } from '../../../../../lib/toast';

export default function CreateSystemAnnouncementPage() {
  const router = useRouter();
  const { createAnnouncement } = useSystemAnnouncements({ autoLoad: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      await createAnnouncement(data as CreateSystemAnnouncementRequest);
      showToast.success('Thành công', 'Đã tạo thông báo mới');
      router.push('/platform/system-announcements');
    } catch (error: any) {
      console.error('Failed to create announcement:', error);
      showToast.error('Lỗi', error.message || 'Không thể tạo thông báo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      icon={Bell}
      title="Tạo thông báo mới"
      description="Tạo thông báo hệ thống mới cho người dùng hoặc Tenant"
      actions={
        <Button variant="outline" onClick={() => router.push('/platform/system-announcements')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      }
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <AnnouncementForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/platform/system-announcements')}
          loading={loading}
        />
      </div>
    </PageLayout>
  );
}