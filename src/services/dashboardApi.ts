import { BaseApi, type BaseEntity } from './baseApi';

export interface Stat extends BaseEntity {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
  bgColor: string;
}

export interface Activity extends BaseEntity {
  title: string;
  description: string;
  time: string;
  type: 'user' | 'system' | 'alert' | 'update';
}

const STORAGE_KEY_STATS = 'vhv_dashboard_stats';
const STORAGE_KEY_ACTIVITIES = 'vhv_dashboard_activities';

const INITIAL_STATS: Stat[] = [
  {
    id: 1,
    title: 'dashboard.users',
    value: '1,234',
    change: '+12.3%',
    trend: 'up',
    icon: 'Users',
    color: 'text-[#6366f1]',
    bgColor: 'bg-[#6366f1]/10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'dashboard.analytics',
    value: '5,678',
    change: '+8.1%',
    trend: 'up',
    icon: 'Activity',
    color: 'text-[#3b82f6]',
    bgColor: 'bg-[#3b82f6]/10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'dashboard.growth',
    value: '+12%',
    change: '+2.4%',
    trend: 'up',
    icon: 'TrendingUp',
    color: 'text-[#10b981]',
    bgColor: 'bg-[#10b981]/10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'dashboard.alerts',
    value: '23',
    change: '-4.2%',
    trend: 'down',
    icon: 'Bell',
    color: 'text-[#f59e0b]',
    bgColor: 'bg-[#f59e0b]/10',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 1,
    title: 'New user registered',
    description: 'John Doe created a new account',
    time: '1h ago',
    type: 'user',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    title: 'System update',
    description: 'System was updated to version 2.1.0',
    time: '2h ago',
    type: 'system',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 3,
    title: 'New alert',
    description: 'High CPU usage detected',
    time: '3h ago',
    type: 'alert',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: 4,
    title: 'Data backup completed',
    description: 'Backup completed successfully',
    time: '4h ago',
    type: 'system',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: 5,
    title: 'Profile updated',
    description: 'User profile information was updated',
    time: '5h ago',
    type: 'update',
    createdAt: new Date(Date.now() - 18000000).toISOString(),
    updatedAt: new Date(Date.now() - 18000000).toISOString(),
  },
];

class StatsApi extends BaseApi<Stat> {
  constructor() {
    super(STORAGE_KEY_STATS);
    this.initializeData();
  }

  private initializeData(): void {
    const existing = this.getAll();
    if (existing.length === 0) {
      this.saveToStorage(INITIAL_STATS);
    }
  }

  updateStat(id: number, updates: Partial<Omit<Stat, 'id' | 'createdAt'>>): Stat | null {
    const stats = this.getAll();
    const index = stats.findIndex(s => s.id === id);
    
    if (index === -1) return null;

    stats[index] = {
      ...stats[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage(stats);
    return stats[index];
  }
}

class ActivitiesApi extends BaseApi<Activity> {
  constructor() {
    super(STORAGE_KEY_ACTIVITIES);
    this.initializeData();
  }

  private initializeData(): void {
    const existing = this.getAll();
    if (existing.length === 0) {
      this.saveToStorage(INITIAL_ACTIVITIES);
    }
  }

  addActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>): Activity {
    const activities = this.getAll();
    
    const newActivity: Activity = {
      ...data,
      id: this.getNextId(activities),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    activities.unshift(newActivity);
    
    // Keep only last 50 activities
    if (activities.length > 50) {
      activities.splice(50);
    }

    this.saveToStorage(activities);
    return newActivity;
  }

  getRecent(limit: number = 5): Activity[] {
    const activities = this.getAll();
    return activities.slice(0, limit);
  }

  getByType(type: Activity['type']): Activity[] {
    return this.getAll().filter(a => a.type === type);
  }
}

export const statsApi = new StatsApi();
export const activitiesApi = new ActivitiesApi();
