/**
 * Shim Configuration
 * 
 * Khi migration sang Next.js, chỉ cần thay đổi USE_NEXTJS_MODE = true
 * hoặc xóa folder shim và update imports
 */

// Set to false for React Router shim mode
// Set to true when migrating to Next.js (will use real next/navigation)
export const USE_NEXTJS_MODE = false;

// Development flag for debugging
export const DEBUG_SHIM = false;
