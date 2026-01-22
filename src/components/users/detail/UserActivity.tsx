/**
 * UserActivity Component
 * Hiển thị lịch sử hoạt động của user
 */

import { useState } from 'react';
import { 
  Activity as ActivityIcon, 
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '../../ui/button';
import { useUserActivity } from '../../../hooks/useUserActivity';

interface UserActivityProps {
  userId: string;
}

export function UserActivity({ userId }: UserActivityProps) {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const { activities, loading } = useUserActivity(userId);

  const filteredActivities = activities.filter(activity => {
    if (actionFilter !== 'all' && activity.action !== actionFilter) return false;
    return true;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    const colors = {
      login: 'bg-green-100 text-green-800',
      logout: 'bg-gray-100 text-gray-800',
      created: 'bg-blue-100 text-blue-800',
      updated: 'bg-yellow-100 text-yellow-800',
      deleted: 'bg-red-100 text-red-800',
      password_changed: 'bg-purple-100 text-purple-800',
    };
    return colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Lịch sử hoạt động</h2>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi hành động của người dùng
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">Tất cả hành động</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="password_changed">Password Changed</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <ActivityIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {actionFilter !== 'all' 
              ? 'Không có hoạt động nào cho bộ lọc này'
              : 'Chưa có hoạt động nào'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => (
                <div key={activity._id} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                    {index < filteredActivities.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6 border-b last:border-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                            {activity.action}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>
                        
                        <p className="mt-2 text-sm text-gray-900">
                          {activity.description || `User performed ${activity.action}`}
                        </p>

                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </div>
                        )}

                        {activity.ip_address && (
                          <p className="mt-2 text-xs text-gray-400">
                            IP: {activity.ip_address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Tổng hoạt động</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {activities.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Login</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {activities.filter(a => a.action === 'login').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Updates</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {activities.filter(a => a.action === 'updated').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <p className="text-sm text-gray-500">Deletes</p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {activities.filter(a => a.action === 'deleted').length}
          </p>
        </div>
      </div>
    </div>
  );
}