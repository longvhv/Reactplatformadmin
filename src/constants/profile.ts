/**
 * Profile Constants
 * Static data and configuration for profile page
 */

import { User, Shield, Bell, Clock } from "lucide-react";
import type { MenuItem, NotificationSetting } from "../types/profile";

export const PROFILE_MENU_ITEMS: MenuItem[] = [
  {
    id: "profile",
    label: "Thông tin cá nhân",
    icon: User,
    description: "Quản lý thông tin hồ sơ"
  },
  {
    id: "security",
    label: "Bảo mật",
    icon: Shield,
    description: "Mật khẩu và xác thực"
  },
  {
    id: "notifications",
    label: "Thông báo",
    icon: Bell,
    description: "Cài đặt thông báo"
  },
  {
    id: "activity",
    label: "Hoạt động",
    icon: Clock,
    description: "Lịch sử hoạt động"
  },
];

export const EMAIL_NOTIFICATION_SETTINGS: NotificationSetting[] = [
  { 
    label: "Cập nhật dự án", 
    description: "Nhận thông báo khi có cập nhật dự án",
    enabled: true
  },
  { 
    label: "Bình luận", 
    description: "Khi có người bình luận vào công việc của bạn",
    enabled: true
  },
  { 
    label: "Mentions", 
    description: "Khi có người nhắc đến bạn",
    enabled: true
  },
  { 
    label: "Báo cáo hàng tuần", 
    description: "Nhận báo cáo tổng kết hàng tuần",
    enabled: true
  },
];

export const PUSH_NOTIFICATION_SETTINGS: NotificationSetting[] = [
  { 
    label: "Tin nhắn mới", 
    description: "Nhận thông báo khi có tin nhắn mới",
    enabled: true
  },
  { 
    label: "Deadline sắp tới", 
    description: "Nhắc nhở về deadline sắp tới",
    enabled: true
  },
];
