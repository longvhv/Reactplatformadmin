/**
 * Profile Service
 * Business logic for profile management
 */

import { apiClient } from './api/client';
import { API_ENDPOINTS } from './api/endpoints';
import type { ProfileData } from '../types/profile';

class ProfileService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<ProfileData> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get<ProfileData>(API_ENDPOINTS.user.profile);
    // return response.data;

    // Mock data for now
    return {
      name: "Nguyễn Văn A",
      email: "admin@vhvplatform.com",
      phone: "+84 123 456 789",
      location: "Thành phố Hồ Chí Minh, Việt Nam",
      position: "Senior Full Stack Developer",
      department: "Engineering",
      joinDate: "January 2024",
      bio: "Passionate developer with 8+ years of experience building scalable web applications.",
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
    // TODO: Replace with actual API call
    // const response = await apiClient.put<ProfileData>(API_ENDPOINTS.user.update, data);
    // return response.data;

    // Mock response for now
    console.log('Updating profile:', data);
    return data as ProfileData;
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    // TODO: Implement file upload
    // const formData = new FormData();
    // formData.append('avatar', file);
    // const response = await apiClient.post<{ url: string }>(API_ENDPOINTS.user.avatar, formData);
    // return response.data.url;

    // Mock response for now
    console.log('Uploading avatar:', file.name);
    return 'https://example.com/avatar.jpg';
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // TODO: Replace with actual API call
    // await apiClient.post(API_ENDPOINTS.user.password, {
    //   currentPassword,
    //   newPassword,
    // });

    // Mock response for now
    console.log('Changing password');
  }

  /**
   * Get active sessions
   */
  async getSessions(): Promise<any[]> {
    // TODO: Replace with actual API call
    // const response = await apiClient.get(API_ENDPOINTS.user.sessions);
    // return response.data;

    // Mock data for now
    return [
      {
        device: "Windows - Chrome",
        location: "Ho Chi Minh City, Vietnam",
        time: "Hiện tại",
        isActive: true,
      },
      {
        device: "iPhone - Safari",
        location: "Ho Chi Minh City, Vietnam",
        time: "2 giờ trước",
        isActive: false,
      },
    ];
  }
}

export const profileService = new ProfileService();
