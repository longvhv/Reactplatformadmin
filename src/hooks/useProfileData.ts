import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from '@/providers/LanguageProvider';
import { 
  profileApi, 
  profileActivitiesApi, 
  type UserProfile, 
  type ProfileActivity 
} from '@/services/profileApi';

export function useProfileData() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    const loadedProfile = profileApi.getCurrent();
    const loadedActivities = profileActivitiesApi.getRecent(10);
    setProfile(loadedProfile);
    setActivities(loadedActivities);
    setLoading(false);
  }, []);

  const updateProfile = useCallback((updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>) => {
    const updated = profileApi.updateCurrent(updates);
    if (updated) {
      setProfile(updated);
      
      // Add activity log
      profileActivitiesApi.addActivity({
        action: 'Updated profile',
        time: 'Just now',
        type: 'profile',
      });
      
      setActivities(profileActivitiesApi.getRecent(10));
      toast.success(t('profile.updated'));
    }
  }, [t]);

  const addActivity = useCallback((data: Omit<ProfileActivity, 'id' | 'createdAt' | 'updatedAt'>) => {
    profileActivitiesApi.addActivity(data);
    setActivities(profileActivitiesApi.getRecent(10));
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    profile,
    activities,
    loading,
    updateProfile,
    addActivity,
    refreshData,
  };
}
