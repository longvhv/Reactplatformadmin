/**
 * SaaS Product Type Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Layers, ArrowLeft, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saasProductTypesApi, SaasProductType } from '@/api/saasProductTypesApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLayout } from '@/components/layout/PageLayout';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function SaasProductTypeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [type, setType] = useState<SaasProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => { if (id) loadType(); }, [id]);

  const loadType = async () => {
    try {
      setLoading(true);
      const data = await saasProductTypesApi.getById(id);
      setType(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load SaaS product type');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await saasProductTypesApi.delete(id);
      showToast.success('Success', 'SaaS product type deleted');
      router.push('/platform/saas-product-types');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!type) return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Type Not Found</h2><Button onClick={() => router.push('/platform/saas-product-types')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></div></div>;

  return (
    <>
      <PageLayout icon={Layers} title={type.name} description="SaaS product type details" backButton={{ label: 'Back', onClick: () => router.push('/platform/saas-product-types') }}
        actions={<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/platform/saas-product-types/edit/${id}`)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <dl className="space-y-4">
            <div><dt className="text-sm text-gray-600 mb-1">Type Name</dt><dd className="font-medium">{type.name}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Description</dt><dd>{type.description || 'N/A'}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Code</dt><dd className="font-mono">{type.code || 'N/A'}</dd></div>
          </dl>
        </div>
      </PageLayout>
      <ConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} title="Delete SaaS Product Type" description={`Delete "${type.name}"?`} onConfirm={handleDelete} variant="destructive" />
    </>
  );
}

export { SaasProductTypeDetailPage };
export default SaasProductTypeDetailPage;
