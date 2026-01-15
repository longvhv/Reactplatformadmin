/**
 * Profile Types
 * Type definitions for user profile components
 * Extracted from deprecated /services/profileApi.ts
 */

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  role: string;
  avatar: string;
  bio?: string;
  department?: string;
  position?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileActivity {
  id: number;
  action: string;
  time: string;
  type: 'auth' | 'profile' | 'security' | 'settings';
  createdAt: string;
  updatedAt: string;
}
