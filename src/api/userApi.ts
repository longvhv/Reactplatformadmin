/**
 * User API Client (Alias)
 * @deprecated Use usersApi instead
 */
import { usersApi, User, CreateUserRequest, UpdateUserRequest, UserFilters } from './usersApi';

// Re-export all types
export type { User, CreateUserRequest, UpdateUserRequest, UserFilters };

// Export status type for components
export type UserStatus = User['status'];

export const userApi = usersApi;
export default userApi;