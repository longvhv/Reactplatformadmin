/**
 * Database Schema Documentation
 * VHV Platform Database Structure
 * 
 * Includes all production tables:
 * - GLOBAL TABLES: regions, users, user_sessions, user_activities, notifications, settings, tenant_members
 * - TENANT-SPECIFIC TABLES: tenants, system_categories, app_components
 */

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  unique?: boolean;
  default?: string;
  description: string;
}

export interface TableSchema {
  name: string;
  description: string;
  tableType: 'GLOBAL' | 'TENANT-SPECIFIC';
  columns: TableColumn[];
}

export const databaseSchema: TableSchema[] = [
  // ============================================
  // TENANT MANAGEMENT TABLES
  // ============================================
  {
    name: "tenants",
    description: "GLOBAL TABLE: Quản lý multi-tenant với cấu trúc phân cấp (hierarchical)",
    tableType: "GLOBAL",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Khóa chính (Primary Key)"
      },
      {
        name: "code",
        type: "VARCHAR(64)",
        nullable: false,
        unique: true,
        description: "Mã duy nhất (slug): lowercase, alphanumeric, hyphens only"
      },
      {
        name: "name",
        type: "VARCHAR(255)",
        nullable: false,
        description: "Tên hiển thị của tenant"
      },
      {
        name: "parent_tenant_id",
        type: "UUID",
        nullable: true,
        foreignKey: {
          table: "tenants",
          column: "_id"
        },
        description: "Parent tenant cho hierarchy (NULL = root tenant)"
      },
      {
        name: "path",
        type: "TEXT",
        nullable: true,
        description: "Materialized path cho truy vấn hierarchy hiệu quả"
      },
      {
        name: "tier",
        type: "VARCHAR(50)",
        nullable: false,
        default: "'FREE'",
        description: "Subscription tier: FREE, PRO, ENTERPRISE, PARTNER_BASIC, PARTNER_PREMIUM, PARTNER_ELITE, PROVIDER"
      },
      {
        name: "status",
        type: "VARCHAR(20)",
        nullable: false,
        default: "'TRIAL'",
        description: "Lifecycle status: TRIAL, ACTIVE, SUSPENDED, CANCELLED"
      },
      {
        name: "data_region",
        type: "VARCHAR(50)",
        nullable: false,
        default: "'ap-southeast-1'",
        description: "AWS region cho data storage: ap-southeast-1, us-east-1, eu-central-1"
      },
      {
        name: "compliance_level",
        type: "VARCHAR(20)",
        nullable: false,
        default: "'STANDARD'",
        description: "Regulatory compliance level: STANDARD, GDPR, HIPAA, PCI-DSS"
      },
      {
        name: "timezone",
        type: "VARCHAR(50)",
        nullable: false,
        default: "'UTC'",
        description: "Default timezone cho tenant"
      },
      {
        name: "billing_type",
        type: "VARCHAR(20)",
        nullable: false,
        default: "'POSTPAID'",
        description: "Payment method: PREPAID, POSTPAID"
      },
      {
        name: "profile",
        type: "JSONB",
        nullable: false,
        default: "'{}'",
        description: "JSONB: billing_email, phone, contact_person, etc."
      },
      {
        name: "settings",
        type: "JSONB",
        nullable: false,
        default: "'{}'",
        description: "JSONB: max_users, max_storage, features, quotas"
      },
      {
        name: "created_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: record creation"
      },
      {
        name: "updated_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: last update (auto-managed)"
      },
      {
        name: "created_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who created this record"
      },
      {
        name: "updated_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who last updated this record"
      },
      {
        name: "deleted_at",
        type: "TIMESTAMPTZ",
        nullable: true,
        description: "Soft delete timestamp (NULL = active)"
      },
      {
        name: "deleted_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who deleted this record"
      },
      {
        name: "version",
        type: "BIGINT",
        nullable: false,
        default: "1",
        description: "Optimistic locking version counter"
      }
    ]
  },

  // ============================================
  // USER-TENANT RELATIONSHIP (TENANT MEMBERS)
  // ============================================
  {
    name: "tenant_members",
    description: "GLOBAL TABLE: Quản lý mối quan hệ giữa users và tenants (hồ sơ nhân viên tại mỗi tenant)",
    tableType: "GLOBAL",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Khóa chính (Primary Key)"
      },
      {
        name: "tenant_id",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "tenants",
          column: "_id"
        },
        description: "Tenant mà user thuộc về"
      },
      {
        name: "user_id",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "users",
          column: "_id"
        },
        description: "User reference (global identity)"
      },
      {
        name: "employee_code",
        type: "VARCHAR(50)",
        nullable: true,
        description: "Mã nhân viên nội bộ tại tenant (e.g., EMP-001)"
      },
      {
        name: "internal_email",
        type: "VARCHAR(255)",
        nullable: true,
        description: "Email nội bộ công ty (khác với email đăng nhập)"
      },
      {
        name: "job_title",
        type: "VARCHAR(100)",
        nullable: true,
        description: "Chức danh (e.g., Senior Developer, Project Manager)"
      },
      {
        name: "manager_id",
        type: "UUID",
        nullable: true,
        foreignKey: {
          table: "tenant_members",
          column: "_id"
        },
        description: "Quản lý trực tiếp (self-referencing FK)"
      },
      {
        name: "role",
        type: "VARCHAR(50)",
        nullable: false,
        default: "'MEMBER'",
        description: "Vai trò trong tenant: OWNER, ADMIN, MEMBER, VIEWER"
      },
      {
        name: "status",
        type: "VARCHAR(20)",
        nullable: false,
        default: "'ACTIVE'",
        description: "Trạng thái: ACTIVE, RESIGNED, ONBOARDING, SUSPENDED"
      },
      {
        name: "joined_at",
        type: "DATE",
        nullable: true,
        description: "Ngày vào làm"
      },
      {
        name: "left_at",
        type: "DATE",
        nullable: true,
        description: "Ngày nghỉ việc (NULL = đang làm việc)"
      },
      {
        name: "permissions",
        type: "JSONB",
        nullable: true,
        default: "'[]'::jsonb",
        description: "Custom permissions array cho member này"
      },
      {
        name: "metadata",
        type: "JSONB",
        nullable: true,
        default: "'{}'::jsonb",
        description: "Additional metadata (department_id, position, etc.)"
      },
      {
        name: "created_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: record creation"
      },
      {
        name: "updated_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: last update (auto-managed)"
      },
      {
        name: "created_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who created this record"
      },
      {
        name: "updated_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who last updated this record"
      },
      {
        name: "deleted_at",
        type: "TIMESTAMPTZ",
        nullable: true,
        description: "Soft delete timestamp (NULL = active)"
      },
      {
        name: "deleted_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who deleted this record"
      },
      {
        name: "version",
        type: "BIGINT",
        nullable: false,
        default: "1",
        description: "Optimistic locking version counter"
      }
    ]
  },

  // ============================================
  // DEPARTMENT MANAGEMENT TABLES
  // ============================================
  {
    name: "departments",
    description: "TENANT-SPECIFIC: Quản lý phòng ban/bộ phận của từng tenant",
    tableType: "TENANT-SPECIFIC",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Khóa chính (Primary Key)"
      },
      {
        name: "tenant_id",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "tenants",
          column: "_id"
        },
        description: "Tenant mà department thuộc về"
      },
      {
        name: "code",
        type: "VARCHAR(64)",
        nullable: false,
        description: "Mã phòng ban (e.g., ENG, HR, SALES)"
      },
      {
        name: "name",
        type: "VARCHAR(255)",
        nullable: false,
        description: "Tên phòng ban"
      },
      {
        name: "parent_department_id",
        type: "UUID",
        nullable: true,
        foreignKey: {
          table: "departments",
          column: "_id"
        },
        description: "Phòng ban cha (cho hierarchy)"
      },
      {
        name: "manager_id",
        type: "UUID",
        nullable: true,
        foreignKey: {
          table: "tenant_members",
          column: "_id"
        },
        description: "Trưởng phòng (reference tới tenant_members)"
      },
      {
        name: "description",
        type: "TEXT",
        nullable: true,
        description: "Mô tả về phòng ban"
      },
      {
        name: "status",
        type: "VARCHAR(20)",
        nullable: false,
        default: "'ACTIVE'",
        description: "Trạng thái: ACTIVE, INACTIVE, ARCHIVED"
      },
      {
        name: "order",
        type: "INTEGER",
        nullable: true,
        default: "0",
        description: "Thứ tự hiển thị"
      },
      {
        name: "metadata",
        type: "JSONB",
        nullable: true,
        default: "'{}'::jsonb",
        description: "Additional metadata (location, budget, etc.)"
      },
      {
        name: "created_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: record creation"
      },
      {
        name: "updated_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: last update (auto-managed)"
      },
      {
        name: "created_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who created this record"
      },
      {
        name: "updated_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who last updated this record"
      },
      {
        name: "deleted_at",
        type: "TIMESTAMPTZ",
        nullable: true,
        description: "Soft delete timestamp (NULL = active)"
      },
      {
        name: "deleted_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who deleted this record"
      },
      {
        name: "version",
        type: "BIGINT",
        nullable: false,
        default: "1",
        description: "Optimistic locking version counter"
      }
    ]
  },

  {
    name: "department_members",
    description: "TENANT-SPECIFIC: Quản lý mối quan hệ giữa tenant_members và departments",
    tableType: "TENANT-SPECIFIC",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Khóa chính (Primary Key)"
      },
      {
        name: "tenant_id",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "tenants",
          column: "_id"
        },
        description: "Tenant (để isolation)"
      },
      {
        name: "department_id",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "departments",
          column: "_id"
        },
        description: "Department reference"
      },
      {
        name: "tenant_member_id",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "tenant_members",
          column: "_id"
        },
        description: "Tenant member reference"
      },
      {
        name: "is_primary",
        type: "BOOLEAN",
        nullable: false,
        default: "false",
        description: "Department chính của member hay không"
      },
      {
        name: "role_in_department",
        type: "VARCHAR(100)",
        nullable: true,
        description: "Vai trò trong department (optional, e.g., Lead, Member)"
      },
      {
        name: "joined_at",
        type: "DATE",
        nullable: true,
        description: "Ngày tham gia department"
      },
      {
        name: "left_at",
        type: "DATE",
        nullable: true,
        description: "Ngày rời department (NULL = đang làm việc)"
      },
      {
        name: "metadata",
        type: "JSONB",
        nullable: true,
        default: "'{}'::jsonb",
        description: "Additional metadata"
      },
      {
        name: "created_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: record creation"
      },
      {
        name: "updated_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: last update (auto-managed)"
      },
      {
        name: "created_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who created this record"
      },
      {
        name: "updated_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who last updated this record"
      },
      {
        name: "deleted_at",
        type: "TIMESTAMPTZ",
        nullable: true,
        description: "Soft delete timestamp (NULL = active)"
      },
      {
        name: "deleted_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who deleted this record"
      },
      {
        name: "version",
        type: "BIGINT",
        nullable: false,
        default: "1",
        description: "Optimistic locking version counter"
      }
    ]
  },

  // ============================================
  // CATEGORY MANAGEMENT TABLES
  // ============================================
  {
    name: "system_categories",
    description: "TENANT-SPECIFIC: 3-level category hierarchy: Group -> Type -> Category",
    tableType: "TENANT-SPECIFIC",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Khóa chính (Primary Key)"
      },
      {
        name: "tenant_id",
        type: "UUID",
        nullable: false,
        description: "Multi-tenant isolation (use system tenant for shared data)"
      },
      {
        name: "type",
        type: "VARCHAR(100)",
        nullable: false,
        description: "Category level: SYSTEM_CATEGORY_GROUP, SYSTEM_CATEGORY_TYPE, hoặc specific type"
      },
      {
        name: "code",
        type: "VARCHAR(100)",
        nullable: false,
        description: "Unique business code within tenant"
      },
      {
        name: "name",
        type: "VARCHAR(255)",
        nullable: false,
        description: "Display name"
      },
      {
        name: "status",
        type: "INT2",
        nullable: false,
        default: "1",
        description: "Status: 0 = Inactive, 1 = Active"
      },
      {
        name: "order",
        type: "INTEGER",
        nullable: true,
        default: "0",
        description: "Display order"
      },
      {
        name: "description",
        type: "TEXT",
        nullable: true,
        description: "Category description"
      },
      {
        name: "parent_id",
        type: "VARCHAR(100)",
        nullable: true,
        description: "Parent category code for hierarchy"
      },
      {
        name: "group_category_id",
        type: "VARCHAR(100)",
        nullable: true,
        description: "Group category reference"
      },
      {
        name: "collection_name",
        type: "VARCHAR(100)",
        nullable: true,
        default: "'system_categories'",
        description: "Collection name for flexible schema"
      },
      {
        name: "extra_fields",
        type: "JSONB",
        nullable: true,
        default: "'[]'::jsonb",
        description: "Dynamic fields array"
      },
      {
        name: "metadata",
        type: "JSONB",
        nullable: true,
        default: "'{}'::jsonb",
        description: "Additional metadata"
      },
      {
        name: "is_system",
        type: "BOOLEAN",
        nullable: true,
        default: "false",
        description: "System-managed category (read-only)"
      },
      {
        name: "is_editable",
        type: "BOOLEAN",
        nullable: true,
        default: "true",
        description: "Can be edited by users"
      },
      {
        name: "created_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: record creation"
      },
      {
        name: "updated_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: last update (auto-managed)"
      },
      {
        name: "created_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who created this record"
      },
      {
        name: "updated_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who last updated this record"
      },
      {
        name: "deleted_at",
        type: "TIMESTAMPTZ",
        nullable: true,
        description: "Soft delete timestamp (NULL = active)"
      },
      {
        name: "deleted_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who deleted this record"
      },
      {
        name: "version",
        type: "INT",
        nullable: false,
        default: "1",
        description: "Optimistic locking version counter"
      }
    ]
  },

  // ============================================
  // GEOGRAPHIC DATA TABLES
  // ============================================
  {
    name: "regions",
    description: "GLOBAL TABLE: Hierarchical geographic locations - shared across all tenants",
    tableType: "GLOBAL",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Khóa chính (Primary Key)"
      },
      {
        name: "code",
        type: "VARCHAR(50)",
        nullable: false,
        unique: true,
        description: "Unique identifier code (e.g., VN, VN-HN, VN-HN-BA)"
      },
      {
        name: "name",
        type: "VARCHAR(255)",
        nullable: false,
        description: "Display name"
      },
      {
        name: "type",
        type: "VARCHAR(20)",
        nullable: false,
        description: "Geographic level: REGION, NATION, PROVINCE, DISTRICT, COMMUNE"
      },
      {
        name: "order",
        type: "INTEGER",
        nullable: true,
        default: "0",
        description: "Display order"
      },
      {
        name: "status",
        type: "SMALLINT",
        nullable: true,
        default: "1",
        description: "Status: 0 = Inactive, 1 = Active"
      },
      {
        name: "parent_id",
        type: "UUID",
        nullable: true,
        foreignKey: {
          table: "regions",
          column: "_id"
        },
        description: "Reference to parent region (NULL for top-level REGION)"
      },
      {
        name: "start_date",
        type: "DATE",
        nullable: true,
        description: "Date when this region became valid"
      },
      {
        name: "end_date",
        type: "DATE",
        nullable: true,
        description: "Date when this region became invalid (NULL = still valid)"
      },
      {
        name: "history_data",
        type: "JSONB",
        nullable: true,
        default: "'[]'::jsonb",
        description: "Historical changes tracking"
      },
      {
        name: "metadata",
        type: "JSONB",
        nullable: true,
        default: "'{}'::jsonb",
        description: "Additional metadata (coordinates, population, etc.)"
      },
      {
        name: "is_system",
        type: "BOOLEAN",
        nullable: true,
        default: "false",
        description: "System-managed region (read-only)"
      },
      {
        name: "is_editable",
        type: "BOOLEAN",
        nullable: true,
        default: "true",
        description: "Can be edited by users"
      },
      {
        name: "created_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: record creation"
      },
      {
        name: "updated_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: last update (auto-managed)"
      },
      {
        name: "created_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who created this record"
      },
      {
        name: "updated_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who last updated this record"
      },
      {
        name: "deleted_at",
        type: "TIMESTAMPTZ",
        nullable: true,
        description: "Soft delete timestamp (NULL = active)"
      },
      {
        name: "deleted_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who deleted this record"
      },
      {
        name: "version",
        type: "INT",
        nullable: false,
        default: "1",
        description: "Optimistic locking version counter"
      }
    ]
  },

  // ============================================
  // APPLICATION COMPONENT TABLES
  // ============================================
  {
    name: "app_components",
    description: "TENANT-SPECIFIC: Application component hierarchy management (menus, modules, pages, widgets)",
    tableType: "TENANT-SPECIFIC",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Khóa chính (Primary Key)"
      },
      {
        name: "tenant_id",
        type: "UUID",
        nullable: false,
        description: "Multi-tenant isolation"
      },
      {
        name: "code",
        type: "VARCHAR(100)",
        nullable: false,
        description: "Unique business code within tenant"
      },
      {
        name: "name",
        type: "VARCHAR(255)",
        nullable: false,
        description: "Display name"
      },
      {
        name: "type",
        type: "VARCHAR(50)",
        nullable: false,
        default: "'TYPE_COMPONENT'",
        description: "Component classification type"
      },
      {
        name: "component_id",
        type: "VARCHAR(100)",
        nullable: false,
        description: "Component identifier"
      },
      {
        name: "component_type",
        type: "VARCHAR(50)",
        nullable: false,
        default: "'layout'",
        description: "Component type: layout, module, page, widget, form"
      },
      {
        name: "route",
        type: "VARCHAR(255)",
        nullable: true,
        description: "Route path for navigation"
      },
      {
        name: "icon",
        type: "VARCHAR(100)",
        nullable: true,
        description: "Icon identifier (lucide-react)"
      },
      {
        name: "description",
        type: "TEXT",
        nullable: true,
        description: "Component description"
      },
      {
        name: "parent_id",
        type: "UUID",
        nullable: true,
        foreignKey: {
          table: "app_components",
          column: "_id"
        },
        description: "Parent component for hierarchy"
      },
      {
        name: "permissions",
        type: "JSONB",
        nullable: true,
        default: "'[]'::jsonb",
        description: "Required permissions array"
      },
      {
        name: "is_visible",
        type: "BOOLEAN",
        nullable: true,
        default: "true",
        description: "Component visibility in UI"
      },
      {
        name: "order",
        type: "INTEGER",
        nullable: true,
        default: "0",
        description: "Display order"
      },
      {
        name: "status",
        type: "SMALLINT",
        nullable: true,
        default: "1",
        description: "Status: 0 = Inactive, 1 = Active"
      },
      {
        name: "metadata",
        type: "JSONB",
        nullable: true,
        default: "'{}'::jsonb",
        description: "Additional metadata (config, settings, etc.)"
      },
      {
        name: "is_system",
        type: "BOOLEAN",
        nullable: true,
        default: "false",
        description: "System-managed component (read-only)"
      },
      {
        name: "is_editable",
        type: "BOOLEAN",
        nullable: true,
        default: "true",
        description: "Can be edited by users"
      },
      {
        name: "created_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: record creation"
      },
      {
        name: "updated_at",
        type: "TIMESTAMPTZ",
        nullable: false,
        default: "NOW()",
        description: "Timestamp: last update (auto-managed)"
      },
      {
        name: "created_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who created this record"
      },
      {
        name: "updated_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who last updated this record"
      },
      {
        name: "deleted_at",
        type: "TIMESTAMPTZ",
        nullable: true,
        description: "Soft delete timestamp (NULL = active)"
      },
      {
        name: "deleted_by",
        type: "UUID",
        nullable: true,
        description: "User UUID who deleted this record"
      },
      {
        name: "version",
        type: "INT",
        nullable: false,
        default: "1",
        description: "Optimistic locking version counter"
      }
    ]
  },

  // ============================================
  // USER MANAGEMENT TABLES
  // ============================================
  {
    name: "users",
    description: "GLOBAL TABLE: Quản lý thông tin người dùng trong hệ thống",
    tableType: "GLOBAL",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Mã định danh duy nhất của người dùng"
      },
      {
        name: "email",
        type: "VARCHAR(255)",
        nullable: false,
        unique: true,
        description: "Địa chỉ email của người dùng (dùng để đăng nhập)"
      },
      {
        name: "passwordHash",
        type: "VARCHAR(255)",
        nullable: false,
        description: "Mật khẩu đã được mã hóa (bcrypt)"
      },
      {
        name: "name",
        type: "VARCHAR(255)",
        nullable: false,
        description: "Họ và tên của người dùng"
      },
      {
        name: "avatar",
        type: "TEXT",
        nullable: true,
        description: "URL ảnh đại diện"
      },
      {
        name: "role",
        type: "VARCHAR(50)",
        nullable: false,
        default: "'user'",
        description: "Vai trò người dùng: admin, user, moderator"
      },
      {
        name: "status",
        type: "VARCHAR(20)",
        nullable: false,
        default: "'active'",
        description: "Trạng thái tài khoản: active, inactive, suspended"
      },
      {
        name: "phone",
        type: "VARCHAR(20)",
        nullable: true,
        description: "Số điện thoại"
      },
      {
        name: "location",
        type: "VARCHAR(255)",
        nullable: true,
        description: "Địa chỉ"
      },
      {
        name: "department",
        type: "VARCHAR(100)",
        nullable: true,
        description: "Phòng ban"
      },
      {
        name: "position",
        type: "VARCHAR(100)",
        nullable: true,
        description: "Chức vụ"
      },
      {
        name: "bio",
        type: "TEXT",
        nullable: true,
        description: "Giới thiệu bản thân"
      },
      {
        name: "emailVerified",
        type: "BOOLEAN",
        nullable: false,
        default: "false",
        description: "Trạng thái xác thực email"
      },
      {
        name: "lastLoginAt",
        type: "TIMESTAMP",
        nullable: true,
        description: "Thời điểm đăng nhập gần nhất"
      },
      {
        name: "createdAt",
        type: "TIMESTAMP",
        nullable: false,
        default: "CURRENT_TIMESTAMP",
        description: "Thời điểm tạo tài khoản"
      },
      {
        name: "updatedAt",
        type: "TIMESTAMP",
        nullable: false,
        default: "CURRENT_TIMESTAMP",
        description: "Thời điểm cập nhật cuối cùng"
      }
    ]
  },
  {
    name: "user_sessions",
    description: "GLOBAL TABLE: Quản lý phiên đăng nhập của người dùng",
    tableType: "GLOBAL",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Mã định danh phiên đăng nhập"
      },
      {
        name: "userId",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "users",
          column: "_id"
        },
        description: "Mã người dùng"
      },
      {
        name: "token",
        type: "VARCHAR(500)",
        nullable: false,
        unique: true,
        description: "JWT token"
      },
      {
        name: "ipAddress",
        type: "VARCHAR(45)",
        nullable: true,
        description: "Địa chỉ IP đăng nhập"
      },
      {
        name: "userAgent",
        type: "TEXT",
        nullable: true,
        description: "Thông tin trình duyệt/thiết bị"
      },
      {
        name: "deviceType",
        type: "VARCHAR(50)",
        nullable: true,
        description: "Loại thiết bị: desktop, mobile, tablet"
      },
      {
        name: "expiresAt",
        type: "TIMESTAMP",
        nullable: false,
        description: "Thời điểm hết hạn"
      },
      {
        name: "createdAt",
        type: "TIMESTAMP",
        nullable: false,
        default: "CURRENT_TIMESTAMP",
        description: "Thời điểm tạo phiên"
      }
    ]
  },
  {
    name: "user_activities",
    description: "GLOBAL TABLE: Ghi lại các hoạt động của người dùng trong hệ thống",
    tableType: "GLOBAL",
    columns: [
      {
        name: "_id",
        type: "BIGSERIAL",
        nullable: false,
        primaryKey: true,
        description: "Mã định danh hoạt động"
      },
      {
        name: "userId",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "users",
          column: "_id"
        },
        description: "Mã người dùng thực hiện hoạt động"
      },
      {
        name: "action",
        type: "VARCHAR(100)",
        nullable: false,
        description: "Loại hành động: login, logout, create, update, delete"
      },
      {
        name: "resourceType",
        type: "VARCHAR(100)",
        nullable: true,
        description: "Loại tài nguyên bị tác động: user, post, comment"
      },
      {
        name: "resourceId",
        type: "VARCHAR(255)",
        nullable: true,
        description: "ID của tài nguyên bị tác động"
      },
      {
        name: "metadata",
        type: "JSONB",
        nullable: true,
        description: "Thông tin bổ sung dưới dạng JSON"
      },
      {
        name: "ipAddress",
        type: "VARCHAR(45)",
        nullable: true,
        description: "Địa chỉ IP thực hiện hành động"
      },
      {
        name: "createdAt",
        type: "TIMESTAMP",
        nullable: false,
        default: "CURRENT_TIMESTAMP",
        description: "Thời điểm thực hiện hành động"
      }
    ]
  },
  {
    name: "notifications",
    description: "GLOBAL TABLE: Quản lý thông báo gửi tới người dùng",
    tableType: "GLOBAL",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Mã định danh thông báo"
      },
      {
        name: "userId",
        type: "UUID",
        nullable: false,
        foreignKey: {
          table: "users",
          column: "_id"
        },
        description: "Mã người dùng nhận thông báo"
      },
      {
        name: "type",
        type: "VARCHAR(50)",
        nullable: false,
        description: "Loại thông báo: info, warning, success, error"
      },
      {
        name: "title",
        type: "VARCHAR(255)",
        nullable: false,
        description: "Tiêu đề thông báo"
      },
      {
        name: "message",
        type: "TEXT",
        nullable: false,
        description: "Nội dung thông báo"
      },
      {
        name: "read",
        type: "BOOLEAN",
        nullable: false,
        default: "false",
        description: "Trạng thái đã đọc"
      },
      {
        name: "link",
        type: "VARCHAR(500)",
        nullable: true,
        description: "Đường dẫn liên quan đến thông báo"
      },
      {
        name: "createdAt",
        type: "TIMESTAMP",
        nullable: false,
        default: "CURRENT_TIMESTAMP",
        description: "Thời điểm tạo thông báo"
      },
      {
        name: "readAt",
        type: "TIMESTAMP",
        nullable: true,
        description: "Thời điểm đọc thông báo"
      }
    ]
  },
  {
    name: "settings",
    description: "GLOBAL TABLE: Lưu trữ cài đặt cá nhân của người dùng",
    tableType: "GLOBAL",
    columns: [
      {
        name: "_id",
        type: "UUID",
        nullable: false,
        primaryKey: true,
        default: "gen_random_uuid()",
        description: "Mã định danh cài đặt"
      },
      {
        name: "userId",
        type: "UUID",
        nullable: false,
        unique: true,
        foreignKey: {
          table: "users",
          column: "_id"
        },
        description: "Mã người dùng"
      },
      {
        name: "theme",
        type: "VARCHAR(20)",
        nullable: false,
        default: "'system'",
        description: "Chủ đề giao diện: light, dark, system"
      },
      {
        name: "language",
        type: "VARCHAR(10)",
        nullable: false,
        default: "'vi'",
        description: "Ngôn ngữ: vi, en, zh, ja, ko, es"
      },
      {
        name: "emailNotifications",
        type: "BOOLEAN",
        nullable: false,
        default: "true",
        description: "Bật/tắt thông báo qua email"
      },
      {
        name: "pushNotifications",
        type: "BOOLEAN",
        nullable: false,
        default: "true",
        description: "Bật/tắt thông báo đẩy"
      },
      {
        name: "twoFactorEnabled",
        type: "BOOLEAN",
        nullable: false,
        default: "false",
        description: "Trạng thái xác thực hai yếu tố"
      },
      {
        name: "preferences",
        type: "JSONB",
        nullable: true,
        description: "Các tùy chỉnh khác dưới dạng JSON"
      },
      {
        name: "createdAt",
        type: "TIMESTAMP",
        nullable: false,
        default: "CURRENT_TIMESTAMP",
        description: "Thời điểm tạo"
      },
      {
        name: "updatedAt",
        type: "TIMESTAMP",
        nullable: false,
        default: "CURRENT_TIMESTAMP",
        description: "Thời điểm cập nhật"
      }
    ]
  }
];

/**
 * ERD Mermaid Diagram Definition
 * Updated with all production tables including tenants, system_categories, regions, app_components
 */
export const erdDiagram = `graph TB
    %% ============================================
    %% TENANT MANAGEMENT
    %% ============================================
    tenants[tenants<br/>GLOBAL]
    
    %% ============================================
    %% CATEGORY & COMPONENT MANAGEMENT
    %% ============================================
    system_categories[system_categories<br/>TENANT-SPECIFIC]
    app_components[app_components<br/>TENANT-SPECIFIC]
    
    %% ============================================
    %% GEOGRAPHIC DATA
    %% ============================================
    regions[regions<br/>GLOBAL]
    
    %% ============================================
    %% USER MANAGEMENT
    %% ============================================
    users[users<br/>GLOBAL]
    user_sessions[user_sessions<br/>GLOBAL]
    user_activities[user_activities<br/>GLOBAL]
    notifications[notifications<br/>GLOBAL]
    settings[settings<br/>GLOBAL]
    tenant_members[tenant_members<br/>GLOBAL]
    
    %% ============================================
    %% RELATIONSHIPS
    %% ============================================
    
    %% Tenant hierarchy
    tenants -->|parent_tenant_id| tenants
    
    %% Tenant-specific data isolation
    tenants -.->|tenant_id| system_categories
    tenants -.->|tenant_id| app_components
    
    %% Category hierarchy
    system_categories -->|parent_id| system_categories
    
    %% Component hierarchy
    app_components -->|parent_id| app_components
    
    %% Region hierarchy
    regions -->|parent_id| regions
    
    %% User relationships
    users -->|userId| user_sessions
    users -->|userId| user_activities
    users -->|userId| notifications
    users -->|userId| settings
    users -->|user_id| tenant_members
    
    %% Tenant-member relationships
    tenants -->|tenant_id| tenant_members
    tenant_members -->|manager_id| tenant_members
    
    %% ============================================
    %% STYLING
    %% ============================================
    classDef globalTable fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff,rx:8px
    classDef tenantTable fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff,rx:8px
    
    class tenants,regions,users,user_sessions,user_activities,notifications,settings,tenant_members globalTable
    class system_categories,app_components tenantTable
`;