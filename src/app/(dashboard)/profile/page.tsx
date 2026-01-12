'use client';

import { useState } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';
import { useProfileData } from '@/hooks/useProfileData';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileInfo } from '@/components/profile/ProfileInfo';
import { RecentActivity } from '@/components/profile/RecentActivity';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { profile, activities, loading, updateProfile } = useProfileData();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('profile.description')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <ProfileCard 
            profile={profile} 
            onEdit={() => setEditDialogOpen(true)}
          />
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <ProfileInfo profile={profile} />
          <RecentActivity activities={activities} />
        </div>
      </div>

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        onSave={updateProfile}
      />
    </div>
  );
}