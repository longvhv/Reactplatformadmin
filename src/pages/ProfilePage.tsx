import { useState } from "react";
import { useProfile } from "../hooks/useProfile";
import { ProfileSidebar } from "../components/profile/ProfileSidebar";
import { ProfileInfoSection } from "../components/profile/ProfileInfoSection";
import { SecuritySection } from "../components/profile/SecuritySection";
import { NotificationsSection } from "../components/profile/NotificationsSection";
import { ActivitySection } from "../components/profile/ActivitySection";
import type { Activity } from "../types/profile";

/**
 * Profile Page - Modular & Extensible
 * 
 * ARCHITECTURE:
 * - ✅ Separated into reusable components
 * - ✅ Custom hooks for state management
 * - ✅ TypeScript types in /types
 * - ✅ Constants in /constants
 * - ✅ Easy to extend and maintain
 * 
 * STRUCTURE:
 * - ProfileSidebar: Navigation menu
 * - ProfileInfoSection: Personal information
 * - SecuritySection: Password & 2FA
 * - NotificationsSection: Notification settings
 * - ActivitySection: Recent activity
 */
export function ProfilePage() {
  const [activeSection, setActiveSection] = useState("profile");
  const {
    profile,
    editedProfile,
    isEditing,
    handleEdit,
    handleSave,
    handleCancel,
    updateField,
  } = useProfile();

  const recentActivity: Activity[] = [
    { 
      action: "Hoàn thành dự án", 
      project: "VHV Platform v2.0", 
      time: "2 giờ trước",
    },
    { 
      action: "Cập nhật dashboard", 
      project: "Analytics Module", 
      time: "5 giờ trước",
    },
    { 
      action: "Review code", 
      project: "Authentication System", 
      time: "1 ngày trước",
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <ProfileInfoSection
            profile={profile}
            editedProfile={editedProfile}
            isEditing={isEditing}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onFieldChange={updateField}
          />
        );
      case "security":
        return <SecuritySection />;
      case "notifications":
        return <NotificationsSection />;
      case "activity":
        return <ActivitySection activities={recentActivity} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Hồ sơ của tôi</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý thông tin cá nhân và cài đặt tài khoản
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <ProfileSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
