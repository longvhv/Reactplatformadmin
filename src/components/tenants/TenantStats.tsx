/**
 * TenantStats Component
 * Statistics dashboard for tenants
 */

import { Card, CardContent } from '@/components/ui/card';

interface TenantStatsProps {
  stats: {
    total: number;
    active: number;
    trial: number;
    enterprise: number;
    partners: number;
    rootTenants: number;
  };
}

export function TenantStats({ stats }: TenantStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          <p className="text-xs text-muted-foreground">Active</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-blue-600">{stats.trial}</div>
          <p className="text-xs text-muted-foreground">Trial</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-purple-600">{stats.enterprise}</div>
          <p className="text-xs text-muted-foreground">Enterprise</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-teal-600">{stats.partners}</div>
          <p className="text-xs text-muted-foreground">Partners</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-indigo-600">{stats.rootTenants}</div>
          <p className="text-xs text-muted-foreground">Root</p>
        </CardContent>
      </Card>
    </div>
  );
}
