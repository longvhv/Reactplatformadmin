/**
 * Profile Types
 * Type definitions for profile management
 */

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  position: string;
  department: string;
  joinDate: string;
  bio: string;
}

export interface ProfileStats {
  label: string;
  value: string;
}

export interface Activity {
  action: string;
  project: string;
  time: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  description: string;
}

export interface NotificationSetting {
  label: string;
  description: string;
  enabled: boolean;
}

export interface Session {
  device: string;
  location: string;
  time: string;
  isActive: boolean;
}
