/**
 * Product Detail Page  
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/components/shim/next-navigation';
import { Package, ArrowLeft, MoreVertical, Edit, Trash2, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saasProductsApi, SaasProduct } from '@/api/saasProductsApi';
import { showToast } from '@/lib/toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageLayout } from '@/components/layout/PageLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<SaasProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await saasProductsApi.getById(id);
      setProduct(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    try {
      await saasProductsApi.delete(id, product.version);
      showToast.success('Success', 'Product deleted');
      router.push('/commerce/products');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      await saasProductsApi.update(id, { 
        status: newStatus,
        version: product.version
      });
      showToast.success('Success', `Product ${newStatus === 'inactive' ? 'deactivated' : 'activated'}`);
      loadProduct();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to toggle status');
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <Button onClick={() => router.push('/commerce/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Package}
        title={product.name}
        description={product.description || 'Product details'}
        backButton={{
          label: 'Back to Products',
          onClick: () => router.push('/commerce/products'),
        }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/commerce/products/edit/${id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {product.status === 'active' ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Product Information</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Product Code:</dt>
                <dd className="font-mono text-sm">{product.code}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Status:</dt>
                <dd>
                  <span className={`px-2 py-1 rounded text-xs ${
                    product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Category (Type):</dt>
                <dd>{product.product_type_code || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Created:</dt>
                <dd>{new Date(product.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <h3 className="font-semibold mb-4">Pricing</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Base Price:</dt>
                <dd className="font-medium">${product.base_price?.toFixed(2) || '0.00'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Currency:</dt>
                <dd>{product.currency || 'USD'}</dd>
              </div>
            </dl>
          </div>
        </div>
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Product"
        description={`Delete "${product.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

export { ProductDetailPage };
export default ProductDetailPage;
