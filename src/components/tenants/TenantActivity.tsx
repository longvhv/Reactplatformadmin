/**
 * TenantActivity Component
 * Hiển thị lịch sử hoạt động của tenant
 */

import { useState, useEffect } from 'react';
import { Search, Filter, Activity, User, Settings, FileText, Users, Shield, Clock, History } from 'lucide-react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

interface TenantActivityProps {
  tenantId: string;
}

interface Activity {
  _id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export function TenantActivity({ tenantId }: TenantActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    fetchActivities();
  }, [tenantId]);

  useEffect(() => {
    filterActivities();
  }, [searchQuery, filterAction, activities]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Activities might not be implemented yet, use empty array
      setActivities([]);
      setFilteredActivities([]);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
      setFilteredActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let result = [...activities];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.user_name?.toLowerCase().includes(query) ||
          a.user_email?.toLowerCase().includes(query) ||
          a.action?.toLowerCase().includes(query) ||
          a.resource?.toLowerCase().includes(query) ||
          a.details?.toLowerCase().includes(query)
      );
    }

    // Action filter
    if (filterAction !== 'all') {
      result = result.filter((a) => a.action === filterAction);
    }

    setFilteredActivities(result);
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      INVITE: 'bg-yellow-100 text-yellow-800',
      APPROVE: 'bg-teal-100 text-teal-800',
      REJECT: 'bg-orange-100 text-orange-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getActionIcon = (action: string) => {
    // Simple text icon for actions
    const icons: Record<string, string> = {
      CREATE: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      LOGIN: '🔓',
      LOGOUT: '🔒',
      INVITE: '📧',
      APPROVE: '✅',
      REJECT: '❌',
    };
    return icons[action] || '📝';
  };

  const uniqueActions = Array.from(new Set(activities.map((a) => a.action)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lịch sử hoạt động</h2>
          <p className="text-sm text-gray-600">
            Theo dõi tất cả các hoạt động trong tenant
          </p>
        </div>
        <Button onClick={fetchActivities} variant="outline" size="sm">
          <History className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo user, action, resource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Action Filter */}
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Tất cả actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Activities List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <Card className="p-8 text-center">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Không có hoạt động nào</p>
          </Card>
        ) : (
          filteredActivities.map((activity) => (
            <Card key={activity._id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                  {getActionIcon(activity.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getActionColor(activity.action)}>
                        {activity.action}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {activity.resource}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {new Date(activity.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    {activity.details || 'No details'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>
                        {activity.user_name || 'Unknown'} ({activity.user_email})
                      </span>
                    </div>
                    {activity.ip_address && (
                      <div className="flex items-center gap-1">
                        <span className="font-mono">{activity.ip_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredActivities.length > 0 && filteredActivities.length % 50 === 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={fetchActivities}>
            Tải thêm
          </Button>
        </div>
      )}
    </div>
  );
}