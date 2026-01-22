import { useState } from "react";
import { Search, UserPlus, Mail, MoreVertical, Shield, User } from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";
import { Button } from "../ui/button";

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActive: string;
  avatar?: string;
}

interface TenantUsersProps {
  tenantId: string;
}

export function TenantUsers({ tenantId }: TenantUsersProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - in real app, fetch from API
  const users: TenantUser[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      status: "active",
      lastActive: "2024-01-08T10:30:00Z",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: "member",
      status: "active",
      lastActive: "2024-01-08T09:15:00Z",
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "member",
      status: "inactive",
      lastActive: "2024-01-05T14:20:00Z",
    },
  ];

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    return role === "admin" ? Shield : User;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      member: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[role as keyof typeof colors] || colors.member;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      inactive: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("tenants.searchUsers")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <UserPlus className="w-4 h-4" />
          {t("tenants.inviteUser")}
        </Button>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("users.name")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("users.role")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("users.status")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("users.lastActive")}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("users.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        <RoleIcon className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.lastActive).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            {t("users.noUsersFound")}
          </div>
        )}
      </div>
    </div>
  );
}