/**
 * UserDetailPage Component - Sidebar Layout
 * 
 * Full-screen layout with vertical sidebar navigation
 * Tabs: Profile, Account Settings, Tenants, Auth Methods, Activity
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Save, X, Loader2, Mail, Phone, MapPin, Briefcase, 
  User, Building2, Shield, Activity, Settings
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserTenantsTab } from '@/components/users/UserTenantsTab';
import { UserAuthMethodsTab } from '@/components/users/UserAuthMethodsTab';
import type { User } from '@/data/users';
import { USER_ROLES, USER_STATUSES, STATUS_COLORS } from '@/constants/user-constants';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { MOCK_USERS } from '@/data/mock-seed-data';

type TabType = 'profile' | 'account' | 'tenants' | 'auth' | 'activity';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/users/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const result = await response.json();
      setUser(result.data);
      setFormData(result.data);
    } catch (err) {
      console.error('Error loading user:', err);
      
      // Fallback to mock data
      const mockUser = MOCK_USERS.find(u => u._id === id);
      if (mockUser) {
        console.log('Using mock user data');
        setUser(mockUser);
        setFormData(mockUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !user) return;

    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core/users/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            version: user.version,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const result = await response.json();
      setUser(result.data);
      setFormData(result.data);
      setEditing(false);
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(user || {});
    setEditing(false);
  };

  // Sidebar navigation items
  const navItems = [
    { id: 'profile', label: 'Profile', icon: User, group: 'main' },
    { id: 'account', label: 'Account Settings', icon: Settings, group: 'main' },
    { id: 'tenants', label: 'Tenants', icon: Building2, group: 'organization' },
    { id: 'auth', label: 'Auth Methods', icon: Shield, group: 'security' },
    { id: 'activity', label: 'Activity Log', icon: Activity, group: 'other' },
  ];

  // Group navigation items
  const groupedNavItems = [
    { 
      title: null, 
      items: navItems.filter(item => item.group === 'main') 
    },
    { 
      title: 'Organization', 
      items: navItems.filter(item => item.group === 'organization') 
    },
    { 
      title: 'Security', 
      items: navItems.filter(item => item.group === 'security') 
    },
    { 
      title: 'Other', 
      items: navItems.filter(item => item.group === 'other') 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Button onClick={() => navigate('/core/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/core/users')}
            className="w-full justify-start mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h2 className="font-semibold text-gray-900 truncate">{user.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
            <Badge className={`${STATUS_COLORS[user.status]} mt-2 text-xs`}>
              {user.status}
            </Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {groupedNavItems.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              {group.title && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as TabType);
                        setEditing(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        {editing && (activeTab === 'profile' || activeTab === 'account') && (
          <div className="p-4 border-t border-gray-200 space-y-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="w-full"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {!editing && (activeTab === 'profile' || activeTab === 'account') && (
          <div className="p-4 border-t border-gray-200">
            <Button
              onClick={() => setEditing(true)}
              className="w-full"
              size="sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Information</h1>
                <p className="text-gray-500">Personal information and contact details</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <Label>Name</Label>
                      {editing ? (
                        <Input
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.name}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <Label>Email</Label>
                      {editing ? (
                        <Input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-900">{user.email}</p>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <Label>Phone</Label>
                      {editing ? (
                        <Input
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-900">{user.phone || 'Not set'}</p>
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <Label>Location</Label>
                      {editing ? (
                        <Input
                          value={formData.location || ''}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-900">{user.location || 'Not set'}</p>
                        </div>
                      )}
                    </div>

                    {/* Department */}
                    <div>
                      <Label>Department</Label>
                      {editing ? (
                        <Input
                          value={formData.department || ''}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.department || 'Not set'}</p>
                      )}
                    </div>

                    {/* Position */}
                    <div>
                      <Label>Position</Label>
                      {editing ? (
                        <Input
                          value={formData.position || ''}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-2 mt-1">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <p className="text-gray-900">{user.position || 'Not set'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label>Bio</Label>
                    {editing ? (
                      <Textarea
                        value={formData.bio || ''}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <p className="mt-1 text-gray-500">{user.bio || 'No bio provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
                <p className="text-gray-500">Manage account status, role, and preferences</p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Role */}
                    <div>
                      <Label>Role</Label>
                      {editing ? (
                        <Select
                          value={formData.role || user.role}
                          onValueChange={(v) => setFormData({ ...formData, role: v as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_ROLES.map(role => (
                              <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="mt-1">{user.role}</Badge>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <Label>Status</Label>
                      {editing ? (
                        <Select
                          value={formData.status || user.status}
                          onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_STATUSES.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={`${STATUS_COLORS[user.status]} mt-1`}>{user.status}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-gray-500">Email Verified</Label>
                      <p className="mt-1 text-gray-900">{user.email_verified ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Last Login</Label>
                      <p className="mt-1 text-gray-900">
                        {user.last_login_at 
                          ? new Date(user.last_login_at).toLocaleString() 
                          : 'Never'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Created At</Label>
                      <p className="mt-1 text-gray-900">{new Date(user.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Updated At</Label>
                      <p className="mt-1 text-gray-900">{new Date(user.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Tenants</h1>
                <p className="text-gray-500">Organizations and workspaces this user belongs to</p>
              </div>
              <UserTenantsTab userId={id} />
            </div>
          )}

          {/* Auth Methods Tab */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Methods</h1>
                <p className="text-gray-500">Manage authentication providers and credentials</p>
              </div>
              <UserAuthMethodsTab userId={id} />
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity Log</h1>
                <p className="text-gray-500">User activity history and audit trail</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Activity Log
                </h3>
                <p className="text-gray-500">
                  Activity tracking and audit history coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
