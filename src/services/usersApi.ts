import type { UserData } from '@/components/users/UserDialog';
import { BaseApi, type BaseEntity } from './baseApi';

export type UserWithMeta = UserData & BaseEntity & {
  avatar: string;
  lastActive: string;
};

const STORAGE_KEY = 'vhv_users_data';

const INITIAL_USERS: UserWithMeta[] = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    role: 'admin',
    status: 'active',
    avatar: 'JD',
    lastActive: '2 hours ago',
    department: 'Engineering',
    position: 'Senior Developer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1 (555) 234-5678',
    role: 'user',
    status: 'active',
    avatar: 'JS',
    lastActive: '1 day ago',
    department: 'Marketing',
    position: 'Marketing Manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob@example.com',
    phone: '+1 (555) 345-6789',
    role: 'user',
    status: 'inactive',
    avatar: 'BJ',
    lastActive: '1 week ago',
    department: 'Sales',
    position: 'Sales Representative',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    firstName: 'Alice',
    lastName: 'Williams',
    email: 'alice@example.com',
    phone: '+1 (555) 456-7890',
    role: 'manager',
    status: 'active',
    avatar: 'AW',
    lastActive: '5 minutes ago',
    department: 'Engineering',
    position: 'Engineering Manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie@example.com',
    phone: '+1 (555) 567-8901',
    role: 'user',
    status: 'active',
    avatar: 'CB',
    lastActive: '3 hours ago',
    department: 'Support',
    position: 'Customer Support',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    firstName: 'Diana',
    lastName: 'Prince',
    email: 'diana@example.com',
    phone: '+1 (555) 678-9012',
    role: 'manager',
    status: 'active',
    avatar: 'DP',
    lastActive: '1 hour ago',
    department: 'HR',
    position: 'HR Manager',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 7,
    firstName: 'Ethan',
    lastName: 'Hunt',
    email: 'ethan@example.com',
    phone: '+1 (555) 789-0123',
    role: 'user',
    status: 'active',
    avatar: 'EH',
    lastActive: '2 days ago',
    department: 'Operations',
    position: 'Operations Specialist',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 8,
    firstName: 'Fiona',
    lastName: 'Gallagher',
    email: 'fiona@example.com',
    phone: '+1 (555) 890-1234',
    role: 'user',
    status: 'inactive',
    avatar: 'FG',
    lastActive: '3 weeks ago',
    department: 'Finance',
    position: 'Accountant',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class UsersApi extends BaseApi<UserWithMeta> {
  constructor() {
    super(STORAGE_KEY);
    this.initializeData();
  }

  private initializeData(): void {
    const existing = this.getAll();
    if (existing.length === 0) {
      this.saveToStorage(INITIAL_USERS);
    }
  }

  create(userData: UserData): UserWithMeta {
    const users = this.getAll();
    
    const newUser: UserWithMeta = {
      ...userData,
      id: this.getNextId(users),
      avatar: `${userData.firstName[0]}${userData.lastName[0]}`,
      lastActive: 'Just now',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveToStorage(users);
    return newUser;
  }

  update(id: number, userData: UserData): UserWithMeta | null {
    const users = this.getAll();
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...userData,
      avatar: `${userData.firstName[0]}${userData.lastName[0]}`,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage(users);
    return users[index];
  }

  search(query: string): UserWithMeta[] {
    const users = this.getAll();
    const lowerQuery = query.toLowerCase();

    return users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.department.toLowerCase().includes(lowerQuery) ||
      user.position.toLowerCase().includes(lowerQuery)
    );
  }

  filterByRole(role: string): UserWithMeta[] {
    if (role === 'all') return this.getAll();
    return this.getAll().filter(u => u.role === role);
  }

  filterByStatus(status: string): UserWithMeta[] {
    if (status === 'all') return this.getAll();
    return this.getAll().filter(u => u.status === status);
  }

  getStats() {
    const users = this.getAll();
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        manager: users.filter(u => u.role === 'manager').length,
        user: users.filter(u => u.role === 'user').length,
      },
    };
  }
}

export const usersApi = new UsersApi();