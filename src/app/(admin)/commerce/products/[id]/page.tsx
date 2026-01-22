/**
 * Product Detail Page
 * Main detail page for product with sidebar navigation (like Tenant Detail)
 * ✅ MIGRATED: Next.js App Router with relative imports
 * ✅ Changed from tabs to sidebar navigation for better UX
 * ✅ 100% QUALITY: Professional UI with grouped sidebar menu
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../../components/shim/next-navigation';
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Copy,
  MoreVertical,
  Info,
  Box,
  BarChart3,
  DollarSign,
  Settings,
  History,
  CreditCard,
  Tag,
  Megaphone,
  ListChecks,
  Gauge,
  BookOpen,
} from 'lucide-react';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import { showToast } from '../../../../../lib/toast';
import { ConfirmDialog } from '../../../../../components/common/ConfirmDialog';
import { isReservedKeyword } from '../../../../../lib/route-guards';

// Import tabs
import { ProductOverviewTab } from '../../../../../components/products/ProductOverviewTab';
import { ProductStatsTab } from '../../../../../components/products/ProductStatsTab';
import { ProductPackagesTab } from '../../../../../components/products/ProductPackagesTab';
import { ProductRevenueTab } from '../../../../../components/products/ProductRevenueTab';
import { ProductSettingsTab } from '../../../../../components/products/ProductSettingsTab';
import { ProductHistoryTab } from '../../../../../components/products/ProductHistoryTab';
import { ProductSubscriptionsTab } from '../../../../../components/products/ProductSubscriptionsTab';
import { ProductPricingPlansTab } from '../../../../../components/products/ProductPricingPlansTab';
import { ProductMarketingTab } from '../../../../../components/products/ProductMarketingTab';
import { ProductFeaturesTab } from '../../../../../components/products/ProductFeaturesTab';
import { ProductLimitsTab } from '../../../../../components/products/ProductLimitsTab';
import { ProductDocumentationTab } from '../../../../../components/products/ProductDocumentationTab';

// Import API
import { saasProductsApi, SaasProduct } from '../../../../../api/saasProductsApi';

type TabType = 
  | 'overview' 
  | 'packages' 
  | 'settings' 
  | 'history'
  | 'stats' 
  | 'revenue'
  | 'subscriptions'
  | 'pricing-plans'
  | 'marketing'
  | 'features'
  | 'limits'
  | 'documentation';

function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  // Handle reserved keywords
  useEffect(() => {
    if (isReservedKeyword(id)) {
      router.push('/commerce/products/create');
      return;
    }
    if (!id) {
      router.push('/commerce/products');
    }
  }, [id, router]);

  // State
  const [product, setProduct] = useState<SaasProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // Load product
  useEffect(() => {
    if (id && !isReservedKeyword(id)) {
      loadProduct();
    }
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

  // Early return if reserved keyword
  if (isReservedKeyword(id)) {
    return null;
  }

  // Sidebar menu groups
  const sidebarGroups = [
    {
      id: 'general',
      label: 'GENERAL',
      items: [
        { id: 'overview', label: 'Overview', icon: Info },
        { id: 'packages', label: 'Service Packages', icon: Box },
      ]
    },
    {
      id: 'analytics',
      label: 'ANALYTICS',
      items: [
        { id: 'stats', label: 'Statistics', icon: BarChart3 },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
      ]
    },
    {
      id: 'management',
      label: 'MANAGEMENT',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'history', label: 'History', icon: History },
        { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
        { id: 'pricing-plans', label: 'Pricing Plans', icon: Tag },
        { id: 'marketing', label: 'Marketing', icon: Megaphone },
        { id: 'features', label: 'Features', icon: ListChecks },
        { id: 'limits', label: 'Limits', icon: Gauge },
        { id: 'documentation', label: 'Documentation', icon: BookOpen },
      ]
    },
  ];

  const handleToggleConfirm = async () => {
    if (!product) return;

    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    try {
      await saasProductsApi.update(id, { status: newStatus, version: product.version });
      await loadProduct();
      showToast.success('Success', `Product ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      showToast.error('Error', error.message || 'Failed to update status');
    }
    setShowToggleDialog(false);
  };

  const handleDuplicateOpen = () => {
    if (!product) return;
    setDuplicateName(`${product.name} (Copy)`);
    setShowDuplicateDialog(true);
  };

  const handleDuplicateConfirm = async () => {
    if (!product || !duplicateName.trim()) {
      showToast.error('Error', 'Please enter a name for the duplicate');
      return;
    }

    try {
      const duplicateData = {
        ...product,
        name: duplicateName.trim(),
        code: `${product.code}_copy_${Date.now()}`,
        status: 'inactive' as const,
      };
      
      // Remove fields that shouldn't be duplicated
      delete (duplicateData as any)._id;
      delete (duplicateData as any).created_at;
      delete (duplicateData as any).updated_at;
      delete (duplicateData as any).version;

      const newProduct = await saasProductsApi.create(duplicateData);
      showToast.success('Success', 'Product duplicated successfully');
      router.push(`/commerce/products/${newProduct._id}`);
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      showToast.error('Error', error.message || 'Failed to duplicate product');
    }
    setShowDuplicateDialog(false);
  };

  const handleDeleteConfirm = async () => {
    if (!product || !id) {
      showToast.error('Error', 'Invalid product ID');
      return;
    }

    try {
      await saasProductsApi.delete(id, product.version);
      showToast.success('Success', 'Product deleted');
      router.push('/commerce/products');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showToast.error('Error', error.message || 'Failed to delete product');
    }
    setShowDeleteDialog(false);
  };

  const renderTabContent = () => {
    if (!product) return null;
    
    switch (activeTab) {
      case 'overview':
        return <ProductOverviewTab productId={id} product={product} />;
      case 'packages':
        return <ProductPackagesTab productId={id} />;
      case 'stats':
        return <ProductStatsTab productId={id} />;
      case 'revenue':
        return <ProductRevenueTab productId={id} />;
      case 'settings':
        return <ProductSettingsTab productId={id} />;
      case 'history':
        return <ProductHistoryTab productId={id} />;
      case 'subscriptions':
        return <ProductSubscriptionsTab productId={id} />;
      case 'pricing-plans':
        return <ProductPricingPlansTab productId={id} />;
      case 'marketing':
        return <ProductMarketingTab productId={id} />;
      case 'features':
        return <ProductFeaturesTab productId={id} />;
      case 'limits':
        return <ProductLimitsTab productId={id} />;
      case 'documentation':
        return <ProductDocumentationTab productId={id} />;
      default:
        return <ProductOverviewTab productId={id} product={product} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Product Not Found
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Product with ID "{id}" does not exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/commerce/products')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/commerce/products')}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800">
                    <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{product.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{product.code}</p>
                  </div>
                  <Badge
                    className={
                      product.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }
                  >
                    {product.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {product.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowToggleDialog(true)}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-900/20"
                  >
                    <PowerOff className="w-4 h-4 mr-2" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowToggleDialog(true)}
                    className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                  >
                    <Power className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/commerce/products/edit/${id}`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDuplicateOpen}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-24">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Product Management
                  </p>
                </div>
                <nav className="py-3 px-2">
                  {sidebarGroups.map((group, groupIndex) => (
                    <div key={group.id} className={groupIndex > 0 ? 'mt-5' : ''}>
                      {/* Group header */}
                      <div className="px-3 mb-1.5">
                        <h3 className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          {group.label}
                        </h3>
                      </div>
                      
                      {/* Group items */}
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id as TabType)}
                              className={`
                                w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-150
                                ${isActive 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }
                              `}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                                <span className="font-normal">{item.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Confirm Delete Product"
        description={`Are you sure you want to delete product "${product.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        open={showToggleDialog}
        onOpenChange={setShowToggleDialog}
        onConfirm={handleToggleConfirm}
        title="Confirm Status Change"
        description={`Are you sure you want to ${product.status === 'active' ? 'deactivate' : 'activate'} product "${product.name}"?`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />

      {/* Duplicate Dialog */}
      <ConfirmDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        onConfirm={handleDuplicateConfirm}
        title="Duplicate Product"
        description={
          <div className="space-y-4">
            <p>Enter a name for the duplicated product:</p>
            <input
              type="text"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Product name"
              autoFocus
            />
          </div>
        }
        confirmLabel="Duplicate"
        cancelLabel="Cancel"
      />
    </>
  );
}

export { ProductDetailPage };
export default ProductDetailPage;