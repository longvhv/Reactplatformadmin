/**
 * User Delegations Module
 * Module quản lý ủy quyền giữa users
 */

import { Users } from 'lucide-react';
import type { Module } from '../../core/ModuleRegistry';

export const UserDelegationsModule: Module = {
  id: 'user-delegations',
  name: 'Ủy quyền',
  description: 'Quản lý ủy quyền giữa các users',
  version: '1.0.0',
  routes: [],
  menu: {
    label: 'Ủy quyền',
    icon: Users,
    path: '/core/user-delegations',
    order: 95,
    group: 'system',
  },
};

export default UserDelegationsModule;