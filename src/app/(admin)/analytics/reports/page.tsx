/**
 * Analytics Reports Page
 * ✅ MIGRATED from /pages/analytics/reports.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { FileText, Download, Eye } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { reportsApi } from '../../../../api/reportsApi';
import { showToast } from '../../../../lib/toast';

function AnalyticsReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadReports(); }, []);
  const loadReports = async () => { try { const data = await reportsApi.getAll(); setReports(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleDownload = (report: any) => {
    showToast.success('Success', 'Downloading report...');
  };

  return <Fragment><PageLayout icon={FileText} title="Analytics Reports" description="View and download analytics reports"><Card className="p-6">{loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div> : <div className="space-y-3">{reports.map((report) => (<div key={report._id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50"><div><p className="font-medium">{report.name}</p><p className="text-sm text-gray-500">{report.description}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => router.push(`/analytics/reports/${report._id}`)}><Eye className="w-4 h-4 mr-2" />View</Button><Button size="sm" onClick={() => handleDownload(report)}><Download className="w-4 h-4 mr-2" />Download</Button></div></div>))}</div>}</Card></PageLayout></Fragment>;
}
export { AnalyticsReportsPage };
export default AnalyticsReportsPage;