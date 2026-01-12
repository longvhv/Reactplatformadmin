/**
 * Navigation Constants
 * Mock data and configurations for navigation
 */

import { Settings, BarChart } from 'lucide-react';

export const MOCK_RECENT_SEARCHES = [
  { id: 1, text: 'Quản lý người dùng', icon: Settings },
  { id: 2, text: 'Báo cáo thống kê', icon: BarChart },
  { id: 3, text: 'Cài đặt hệ thống', icon: Settings },
] as const;

export const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export const KEYBOARD_SHORTCUTS = {
  search: { key: 'k', modifiers: ['cmd', 'ctrl'] },
  toggleSidebar: { key: 's', modifiers: ['cmd', 'ctrl'] },
  focusMode: { key: 'f', modifiers: ['cmd', 'ctrl'] },
} as const;
