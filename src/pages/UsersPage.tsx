/**
 * UsersPage Component
 * Main user management page with real API integration
 * Under 500 lines
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { User, UserRole, UserStatus } from '@/data/users';
import { USER_ROLES, USER_STATUSES, STATUS_COLORS } from '@/constants/user-constants';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

export default function UsersPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');

  // Load users with localStorage fallback
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Try localStorage cache first
      const cachedData = localStorage.getItem('users_cache');
      if (cachedData) {
        const cached = JSON.parse(cachedData);
        const cacheAge = Date.now() - cached.timestamp;
        
        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setUsers(cached.data);
          setLoading(false);
          
          // Fetch in background to update cache
          fetchUsersFromAPI(true);
          return;
        }
      }
      
      // Fetch from API
      await fetchUsersFromAPI(false);
    } catch (err) {
      console.error('Error loading users:', err);
      setLoading(false);
    }
  };

  const fetchUsersFromAPI = async (isBackgroundUpdate: boolean) => {
    try {
      const filters: { [key: string]: string } = {};
      if (roleFilter !== 'all') filters['role'] = roleFilter;
      if (statusFilter !== 'all') filters['status'] = statusFilter;
      if (searchQuery) filters['search'] = searchQuery;

      const params = new URLSearchParams(filters as any).toString();

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      const data = result.data || [];
      
      // Update cache
      localStorage.setItem('users_cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      setUsers(data);
      if (!isBackgroundUpdate) {
        setLoading(false);
      }
    } catch (err) {
      if (!isBackgroundUpdate) {
        // If API fails, try to load from seed data
        const seedData = localStorage.getItem('seed_users');
        if (seedData) {
          const parsed = JSON.parse(seedData);
          setUsers(parsed);
          console.log('[UsersPage] Using seed data as fallback');
        }
      }
    }
  };

  // Stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length,
    suspended: users.filter(u => u.status === 'SUSPENDED').length,
    admins: users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length,
  };

  const handleSearch = () => {
    loadUsers();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">User Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage system users and permissions
              </p>
            </div>
            <Button onClick={() => navigate('/core/users/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total Users</div>
              <div className="text-2xl font-bold mt-1">{stats.total}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Active</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{stats.active}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Inactive</div>
              <div className="text-2xl font-bold mt-1 text-gray-600">{stats.inactive}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Suspended</div>
              <div className="text-2xl font-bold mt-1 text-red-600">{stats.suspended}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Admins</div>
              <div className="text-2xl font-bold mt-1 text-indigo-600">{stats.admins}</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-[1920px] mx-auto px-6 py-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as UserRole | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {USER_ROLES.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {USER_STATUSES.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>Clear</Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {users.length} users
        </p>
      </div>

      {/* User List */}
      <div className="max-w-[1920px] mx-auto px-6 pb-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <Card
                key={user._id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/core/users/${user._id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="text-indigo-600 font-semibold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name & Email */}
                    <div className="min-w-[200px]">
                      <div className="font-semibold hover:text-primary transition-colors">
                        {user.name}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>

                    {/* Role Badge */}
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>

                    {/* Status Badge */}
                    <Badge className={`${STATUS_COLORS[user.status]} text-xs`}>
                      {user.status}
                    </Badge>

                    {/* Position */}
                    {user.position && (
                      <div className="text-sm text-muted-foreground min-w-[150px]">
                        {user.position}
                      </div>
                    )}

                    {/* Department */}
                    {user.department && (
                      <div className="text-sm text-muted-foreground">
                        {user.department}
                      </div>
                    )}

                    {/* Last Login */}
                    {user.last_login_at && (
                      <div className="text-sm text-muted-foreground">
                        Last login: {new Date(user.last_login_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}