'use client';

import { useRouter } from '@/components/shim/next-navigation';
import { 
  Laptop, Plus, Search, Filter, Trash2, Edit, CheckCircle, 
  XCircle, Smartphone, Tablet, Tv, Watch, HelpCircle, MapPin, Globe, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { 
  userDevicesApi, 
  UserDevice, 
  DeviceType,
  DeviceTypeHelper,
  DeviceStatus,
  DeviceStatusHelper
} from '@/api/userDevicesApi';
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

export default function UserDevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'revoked'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesData, usersData] = await Promise.all([
        userDevicesApi.getAll(),
        usersApi.getAll()
      ]);
      
      setDevices(devicesData);
      
      const uMap: Record<string, string> = {};
      usersData.forEach(u => uMap[u._id] = u.full_name);
      setUserMap(uMap);

    } catch (err) {
      console.error(err);
      showToast.error('Error', 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this device record?')) return;
    try {
      await userDevicesApi.delete(id);
      showToast.success('Success', 'Device deleted');
      setDevices(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      showToast.error('Error', 'Failed to delete device');
    }
  };

  const handleRevoke = async (id: string) => {
      const reason = prompt('Enter revocation reason (optional):');
      if (reason === null) return; 

      try {
          await userDevicesApi.revokeDevice(id, reason || undefined);
          showToast.success('Success', 'Device revoked');
          loadData();
      } catch (err) {
          showToast.error('Error', 'Failed to revoke device');
      }
  };

  const handleBlock = async (id: string) => {
      try {
          await userDevicesApi.blockDevice(id);
          showToast.success('Success', 'Device blocked');
          loadData();
      } catch (err) {
          showToast.error('Error', 'Failed to block device');
      }
  };

  const getDeviceIcon = (type?: string) => {
    const t = type as DeviceType;
    if (DeviceTypeHelper.isDesktop(t)) return <Laptop className="w-4 h-4" />;
    if (DeviceTypeHelper.isMobile(t)) return <Smartphone className="w-4 h-4" />;
    if (DeviceTypeHelper.isTablet(t)) return <Tablet className="w-4 h-4" />;
    if (DeviceTypeHelper.isTV(t)) return <Tv className="w-4 h-4" />;
    if (DeviceTypeHelper.isWatch(t)) return <Watch className="w-4 h-4" />;
    return <HelpCircle className="w-4 h-4" />;
  };

  const getStatusBadge = (status?: string) => {
      const s = status as DeviceStatus;
      if (DeviceStatusHelper.isActive(s)) return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      if (DeviceStatusHelper.isBlocked(s)) return <Badge className="bg-red-100 text-red-800 border-red-200">Blocked</Badge>;
      if (DeviceStatusHelper.isRevoked(s)) return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Revoked</Badge>;
      return <Badge variant="outline">Inactive</Badge>;
  };

  const filteredDevices = devices.filter(d => {
    const userName = userMap[d.user_id] || '';
    const query = searchQuery.toLowerCase();
    
    // Search
    const matchesSearch = 
        userName.toLowerCase().includes(query) ||
        d.device_name?.toLowerCase().includes(query) ||
        d.device_model?.toLowerCase().includes(query) ||
        d.manufacturer?.toLowerCase().includes(query) ||
        d.ip_address?.includes(query);

    if (!matchesSearch) return false;

    // Filter
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;

    return true;
  });

  return (
    <PageLayout
      icon={Laptop}
      title="User Devices"
      description="Manage registered user devices and security trust levels"
      actions={
        <Button onClick={() => router.push('/platform/user-devices/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Register Device
        </Button>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by user, device name, model, or IP..." 
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
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="revoked">Revoked</option>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS / Browser</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trust Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Used</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevices.map((device) => (
                  <tr key={device._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{device.device_name || 'Unnamed Device'}</div>
                      <div className="text-xs text-gray-500 mb-1">{userMap[device.user_id]}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {getDeviceIcon(device.device_type)}
                        <span>{device.manufacturer} {device.device_model}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{device.os} {device.os_version}</div>
                        <div className="text-xs text-gray-500">{device.browser} {device.browser_version}</div>
                        {device.ip_address && (
                             <div className="text-xs text-gray-400 mt-1 font-mono">{device.ip_address}</div>
                        )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                             {getStatusBadge(device.status)}
                             {device.is_trusted && (
                                 <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 w-fit">
                                     <Shield className="w-3 h-3 mr-1"/> Trusted
                                 </Badge>
                             )}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {device.last_used_at ? format(new Date(device.last_used_at), 'MMM dd, HH:mm') : '-'}
                      <div className="text-xs text-gray-400 mt-1">
                          First seen: {device.first_seen_at ? format(new Date(device.first_seen_at), 'MMM dd, yyyy') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/platform/user-devices/edit/${device._id}`)}>
                                Edit Details
                            </DropdownMenuItem>
                            
                            {device.status === 'active' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleBlock(device._id)}>
                                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                        Block Device
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleRevoke(device._id)}>
                                        <Trash2 className="w-4 h-4 mr-2 text-orange-600" />
                                        Revoke Access
                                    </DropdownMenuItem>
                                </>
                            )}
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(device._id)}
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
                {filteredDevices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No devices found.
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