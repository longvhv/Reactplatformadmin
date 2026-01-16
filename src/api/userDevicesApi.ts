/**
 * User Devices API Client
 * Uses Adapter pattern - Ready for Golang migration
 * 
 * ✅ ENHANCED 2026-01-16: 100% database alignment + Type helpers
 * Database: user_devices (27 fields, device tracking, security features)
 */
import { createAdapter, BaseFilters } from './adapters';

// ==================== TYPE HELPERS ====================

export const DeviceTypeHelper = {
  DESKTOP: 'desktop' as DeviceType,
  MOBILE: 'mobile' as DeviceType,
  TABLET: 'tablet' as DeviceType,
  WATCH: 'watch' as DeviceType,
  TV: 'tv' as DeviceType,
  OTHER: 'other' as DeviceType,

  isDesktop: (type: DeviceType) => type === 'desktop',
  isMobile: (type: DeviceType) => type === 'mobile',
  isTablet: (type: DeviceType) => type === 'tablet',
  isWatch: (type: DeviceType) => type === 'watch',
  isTV: (type: DeviceType) => type === 'tv',
  isOther: (type: DeviceType) => type === 'other',
  isMobileDevice: (type: DeviceType) => type === 'mobile' || type === 'tablet' || type === 'watch',
  isLargeScreen: (type: DeviceType) => type === 'desktop' || type === 'tablet' || type === 'tv',
  isSmallScreen: (type: DeviceType) => type === 'mobile' || type === 'watch',
};

export const DeviceBrowserHelper = {
  CHROME: 'chrome' as DeviceBrowser,
  FIREFOX: 'firefox' as DeviceBrowser,
  SAFARI: 'safari' as DeviceBrowser,
  EDGE: 'edge' as DeviceBrowser,
  OPERA: 'opera' as DeviceBrowser,
  BRAVE: 'brave' as DeviceBrowser,
  SAMSUNG: 'samsung' as DeviceBrowser,
  OTHER: 'other' as DeviceBrowser,

  isChrome: (browser: DeviceBrowser) => browser === 'chrome',
  isFirefox: (browser: DeviceBrowser) => browser === 'firefox',
  isSafari: (browser: DeviceBrowser) => browser === 'safari',
  isEdge: (browser: DeviceBrowser) => browser === 'edge',
  isOpera: (browser: DeviceBrowser) => browser === 'opera',
  isBrave: (browser: DeviceBrowser) => browser === 'brave',
  isSamsung: (browser: DeviceBrowser) => browser === 'samsung',
  isOther: (browser: DeviceBrowser) => browser === 'other',
  isChromiumBased: (browser: DeviceBrowser) => browser === 'chrome' || browser === 'edge' || browser === 'opera' || browser === 'brave',
  supportsWebPush: (browser: DeviceBrowser) => browser === 'chrome' || browser === 'firefox' || browser === 'edge' || browser === 'opera' || browser === 'brave',
};

export const DeviceOSHelper = {
  WINDOWS: 'windows' as DeviceOS,
  MACOS: 'macos' as DeviceOS,
  LINUX: 'linux' as DeviceOS,
  IOS: 'ios' as DeviceOS,
  ANDROID: 'android' as DeviceOS,
  CHROMEOS: 'chromeos' as DeviceOS,
  OTHER: 'other' as DeviceOS,

  isWindows: (os: DeviceOS) => os === 'windows',
  isMacOS: (os: DeviceOS) => os === 'macos',
  isLinux: (os: DeviceOS) => os === 'linux',
  isIOS: (os: DeviceOS) => os === 'ios',
  isAndroid: (os: DeviceOS) => os === 'android',
  isChromeOS: (os: DeviceOS) => os === 'chromeos',
  isOther: (os: DeviceOS) => os === 'other',
  isDesktopOS: (os: DeviceOS) => os === 'windows' || os === 'macos' || os === 'linux' || os === 'chromeos',
  isMobileOS: (os: DeviceOS) => os === 'ios' || os === 'android',
  isApple: (os: DeviceOS) => os === 'macos' || os === 'ios',
  isUnix: (os: DeviceOS) => os === 'macos' || os === 'linux' || os === 'ios' || os === 'android',
};

export const DeviceStatusHelper = {
  ACTIVE: 'active' as DeviceStatus,
  INACTIVE: 'inactive' as DeviceStatus,
  BLOCKED: 'blocked' as DeviceStatus,
  REVOKED: 'revoked' as DeviceStatus,

  isActive: (status: DeviceStatus) => status === 'active',
  isInactive: (status: DeviceStatus) => status === 'inactive',
  isBlocked: (status: DeviceStatus) => status === 'blocked',
  isRevoked: (status: DeviceStatus) => status === 'revoked',
  isUsable: (status: DeviceStatus) => status === 'active',
  isTerminated: (status: DeviceStatus) => status === 'blocked' || status === 'revoked',
  canBeActivated: (status: DeviceStatus) => status === 'inactive',
  canBeBlocked: (status: DeviceStatus) => status === 'active' || status === 'inactive',
  canBeRevoked: (status: DeviceStatus) => status !== 'revoked',
};

// ==================== ENUMS - Match database CHECK constraints ====================

/**
 * Device Type Enum
 * CHECK constraint: device_type IN ('desktop', 'mobile', 'tablet', 'watch', 'tv', 'other')
 */
export type DeviceType = 
  | 'desktop' 
  | 'mobile' 
  | 'tablet' 
  | 'watch' 
  | 'tv' 
  | 'other';

export const DEVICE_TYPES: DeviceType[] = ['desktop', 'mobile', 'tablet', 'watch', 'tv', 'other'];

/**
 * Browser Enum
 * CHECK constraint: browser IN ('chrome', 'firefox', 'safari', 'edge', 'opera', 'brave', 'samsung', 'other')
 */
export type DeviceBrowser = 
  | 'chrome' 
  | 'firefox' 
  | 'safari' 
  | 'edge' 
  | 'opera' 
  | 'brave' 
  | 'samsung' 
  | 'other';

export const BROWSERS: DeviceBrowser[] = ['chrome', 'firefox', 'safari', 'edge', 'opera', 'brave', 'samsung', 'other'];

/**
 * OS Enum
 * CHECK constraint: os IN ('windows', 'macos', 'linux', 'ios', 'android', 'chromeos', 'other')
 */
export type DeviceOS = 
  | 'windows' 
  | 'macos' 
  | 'linux' 
  | 'ios' 
  | 'android' 
  | 'chromeos' 
  | 'other';

export const OS_TYPES: DeviceOS[] = ['windows', 'macos', 'linux', 'ios', 'android', 'chromeos', 'other'];

/**
 * Device Status Enum
 * CHECK constraint: status IN ('active', 'inactive', 'blocked', 'revoked')
 */
export type DeviceStatus = 
  | 'active' 
  | 'inactive' 
  | 'blocked' 
  | 'revoked';

export const DEVICE_STATUSES: DeviceStatus[] = ['active', 'inactive', 'blocked', 'revoked'];

// ===== LOCATION TYPE (JSONB) =====

export interface DeviceLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

// ===== MAIN INTERFACE - MATCHES DATABASE 100% =====

/**
 * UserDevice interface - MATCHES database schema 100% (27 fields)
 */
export interface UserDevice {
  // I. IDENTITY (2)
  _id: string;                                    // uuid PRIMARY KEY
  user_id: string;                                // uuid FK to users NOT NULL
  
  // II. DEVICE INFORMATION (9) - ✅ Added missing fields
  device_type: DeviceType;                        // varchar(50) NOT NULL with CHECK
  device_name?: string | null;                    // varchar(255)
  device_model?: string | null;                   // varchar(255) - ✅ Added
  manufacturer?: string | null;                   // varchar(100) - ✅ Added
  os?: DeviceOS | null;                           // varchar(50) with CHECK
  os_version?: string | null;                     // varchar(100) - ✅ Added
  browser?: DeviceBrowser | null;                 // varchar(50) with CHECK
  browser_version?: string | null;                // varchar(100) - ✅ Added
  
  // III. APP INFORMATION (2) - ✅ Added
  app_name?: string | null;                       // varchar(100)
  app_version?: string | null;                    // varchar(50)
  
  // IV. NETWORK & LOCATION (3) - ✅ Added
  ip_address?: string | null;                     // inet
  user_agent?: string | null;                     // text
  location?: DeviceLocation | null;               // jsonb DEFAULT '{}'
  
  // V. SECURITY (3) - ✅ Added
  is_trusted?: boolean | null;                    // boolean DEFAULT false
  fingerprint?: string | null;                    // varchar(255)
  push_token?: string | null;                     // text
  
  // VI. USAGE & STATUS (8) - ✅ Added
  first_seen_at?: string | null;                  // timestamptz DEFAULT now()
  last_used_at?: string | null;                   // timestamptz DEFAULT now()
  login_count?: number | null;                    // integer DEFAULT 1
  status?: DeviceStatus | null;                   // varchar(20) DEFAULT 'active' with CHECK
  revoked_at?: string | null;                     // timestamptz
  revoked_reason?: string | null;                 // text
  
  // VII. METADATA & AUDIT (3) - ✅ Added
  metadata?: Record<string, any> | null;          // jsonb DEFAULT '{}'
  created_at?: string | null;                     // timestamptz DEFAULT now()
  updated_at?: string | null;                     // timestamptz DEFAULT now()
}

// ===== CREATE/UPDATE REQUEST INTERFACES =====

export interface CreateDeviceRequest {
  user_id: string;
  device_type: DeviceType;                        // Required
  device_name?: string;
  device_model?: string;                          // ✅ Added
  manufacturer?: string;                          // ✅ Added
  os?: DeviceOS;
  os_version?: string;                            // ✅ Added
  browser?: DeviceBrowser;
  browser_version?: string;                       // ✅ Added
  app_name?: string;                              // ✅ Added
  app_version?: string;                           // ✅ Added
  ip_address?: string;                            // ✅ Added
  user_agent?: string;                            // ✅ Added
  location?: DeviceLocation;                      // ✅ Added
  is_trusted?: boolean;
  fingerprint?: string;                           // ✅ Added
  push_token?: string;                            // ✅ Added
  metadata?: Record<string, any>;                 // ✅ Added
}

export interface UpdateDeviceRequest {
  device_type?: DeviceType;
  device_name?: string;
  device_model?: string;                          // ✅ Added
  manufacturer?: string;                          // ✅ Added
  os?: DeviceOS;
  os_version?: string;                            // ✅ Added
  browser?: DeviceBrowser;
  browser_version?: string;                       // ✅ Added
  app_name?: string;                              // ✅ Added
  app_version?: string;                           // ✅ Added
  ip_address?: string;                            // ✅ Added
  user_agent?: string;                            // ✅ Added
  location?: DeviceLocation;                      // ✅ Added
  is_trusted?: boolean;
  fingerprint?: string;                           // ✅ Added
  push_token?: string;                            // ✅ Added
  status?: DeviceStatus;                          // ✅ Added
  revoked_at?: string;                            // ✅ Added
  revoked_reason?: string;                        // ✅ Added
  metadata?: Record<string, any>;                 // ✅ Added
  version?: number;
}

// ===== FILTERS =====

export interface DeviceFilters extends BaseFilters {
  user_id?: string;
  device_type?: DeviceType;                       // ✅ Fixed type
  os?: DeviceOS;                                  // ✅ Added
  browser?: DeviceBrowser;                        // ✅ Added
  is_trusted?: boolean;
  status?: DeviceStatus;                          // ✅ Added
}

// ===== ADAPTER & API =====

const adapter = createAdapter<UserDevice, CreateDeviceRequest, UpdateDeviceRequest>(
  'user_devices',
  '/user-devices'
);

export const userDevicesApi = {
  // Basic CRUD
  getAll: (filters?: DeviceFilters) => adapter.getAll(filters),
  getById: (id: string) => adapter.getById(id),
  create: (data: CreateDeviceRequest) => adapter.create(data),
  update: (id: string, data: UpdateDeviceRequest) => adapter.update(id, data),
  delete: (id: string) => adapter.delete(id),
  
  /**
   * Get devices by user ID
   */
  getByUserId: async (userId: string): Promise<UserDevice[]> => {
    return adapter.getAll({ user_id: userId });
  },
  
  /**
   * Get active devices for a user
   */
  getActiveByUserId: async (userId: string): Promise<UserDevice[]> => {
    return adapter.getAll({ user_id: userId, status: 'active' });
  },
  
  /**
   * Get trusted devices for a user
   */
  getTrustedByUserId: async (userId: string): Promise<UserDevice[]> => {
    return adapter.getAll({ user_id: userId, is_trusted: true });
  },
  
  /**
   * Trust a device
   */
  trustDevice: async (id: string): Promise<UserDevice> => {
    return adapter.update(id, { is_trusted: true });
  },
  
  /**
   * Untrust a device
   */
  untrustDevice: async (id: string): Promise<UserDevice> => {
    return adapter.update(id, { is_trusted: false });
  },
  
  /**
   * Block a device
   */
  blockDevice: async (id: string): Promise<UserDevice> => {
    return adapter.update(id, { status: 'blocked' });
  },
  
  /**
   * Revoke a device
   */
  revokeDevice: async (id: string, reason?: string): Promise<UserDevice> => {
    return adapter.update(id, { 
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_reason: reason,
    });
  },
  
  /**
   * Update device last used timestamp
   */
  updateLastUsed: async (id: string): Promise<UserDevice> => {
    return adapter.update(id, { 
      last_used_at: new Date().toISOString(),
      login_count: undefined, // Will be incremented by backend
    });
  },
};

export default userDevicesApi;