/**
 * Roles Seed Data
 * Theo chuẩn docs/Collections.md line 212-221
 */

import { Role } from '../api/rolesApi';

export const rolesSeed: Role[] = [
  {
    _id: 'demo-role-super-admin',
    tenant_id: 'demo-tenant-001',
    name: 'Super Admin',
    description: 'Quản trị viên tối cao - toàn quyền trên hệ thống',
    type: 'SYSTEM',
    permission_codes: ['*'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    _id: 'demo-role-admin',
    tenant_id: 'demo-tenant-001',
    name: 'Admin',
    description: 'Quản trị viên - quản lý người dùng và cấu hình',
    type: 'SYSTEM',
    permission_codes: [
      'user:view',
      'user:create',
      'user:update',
      'user:delete',
      'role:view',
      'role:create',
      'role:update',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    _id: 'demo-role-editor',
    tenant_id: 'demo-tenant-001',
    name: 'Editor',
    description: 'Người biên tập - tạo và chỉnh sửa nội dung',
    type: 'SYSTEM',
    permission_codes: ['content:view', 'content:create', 'content:update'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    _id: 'demo-role-viewer',
    tenant_id: 'demo-tenant-001',
    name: 'Viewer',
    description: 'Người xem - chỉ đọc thông tin',
    type: 'SYSTEM',
    permission_codes: ['content:view', 'user:view'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  // Custom roles
  {
    _id: 'demo-role-hr-manager',
    tenant_id: 'demo-tenant-001',
    name: 'HR Manager',
    description: 'Quản lý nhân sự - quản lý thông tin nhân viên',
    type: 'CUSTOM',
    permission_codes: [
      'employee:view',
      'employee:create',
      'employee:update',
      'attendance:view',
      'leave:approve',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
  {
    _id: 'demo-role-accountant',
    tenant_id: 'demo-tenant-001',
    name: 'Accountant',
    description: 'Kế toán - quản lý tài chính và hóa đơn',
    type: 'CUSTOM',
    permission_codes: [
      'invoice:view',
      'invoice:create',
      'invoice:update',
      'payment:view',
      'report:view',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
  },
];
