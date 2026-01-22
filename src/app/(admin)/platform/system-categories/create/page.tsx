/**
 * Create System Category Page
 * Trang tạo mới danh mục hệ thống
 * ✅ CREATED: 2026-01-22
 */
'use client';

import { Fragment, useState, useEffect } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { FolderTree, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { showToast } from '../../../../../lib/toast';
import { projectId, publicAnonKey } from '../../../../../utils/supabase/info';

interface SystemCategory {
  _id: string;
  code: string;
  name: string;
}

function CreateSystemCategoryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<SystemCategory[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    parent_id: '',
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/system-categories`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      showToast.error('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/system-categories`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: formData.code.trim(),
            name: formData.name.trim(),
            description: formData.description.trim(),
            parent_id: formData.parent_id || null,
            is_active: formData.is_active,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create system category');
      }

      const result = await response.json();
      showToast.success('Success', 'System category created successfully');
      router.push(`/admin/platform/system-categories/${result._id || result.id}`);
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create system category');
      console.error('Error creating system category:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fragment>
      <PageLayout
        title="Create System Category"
        description="Add a new system category"
        icon={FolderTree}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push('/admin/platform/system-categories')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        }
      >
        <form onSubmit={handleSubmit}>
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Code <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Enter category code"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Parent Category</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">None (Root Category)</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name} ({category.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/platform/system-categories')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" />
                  {saving ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </PageLayout>
    </Fragment>
  );
}

export default CreateSystemCategoryPage;
