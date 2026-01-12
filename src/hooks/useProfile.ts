/**
 * useProfile Hook
 * Custom hook for profile state management
 */

import { useState } from "react";
import type { ProfileData } from "../types/profile";

const DEFAULT_PROFILE: ProfileData = {
  name: "Nguyễn Văn A",
  email: "admin@vhvplatform.com",
  phone: "+84 123 456 789",
  location: "Thành phố Hồ Chí Minh, Việt Nam",
  position: "Senior Full Stack Developer",
  department: "Engineering",
  joinDate: "January 2024",
  bio: "Passionate developer with 8+ years of experience building scalable web applications.",
};

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [editedProfile, setEditedProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setEditedProfile(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    // TODO: Add API call to save profile
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  return {
    profile,
    editedProfile,
    isEditing,
    handleEdit,
    handleSave,
    handleCancel,
    updateField,
  };
}
