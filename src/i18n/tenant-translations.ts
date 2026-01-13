/**
 * Tenant Management Translations
 * Extended for new database schema with hierarchical support
 */

export const tenantTranslationsEN = {
  title: 'Tenant Management',
  subtitle: 'Manage organizations and subscription plans',
  searchPlaceholder: 'Search tenants by name, code, or email...',
  
  // Tabs
  tenantsTab: 'Tenants',
  analyticsTab: 'Analytics',
  plansTab: 'Plans',
  billingTab: 'Billing',
  hierarchyTab: 'Hierarchy',
  
  // Actions
  addTenant: 'Add Tenant',
  editTenant: 'Edit Tenant',
  createTenant: 'Create Tenant',
  confirmDelete: 'Are you sure you want to delete this tenant?',
  
  // Filters
  filters: 'Filters',
  clearFilters: 'Clear Filters',
  allStatus: 'All Status',
  allTiers: 'All Tiers',
  allRegions: 'All Regions',
  allCompliance: 'All Compliance',
  allBilling: 'All Billing Types',
  allHierarchy: 'All Hierarchy',
  childTenants: 'Child Tenants Only',
  rootTenants: 'Root Tenants Only',
  
  // Stats
  totalTenants: 'Total Tenants',
  activeTenants: 'Active',
  trialTenants: 'Trial',
  enterpriseTenants: 'Enterprise',
  showing: 'Showing',
  
  // Form tabs
  tabs: {
    basic: 'Basic Information',
    infrastructure: 'Infrastructure',
    subscription: 'Subscription',
    settings: 'Settings',
  },
  
  // Fields
  name: 'Tenant Name',
  code: 'Tenant Code',
  domain: 'Custom Domain',
  tier: 'Subscription Tier',
  status: 'Status',
  statusLabel: 'Status',
  billingType: 'Billing Type',
  dataRegion: 'Data Region',
  complianceLevel: 'Compliance Level',
  timezone: 'Timezone',
  parentTenant: 'Parent Tenant',
  noParent: 'No Parent (Root Tenant)',
  billingEmail: 'Billing Email',
  phone: 'Phone Number',
  contactPerson: 'Contact Person',
  industry: 'Industry',
  companySize: 'Company Size',
  country: 'Country',
  address: 'Address',
  taxId: 'Tax ID',
  maxUsers: 'Max Users',
  maxStorage: 'Max Storage',
  subscriptionEndDate: 'Subscription End Date',
  
  // Advanced settings
  advancedSettings: 'Advanced Settings',
  mfaEnforced: 'Enforce Multi-Factor Authentication',
  ssoEnabled: 'Enable Single Sign-On',
  customBranding: 'Allow Custom Branding',
  apiAccess: 'Enable API Access',
  
  // Status values
  status: {
    TRIAL: 'Trial',
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    CANCELLED: 'Cancelled',
    active: 'Active',
    trial: 'Trial',
    suspended: 'Suspended',
    cancelled: 'Cancelled',
  },
  
  // Tier values
  tier: {
    FREE: 'Free',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
    PARTNER_BASIC: 'Partner Basic',
    PARTNER_PREMIUM: 'Partner Premium',
    PARTNER_ELITE: 'Partner Elite',
    PROVIDER: 'Provider',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  },
  
  // Sections
  basicInformation: 'Basic Information',
  contactInformation: 'Contact Information',
  subscriptionAndLimits: 'Subscription & Limits',
  subscriptionAndBilling: 'Subscription & Billing',
  infrastructure: 'Infrastructure Settings',
  region: 'Region',
  compliance: 'Compliance',
  billing: 'Billing',
  hierarchy: 'Hierarchy',
  
  // Placeholders
  namePlaceholder: 'e.g., Acme Corporation',
  codePlaceholder: 'e.g., acme-corp',
  slugPlaceholder: 'e.g., acme-corp',
  domainPlaceholder: 'e.g., acme.example.com',
  emailPlaceholder: 'billing@example.com',
  phonePlaceholder: '+1 (555) 000-0000',
  
  // Help text
  codeHelp: 'Lowercase letters, numbers, and hyphens only',
  slugHelp: 'Lowercase letters, numbers, and hyphens only',
  
  // Descriptions
  addTenantDescription: 'Create a new organization tenant',
  editTenantDescription: 'Update tenant information and settings',
  
  // UI labels
  users: 'Users',
  storage: 'Storage',
  created: 'Created',
  updated: 'Updated',
  until: 'until',
  monthly: 'Monthly',
  yearly: 'Yearly',
  hasParent: 'Has parent organization',
  
  // Hierarchy
  hierarchyView: 'Tenant Hierarchy',
  noTenants: 'No tenants found',
  
  // Errors
  errors: {
    nameRequired: 'Tenant name is required',
    codeRequired: 'Tenant code is required',
    codeInvalid: 'Code can only contain lowercase letters, numbers, and hyphens',
    slugRequired: 'Slug is required',
    slugInvalid: 'Slug can only contain lowercase letters, numbers, and hyphens',
    emailRequired: 'Billing email is required',
    emailInvalid: 'Invalid email address',
    maxUsersInvalid: 'Max users must be at least 1',
    maxStorageInvalid: 'Max storage must be at least 1',
  },
  
  // Messages
  noResults: 'No tenants found',
  billingComingSoon: 'Billing feature coming soon',
};

export const tenantTranslationsVI = {
  title: 'Quản lý Tenants',
  subtitle: 'Quản lý các tổ chức và gói dịch vụ',
  searchPlaceholder: 'Tìm kiếm tenant theo tên, mã hoặc email...',
  
  tenantsTab: 'Tenants',
  analyticsTab: 'Phân tích',
  plansTab: 'Gói dịch vụ',
  billingTab: 'Thanh toán',
  hierarchyTab: 'Phân cấp',
  
  addTenant: 'Thêm Tenant',
  editTenant: 'Sửa Tenant',
  createTenant: 'Tạo Tenant',
  confirmDelete: 'Bạn có chắc muốn xóa tenant này?',
  
  filters: 'Bộ lọc',
  clearFilters: 'Xóa bộ lọc',
  allStatus: 'Tất cả trạng thái',
  allTiers: 'Tất cả gói',
  allRegions: 'Tất cả khu vực',
  allCompliance: 'Tất cả tuân thủ',
  allBilling: 'Tất cả loại thanh toán',
  allHierarchy: 'Tất cả phân cấp',
  childTenants: 'Chỉ tenant con',
  rootTenants: 'Chỉ tenant gốc',
  
  totalTenants: 'Tổng số Tenants',
  activeTenants: 'Đang hoạt động',
  trialTenants: 'Dùng thử',
  enterpriseTenants: 'Enterprise',
  showing: 'Hiển thị',
  
  tabs: {
    basic: 'Thông tin cơ bản',
    infrastructure: 'Hạ tầng',
    subscription: 'Gói dịch vụ',
    settings: 'Cài đặt',
  },
  
  name: 'Tên Tenant',
  code: 'Mã Tenant',
  domain: 'Tên miền',
  tier: 'Gói dịch vụ',
  status: 'Trạng thái',
  statusLabel: 'Trạng thái',
  billingType: 'Loại thanh toán',
  dataRegion: 'Khu vực dữ liệu',
  complianceLevel: 'Mức độ tuân thủ',
  timezone: 'Múi giờ',
  parentTenant: 'Tenant cha',
  noParent: 'Không có tenant cha (Tenant gốc)',
  billingEmail: 'Email thanh toán',
  phone: 'Số điện thoại',
  contactPerson: 'Người liên hệ',
  industry: 'Ngành nghề',
  companySize: 'Quy mô công ty',
  country: 'Quốc gia',
  address: 'Địa chỉ',
  taxId: 'Mã số thuế',
  maxUsers: 'Số người dùng tối đa',
  maxStorage: 'Dung lượng tối đa',
  subscriptionEndDate: 'Ngày hết hạn',
  
  advancedSettings: 'Cài đặt nâng cao',
  mfaEnforced: 'Bắt buộc xác thực 2 lớp',
  ssoEnabled: 'Bật đăng nhập một lần (SSO)',
  customBranding: 'Cho phép tùy chỉnh thương hiệu',
  apiAccess: 'Cho phép truy cập API',
  
  status: {
    TRIAL: 'Dùng thử',
    ACTIVE: 'Hoạt động',
    SUSPENDED: 'Tạm dừng',
    CANCELLED: 'Đã hủy',
    active: 'Hoạt động',
    trial: 'Dùng thử',
    suspended: 'Tạm dừng',
    cancelled: 'Đã hủy',
  },
  
  tier: {
    FREE: 'Miễn phí',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
    PARTNER_BASIC: 'Đối tác Cơ bản',
    PARTNER_PREMIUM: 'Đối tác Premium',
    PARTNER_ELITE: 'Đối tác Elite',
    PROVIDER: 'Nhà cung cấp',
    starter: 'Khởi đầu',
    professional: 'Chuyên nghiệp',
    enterprise: 'Doanh nghiệp',
  },
  
  basicInformation: 'Thông tin cơ bản',
  contactInformation: 'Thông tin liên hệ',
  subscriptionAndLimits: 'Gói dịch vụ & Giới hạn',
  subscriptionAndBilling: 'Gói dịch vụ & Thanh toán',
  infrastructure: 'Cài đặt hạ tầng',
  region: 'Khu vực',
  compliance: 'Tuân thủ',
  billing: 'Thanh toán',
  hierarchy: 'Phân cấp',
  
  namePlaceholder: 'vd: Công ty TNHH ABC',
  codePlaceholder: 'vd: abc-company',
  slugPlaceholder: 'vd: abc-company',
  domainPlaceholder: 'vd: abc.example.com',
  emailPlaceholder: 'billing@example.com',
  phonePlaceholder: '+84 123 456 789',
  
  codeHelp: 'Chỉ chữ thường, số và dấu gạch ngang',
  slugHelp: 'Chỉ chữ thường, số và dấu gạch ngang',
  
  addTenantDescription: 'Tạo tổ chức tenant mới',
  editTenantDescription: 'Cập nhật thông tin và cài đặt tenant',
  
  users: 'Người dùng',
  storage: 'Dung lượng',
  created: 'Tạo lúc',
  updated: 'Cập nhật',
  until: 'đến',
  monthly: 'Hàng tháng',
  yearly: 'Hàng năm',
  hasParent: 'Có tổ chức cha',
  
  hierarchyView: 'Phân cấp Tenant',
  noTenants: 'Không tìm thấy tenant',
  
  errors: {
    nameRequired: 'Tên tenant là bắt buộc',
    codeRequired: 'Mã tenant là bắt buộc',
    codeInvalid: 'Mã chỉ được chứa chữ thường, số và dấu gạch ngang',
    slugRequired: 'Slug là bắt buộc',
    slugInvalid: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
    emailRequired: 'Email thanh toán là bắt buộc',
    emailInvalid: 'Địa chỉ email không hợp lệ',
    maxUsersInvalid: 'Số người dùng tối đa phải ít nhất là 1',
    maxStorageInvalid: 'Dung lượng tối đa phải ít nhất là 1',
  },
  
  noResults: 'Không tìm thấy tenant nào',
  billingComingSoon: 'Tính năng thanh toán sẽ sớm ra mắt',
};
