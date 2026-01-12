import { useLanguage } from '@/providers/LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus } from 'lucide-react';
import type { UserWithMeta } from '@/hooks/useUsersData';

interface UserStatsProps {
  users: UserWithMeta[];
}

export function UserStats({ users }: UserStatsProps) {
  const { t } = useLanguage();

  const stats = [
    {
      label: t('users.totalUsers'),
      value: users.length.toString(),
      icon: Users,
      color: 'text-[#6366f1]',
      bgColor: 'bg-[#6366f1]/10',
    },
    {
      label: t('users.activeUsers'),
      value: users.filter(u => u.status === 'active').length.toString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-600/10',
    },
    {
      label: t('users.newThisMonth'),
      value: '12',
      icon: UserPlus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
