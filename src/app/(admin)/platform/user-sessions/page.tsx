'use client';

import { useRouter } from '@/components/shim/next-navigation';
import { 
  Monitor, Plus, Search, Filter, Trash2, Edit, CheckCircle, 
  XCircle, Smartphone, Tablet, Tv, Watch, HelpCircle, MapPin, Globe 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { 
  userSessionsApi, 
  UserSession, 
  DeviceType,
  DeviceTypeHelper
} from '@/api/userSessionsApi';
import { usersApi } from '@/api/usersApi';
import { showToast } from '@/lib/toast';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export default function UserSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, usersData] = await Promise.all([
        userSessionsApi.getAll(),
        usersApi.getAll()
      ]);
      
      setSessions(sessionsData);
      
      const uMap: Record<string, string> = {};
      usersData.forEach(u => uMap[u._id] = u.full_name);
      setUserMap(uMap);

    } catch (err) {
      console.error(err);
      showToast.error('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) return;
    try {
      await userSessionsApi.delete(id);
      showToast.success('Success', 'Session deleted');
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      showToast.error('Error', 'Failed to delete session');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await userSessionsApi.revokeSession(id);
      showToast.success('Success', 'Session revoked');
      loadData(); // Refresh to update status
    } catch (err) {
      showToast.error('Error', 'Failed to revoke session');
    }
  };

  const getDeviceIcon = (type?: string) => {
    const t = type as DeviceType;
    if (DeviceTypeHelper.isDesktop(t)) return <Monitor className="w-4 h-4" />;
    if (DeviceTypeHelper.isMobile(t)) return <Smartphone className="w-4 h-4" />;
    if (DeviceTypeHelper.isTablet(t)) return <Tablet className="w-4 h-4" />;
    if (DeviceTypeHelper.isSmartTV(t)) return <Tv className="w-4 h-4" />;
    if (DeviceTypeHelper.isWatch(t)) return <Watch className="w-4 h-4" />;
    return <HelpCircle className="w-4 h-4" />;
  };

  const filteredSessions = sessions.filter(s => {
    const userName = userMap[s.user_id] || '';
    const query = searchQuery.toLowerCase();
    
    // Search
    const matchesSearch = 
        userName.toLowerCase().includes(query) ||
        s.ip_address?.includes(query) ||
        s.device_name?.toLowerCase().includes(query) ||
        s.location?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Filter
    if (statusFilter === 'active' && !s.is_active) return false;
    if (statusFilter === 'inactive' && s.is_active) return false;

    return true;
  });

  return (
    <PageLayout
      icon={Monitor}
      title="User Sessions"
      description="Monitor and manage active user sessions across devices"
      actions={
        <Button onClick={() => router.push('/platform/user-sessions/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Session
        </Button>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by user, IP, device, or location..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
           <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
        </div>

        {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Sessions</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive / Revoked</option>
                </select>
              </div>
            </div>
          )}

        {loading ? (
           <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User / Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location & IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSessions.map((session) => (
                  <tr key={session._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{userMap[session.user_id] || 'Unknown User'}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        {getDeviceIcon(session.device_type)}
                        <span>{session.device_name || 'Unknown Device'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {session.os} • {session.browser}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-900">
                            <MapPin className="w-3 h-3 text-gray-400"/>
                            {session.location || 'Unknown Location'}
                        </div>
                         <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 font-mono">
                            <Globe className="w-3 h-3 text-gray-400"/>
                            {session.ip_address}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {session.is_active ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">
                                Active
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-gray-500">
                                Inactive
                            </Badge>
                        )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {session.last_activity_at ? format(new Date(session.last_activity_at), 'MMM dd, HH:mm') : '-'}
                      {session.expires_at && (
                          <div className="text-xs text-gray-400 mt-1">
                            Expires: {format(new Date(session.expires_at), 'MMM dd')}
                          </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/platform/user-sessions/edit/${session._id}`)}>
                                Edit Details
                            </DropdownMenuItem>
                            {session.is_active && (
                                <DropdownMenuItem onClick={() => handleRevoke(session._id)}>
                                    <XCircle className="w-4 h-4 mr-2 text-orange-600" />
                                    Revoke Session
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(session._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No sessions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}