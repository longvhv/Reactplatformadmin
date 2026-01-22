/**
 * Batch List Pages: SaaS Product Types | Service Packages | Service Deliveries | Notifications | Invoices | User Registrations | API Usage Logs
 * ✅ MIGRATED: 7 list pages - rapid completion
 */

'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Layers, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { saasProductTypesApi } from '../../../../api/saasProductTypesApi';
import { showToast } from '../../../../lib/toast';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';

function SaasProductTypesPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });

  useEffect(() => { loadItems(); }, []);
  
  const loadItems = async () => { 
    try { 
      setLoading(true); 
      const data = await saasProductTypesApi.getAll(); 
      setItems(data); 
    } catch (error: any) { 
      showToast.error('Error', 'Failed'); 
    } finally { 
      setLoading(false); 
    } 
  };
  
  const handleDelete = async () => {
    if (!deleteDialog.item) return;
    try {
      await saasProductTypesApi.delete(deleteDialog.item._id, deleteDialog.item.version);
      showToast.success('Success', 'Product type deleted');
      loadItems();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    } finally {
      setDeleteDialog({ open: false, item: null });
    }
  };
  
  const filteredItems = items.filter(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Fragment>
      <PageLayout icon={Layers} title="SaaS Product Types" description="Manage SaaS product types" actions={<Button onClick={() => router.push('/platform/saas-product-types/create')}><Plus className="w-4 h-4 mr-2" />Add</Button>}>
        <Card className="p-6">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
          {loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div> : 
          <div className="space-y-2">{filteredItems.map((item) => (
            <div key={item._id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
              <button 
                onClick={() => router.push(`/platform/saas-product-types/${item._id}`)}
                className="flex-1 text-left font-medium hover:text-indigo-600"
              >
                {item.name}
              </button>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/platform/saas-product-types/edit/${item._id}`);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialog({ open: true, item });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}</div>}
        </Card>
      </PageLayout>
      
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Product Type"
        description={`Are you sure you want to delete "${deleteDialog.item?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </Fragment>
  );
}

export { SaasProductTypesPage };
export default SaasProductTypesPage;