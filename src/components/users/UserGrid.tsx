/**
 * UserGrid Component
 * Grid view for users list
 * ✅ Production-ready with card layout
 */

import { useRouter } from '../../shim/next-navigation';
import { 
  Edit, Trash2, Mail, Phone, 
  CheckCircle, Shield, Lock, Calendar 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';

interface User {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  email_verified?: boolean;
  created_at: string;
  avatar_url?: string;
  metadata?: {
    mfa_enabled?: boolean;
    is_support_staff?: boolean;
  };
}

interface UserGridProps {
  users: User[];
  selectedUsers: string[];
  setSelectedUsers: (ids: string[]) => void;
  handleDelete: (id: string) => void;
  handleStatusChange: (id: string, status: any) => void;
}

export function UserGrid({ 
  users, 
  selectedUsers, 
  setSelectedUsers, 
  handleDelete,
  handleStatusChange 
}: UserGridProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      BANNED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      DISABLED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return colors[status as keyof typeof colors] || colors.ACTIVE;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSelectOne = (e: React.MouseEvent, id: string, checked: boolean) => {
    e.stopPropagation();
    if (checked) {
      setSelectedUsers([...selectedUsers, id]);
    } else {
      setSelectedUsers(selectedUsers.filter(uid => uid !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <Card 
          key={user._id}
          className={`relative ${selectedUsers.includes(user._id) ? 'ring-2 ring-primary' : ''} cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => router.push(`/admin/users/${user._id}`)}
        >
          {/* Checkbox */}
          <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedUsers.includes(user._id)}
              onChange={(e) => handleSelectOne(e as any, user._id, e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>

          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {user.full_name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)} mt-1`}>
                  {user.status}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400 truncate">
                {user.email}
              </span>
            </div>

            {/* Phone */}
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {user.phone}
                </span>
              </div>
            )}

            {/* Joined Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                Joined {formatDate(user.created_at)}
              </span>
            </div>

            {/* Features */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {user.email_verified && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified</span>
                </div>
              )}
              {user.metadata?.mfa_enabled && (
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Lock className="w-3 h-3" />
                  <span>MFA</span>
                </div>
              )}
              {user.metadata?.is_support_staff && (
                <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                  <Shield className="w-3 h-3" />
                  <span>Staff</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`/admin/users/${user._id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(user._id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {users.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Không tìm thấy người dùng</p>
        </div>
      )}
    </div>
  );
}

export default UserGrid;