/**
 * Reserved Slug Detail Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from '../../../../components/shim/next-navigation';
import { Tag, ArrowLeft, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { reservedSlugsApi, ReservedSlug } from '../../../../api/reservedSlugsSimpleApi';
import { showToast } from '../../../../lib/toast';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { PageLayout } from '../../../../components/layout/PageLayout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';

function ReservedSlugDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [slug, setSlug] = useState<ReservedSlug | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) loadSlug();
  }, [id]);

  const loadSlug = async () => {
    try {
      setLoading(true);
      const data = await reservedSlugsApi.getById(id);
      setSlug(data);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load reserved slug');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await reservedSlugsApi.delete(id);
      showToast.success('Success', 'Reserved slug deleted');
      router.push('/platform/reserved-slugs');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Reserved Slug Not Found</h2>
          <Button onClick={() => router.push('/platform/reserved-slugs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reserved Slugs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout
        icon={Tag}
        title={slug.slug}
        description="Reserved slug details"
        backButton={{
          label: 'Back to Reserved Slugs',
          onClick: () => router.push('/platform/reserved-slugs'),
        }}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/platform/reserved-slugs/edit/${id}`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-gray-600 mb-1">Slug</dt>
              <dd className="font-mono text-lg font-semibold">/{slug.slug}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Entity Type</dt>
              <dd className="font-medium">{slug.entity_type || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Description</dt>
              <dd>{slug.description || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Status</dt>
              <dd>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  slug.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {slug.is_active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Created At</dt>
              <dd>{new Date(slug.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600 mb-1">Updated At</dt>
              <dd>{new Date(slug.updated_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      </PageLayout>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Reserved Slug"
        description={`Delete slug "${slug.slug}"? This cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}

export { ReservedSlugDetailPage };
export default ReservedSlugDetailPage;