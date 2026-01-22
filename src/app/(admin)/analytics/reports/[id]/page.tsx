/**
 * Analytics Report Detail Page
 * ✅ MIGRATED from /pages/analytics/reports/[id].tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { useParams } from '../../../../../components/shim/next-navigation';
import { FileText, Download } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { reportsApi } from '../../../../../api/reportsApi';
import { showToast } from '../../../../../lib/toast';

function AnalyticsReportDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadReport(); }, [id]);
  const loadReport = async () => { try { const data = await reportsApi.getById(id); setReport(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleDownload = () => {
    showToast.success('Success', 'Downloading report...');
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (!report) return <div className="text-center py-12">Not found</div>;

  return <Fragment><PageLayout icon={FileText} title={report.name} description="View report details" actions={<Button onClick={handleDownload}><Download className="w-4 h-4 mr-2" />Download</Button>}><Card className="p-6"><div className="space-y-6"><div><h3 className="font-semibold mb-2">Description</h3><p className="text-gray-700">{report.description}</p></div><div><h3 className="font-semibold mb-2">Generated</h3><p className="text-gray-700">{new Date(report.generated_at).toLocaleString()}</p></div><div><h3 className="font-semibold mb-2">Summary</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">{(report.metrics || []).map((metric: any, idx: number) => (<div key={idx} className="p-4 border rounded bg-gray-50"><p className="text-sm text-gray-500">{metric.label}</p><p className="text-2xl font-bold">{metric.value}</p></div>))}</div></div></div></Card></PageLayout></Fragment>;
}
export { AnalyticsReportDetailPage };
export default AnalyticsReportDetailPage;