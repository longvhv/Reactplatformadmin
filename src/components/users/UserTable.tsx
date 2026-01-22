/**
 * UserTable Component
 * Table view for users list
 * ✅ Production-ready with all features
 */

import { useRouter } from '../../shim/next-navigation';
import { 
  Edit, Trash2, MoreVertical, 
  CheckCircle, Shield, Lock 
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

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

interface UserTableProps {
  users: User[];
  selectedUsers: string[];
  setSelectedUsers: (ids: string[]) => void;
  handleDelete: (id: string) => void;
  handleStatusChange: (id: string, status: any) => void;
}

export function UserTable({ 
  users, 
  selectedUsers, 
  setSelectedUsers, 
  handleDelete,
  handleStatusChange 
}: UserTableProps) {
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(u => u._id));
    } else {
      setSelectedUsers([]);
    }
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Features
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr 
                key={user._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/users/${user._id}`)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={(e) => handleSelectOne(e as any, user._id, e.target.checked)}
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {user.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {user.phone || '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.email_verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" title="Email verified" />
                    )}
                    {user.metadata?.mfa_enabled && (
                      <Lock className="w-4 h-4 text-blue-500" title="MFA enabled" />
                    )}
                    {user.metadata?.is_support_staff && (
                      <Shield className="w-4 h-4 text-purple-500" title="Support staff" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/users/${user._id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Không tìm thấy người dùng</p>
        </div>
      )}
    </div>
  );
}

export default UserTable;