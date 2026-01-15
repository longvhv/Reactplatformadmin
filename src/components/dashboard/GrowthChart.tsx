/**
 * Dashboard Growth Chart Component
 * Displays user/tenant growth trends using recharts
 */

import { Card } from '../ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { CHART_COLORS, CHART_UI } from '../../constants/chartColors';

interface GrowthChartProps {
  userGrowthData: ChartDataPoint[];
  tenantGrowthData: ChartDataPoint[];
  loading?: boolean;
}

export function GrowthChart({ userGrowthData, tenantGrowthData, loading }: GrowthChartProps) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {t('dashboard.growthTrends')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.growthTrendsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users">{t('dashboard.userGrowth')}</TabsTrigger>
            <TabsTrigger value="tenants">{t('dashboard.tenantGrowth')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid.stroke} opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  stroke={CHART_COLORS.chartAxisAlt}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: CHART_UI.grid.stroke }}
                />
                <YAxis 
                  stroke={CHART_COLORS.chartAxisAlt}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: CHART_UI.grid.stroke }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: CHART_UI.tooltip.background,
                    border: `1px solid ${CHART_UI.tooltip.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_COLORS.primary} 
                  strokeWidth={2.5}
                  fill="url(#colorUsers)"
                  name={t('dashboard.newUsers')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="tenants" className="mt-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={tenantGrowthData}>
                <defs>
                  <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid.stroke} opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  stroke={CHART_COLORS.chartAxisAlt}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: CHART_UI.grid.stroke }}
                />
                <YAxis 
                  stroke={CHART_COLORS.chartAxisAlt}
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: CHART_UI.grid.stroke }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: CHART_UI.tooltip.background,
                    border: `1px solid ${CHART_UI.tooltip.border}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={CHART_COLORS.blue} 
                  strokeWidth={2.5}
                  fill="url(#colorTenants)"
                  name={t('dashboard.newTenants')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}