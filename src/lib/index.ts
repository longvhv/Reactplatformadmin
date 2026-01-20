/**
 * Current User Utilities - Index
 * 
 * Central export for all current user related functionality
 */

// Library functions
export {
  getCurrentUser,
  getCurrentSession,
  getUserProfile,
  getUserDisplayName,
  getUserInitials,
  getUserAvatarUrl,
  updateUserMetadata,
  updateUserProfile,
} from './currentUser';

// Types
export type {
  CurrentUser,
  UserProfile,
} from './currentUser';

// Hook
export { useCurrentUser } from '../hooks/useCurrentUser';
export type { UseCurrentUserReturn } from '../hooks/useCurrentUser';
