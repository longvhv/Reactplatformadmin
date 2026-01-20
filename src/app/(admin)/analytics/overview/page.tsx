/**
 * Analytics Overview Page
 * ✅ MIGRATED from /pages/analytics/overview.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { analyticsApi } from '@/api/analyticsApi';
import { showToast } from '@/lib/toast';

function AnalyticsOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const result = await analyticsApi.getOverview(); setData(result); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={BarChart3} title="Analytics Overview" description="View system analytics and metrics"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"><Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Total Users</p><p className="text-2xl font-bold">{data?.totalUsers || 0}</p></div><Users className="w-10 h-10 text-indigo-600" /></div></Card><Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Revenue</p><p className="text-2xl font-bold">${data?.revenue || 0}</p></div><DollarSign className="w-10 h-10 text-green-600" /></div></Card><Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Growth</p><p className="text-2xl font-bold">{data?.growth || 0}%</p></div><TrendingUp className="w-10 h-10 text-blue-600" /></div></Card><Card className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500">Active</p><p className="text-2xl font-bold">{data?.active || 0}</p></div><BarChart3 className="w-10 h-10 text-purple-600" /></div></Card></div><Card className="p-6"><h3 className="text-lg font-semibold mb-4">Recent Activity</h3><div className="space-y-2">{(data?.activities || []).map((activity: any, idx: number) => (<div key={idx} className="p-3 border rounded"><p className="font-medium">{activity.title}</p><p className="text-sm text-gray-500">{activity.description}</p></div>))}</div></Card></PageLayout></Fragment>;
}
export { AnalyticsOverviewPage };
export default AnalyticsOverviewPage;
