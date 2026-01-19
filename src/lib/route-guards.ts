/**
 * Route Guards and ID Validation Utilities
 * Prevents UUID parsing errors when accessing special route keywords
 */

// Reserved route keywords that should NOT be treated as IDs
const RESERVED_KEYWORDS = [
  'new', 'add', 'create', 'edit',
  'moi', 'them', 'sua', 'tao',  // Vietnamese
] as const;

/**
 * Check if string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if ID is a reserved keyword
 */
export function isReservedKeyword(id: string | undefined): boolean {
  if (!id) return false;
  return RESERVED_KEYWORDS.includes(id as any);
}

/**
 * Check if ID is valid for detail page loading
 * Returns false if ID is undefined, reserved keyword, or invalid UUID
 */
export function isValidDetailId(id: string | undefined): boolean {
  if (!id) return false;
  if (isReservedKeyword(id)) return false;
  return isValidUUID(id);
}

/**
 * Get redirect path for reserved keywords
 */
export function getReservedKeywordRedirect(id: string, basePath: string): string | null {
  if (!isReservedKeyword(id)) return null;
  
  // Map keywords to redirect paths
  const redirectMap: Record<string, string> = {
    'new': `${basePath}/moi`,
    'add': `${basePath}/moi`,
    'create': `${basePath}/moi`,
    'tao': `${basePath}/moi`,
    'them': `${basePath}/them`,
    'moi': `${basePath}/moi`,
    'edit': basePath,
    'sua': basePath,
  };
  
  return redirectMap[id] || basePath;
}
