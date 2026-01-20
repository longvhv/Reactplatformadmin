/**
 * Product Type Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Box, ArrowLeft, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { productTypesApi, ProductType } from '@/api/productTypesApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLayout } from '@/components/layout/PageLayout';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function ProductTypeDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [type, setType] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadType();
  }, [id]);

  const loadType = async () => {
    try {
      setLoading(true);
      const data = await productTypesApi.getById(id);
      setType(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load product type');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productTypesApi.delete(id);
      showToast.success('Success', 'Product type deleted');
      router.push('/platform/product-types');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (!type) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Box className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Type Not Found</h2>
          <Button onClick={() => router.push('/platform/product-types')}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout icon={Box} title={type.name} description="Product type details" backButton={{ label: 'Back', onClick: () => router.push('/platform/product-types') }}
        actions={<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/platform/product-types/edit/${id}`)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <dl className="space-y-4">
            <div><dt className="text-sm text-gray-600 mb-1">Type Name</dt><dd className="font-medium">{type.name}</dd></div>
            <div><dt className="text-sm text-gray-600 mb-1">Description</dt><dd>{type.description || 'N/A'}</dd></div>
          </dl>
        </div>
      </PageLayout>
      <ConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} title="Delete Product Type" description={`Delete "${type.name}"?`} onConfirm={handleDelete} variant="destructive" />
    </>
  );
}

export { ProductTypeDetailPage };
export default ProductTypeDetailPage;
