/**
 * Roles Table Schema
 * TENANT-SPECIFIC: Role management with permissions
 */

import type { TableSchema } from './database-schema';

export const rolesSchema: TableSchema = {
  name: "roles",
  description: "TENANT-SPECIFIC: Quản lý vai trò và quyền hạn (NULL tenant_id = System roles)",
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
      nullable: true,
      foreignKey: {
        table: "tenants",
        column: "_id"
      },
      description: "Tenant reference (NULL = system role, shared across all tenants)"
    },
    {
      name: "code",
      type: "VARCHAR(100)",
      nullable: false,
      unique: true,
      description: "Unique role code (e.g., SUPER_ADMIN, TENANT_ADMIN, MANAGER)"
    },
    {
      name: "name",
      type: "VARCHAR(255)",
      nullable: false,
      description: "Display name of the role"
    },
    {
      name: "description",
      type: "TEXT",
      nullable: true,
      description: "Detailed description of the role"
    },
    {
      name: "level",
      type: "INTEGER",
      nullable: false,
      default: "1",
      description: "Role hierarchy level (higher = more powerful, 1-100)"
    },
    {
      name: "permissions",
      type: "JSONB",
      nullable: false,
      default: "'[]'::jsonb",
      description: "Array of permission strings (e.g., ['users:read', 'users:write'])"
    },
    {
      name: "is_system",
      type: "BOOLEAN",
      nullable: false,
      default: "false",
      description: "System-managed role (cannot be deleted)"
    },
    {
      name: "is_active",
      type: "BOOLEAN",
      nullable: false,
      default: "true",
      description: "Role is active and can be assigned"
    },
    {
      name: "metadata",
      type: "JSONB",
      nullable: true,
      default: "'{}'::jsonb",
      description: "Additional metadata (color, icon, etc.)"
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
    }
  ]
};

export default rolesSchema;
