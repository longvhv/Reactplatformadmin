import { BaseApi, type BaseEntity } from './baseApi';

export interface UserProfile extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  role: string;
  avatar: string;
  bio?: string;
  department?: string;
  position?: string;
}

export interface ProfileActivity extends BaseEntity {
  action: string;
  time: string;
  type: 'auth' | 'profile' | 'security' | 'settings';
}

const STORAGE_KEY_PROFILE = 'vhv_user_profile';
const STORAGE_KEY_ACTIVITIES = 'vhv_profile_activities';

const INITIAL_PROFILE: UserProfile = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+84 123 456 789',
  location: 'Ho Chi Minh City, Vietnam',
  joinDate: 'January 2024',
  role: 'Administrator',
  avatar: '',
  bio: 'Software engineer passionate about building great products.',
  department: 'Engineering',
  position: 'Senior Developer',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const INITIAL_ACTIVITIES: ProfileActivity[] = [
  {
    id: 1,
    action: 'Logged in',
    time: '2 hours ago',
    type: 'auth',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 2,
    action: 'Updated profile',
    time: '1 day ago',
    type: 'profile',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 3,
    action: 'Changed password',
    time: '3 days ago',
    type: 'security',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 4,
    action: 'Logged in',
    time: '5 days ago',
    type: 'auth',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 432000000).toISOString(),
  },
];

class ProfileApi extends BaseApi<UserProfile> {
  constructor() {
    super(STORAGE_KEY_PROFILE);
    this.initializeData();
  }

  private initializeData(): void {
    const existing = this.getAll();
    if (existing.length === 0) {
      this.saveToStorage([INITIAL_PROFILE]);
    }
  }

  getCurrent(): UserProfile | null {
    const profiles = this.getAll();
    return profiles.length > 0 ? profiles[0] : null;
  }

  updateCurrent(updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>): UserProfile | null {
    const current = this.getCurrent();
    if (!current) return null;

    const updated: UserProfile = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage([updated]);
    return updated;
  }
}

class ProfileActivitiesApi extends BaseApi<ProfileActivity> {
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

  addActivity(data: Omit<ProfileActivity, 'id' | 'createdAt' | 'updatedAt'>): ProfileActivity {
    const activities = this.getAll();
    
    const newActivity: ProfileActivity = {
      ...data,
      id: this.getNextId(activities),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    activities.unshift(newActivity);
    
    // Keep only last 20 activities
    if (activities.length > 20) {
      activities.splice(20);
    }

    this.saveToStorage(activities);
    return newActivity;
  }

  getRecent(limit: number = 10): ProfileActivity[] {
    const activities = this.getAll();
    return activities.slice(0, limit);
  }

  getByType(type: ProfileActivity['type']): ProfileActivity[] {
    return this.getAll().filter(a => a.type === type);
  }
}

export const profileApi = new ProfileApi();
export const profileActivitiesApi = new ProfileActivitiesApi();
