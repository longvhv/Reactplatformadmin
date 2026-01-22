/**
 * System Category Detail Page
 * Trang chi tiết danh mục hệ thống
 * ✅ CREATED: 2026-01-22
 */
'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../components/shim/next-navigation';
import { FolderTree, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { showToast } from '../../../../../lib/toast';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

interface SystemCategory {
  _id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  parent_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

function SystemCategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [category, setCategory] = useState<SystemCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCategory();
    }
  }, [id]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/system-categories/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load system category');
      }

      const data = await response.json();
      setCategory(data);
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to load system category');
      console.error('Error loading system category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this system category?')) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/system-categories/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete system category');
      }

      showToast.success('Success', 'System category deleted successfully');
      router.push('/admin/platform/system-categories');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete system category');
      console.error('Error deleting system category:', error);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Loading..." description="Loading system category details" icon={FolderTree}>
        <div className="text-center py-12 text-muted-foreground">
          Loading system category...
        </div>
      </PageLayout>
    );
  }

  if (!category) {
    return (
      <PageLayout title="Not Found" description="System category not found" icon={FolderTree}>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">System category not found</p>
          <Button onClick={() => router.push('/admin/platform/system-categories')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Button>
        </Card>
      </PageLayout>
    );
  }

  return (
    <Fragment>
      <PageLayout
        title={category.name}
        description="System category details"
        icon={FolderTree}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/platform/system-categories')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/platform/system-categories/edit/${id}`)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Code</label>
                <p className="text-sm mt-1">{category.code}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm mt-1">{category.name}</p>
              </div>
              {category.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{category.description}</p>
                </div>
              )}
              {category.parent_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Parent Category</label>
                  <p className="text-sm mt-1">{category.parent_name}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm mt-1">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      category.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Metadata</h2>
            <div className="grid gap-4">
              {category.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm mt-1">
                    {new Date(category.created_at).toLocaleString()}
                  </p>
                </div>
              )}
              {category.updated_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-sm mt-1">
                    {new Date(category.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </PageLayout>
    </Fragment>
  );
}

export { SystemCategoryDetailPage };
export default SystemCategoryDetailPage;
