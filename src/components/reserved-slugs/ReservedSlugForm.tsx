/**
 * Reserved Slug Form Component
 * Form for creating/editing reserved slugs
 * ✅ UPDATED: 2026-01-21 - Simplified schema
 */

import React, { useState, useEffect } from 'react';
import { 
  ReservedSlug, 
  CreateReservedSlugRequest, 
  UpdateReservedSlugRequest 
} from '../../api/reservedSlugsSimpleApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tag, Save, X } from 'lucide-react';

interface ReservedSlugFormProps {
  initialData?: ReservedSlug;
  onSubmit: (data: CreateReservedSlugRequest | UpdateReservedSlugRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ReservedSlugForm({ initialData, onSubmit, onCancel, loading }: ReservedSlugFormProps) {
  const isEdit = !!initialData;
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateReservedSlugRequest>>({
    slug: '',
    description: '',
    entity_type: '',
    is_active: true,
  });

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        slug: initialData.slug || '',
        description: initialData.description || '',
        entity_type: initialData.entity_type || '',
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.slug?.trim()) {
      return;
    }

    if (isEdit) {
      const updateData: UpdateReservedSlugRequest = {
        slug: formData.slug,
        description: formData.description,
        entity_type: formData.entity_type,
        is_active: formData.is_active,
        version: initialData!.version,
      };
      onSubmit(updateData);
    } else {
      const createData: CreateReservedSlugRequest = {
        slug: formData.slug!,
        description: formData.description,
        entity_type: formData.entity_type,
        is_active: formData.is_active,
      };
      onSubmit(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {isEdit ? 'Edit' : 'Add'} Reserved Slug
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              placeholder="e.g., admin, api, settings"
              required
              disabled={loading}
            />
            <p className="text-sm text-gray-500">
              The slug value to reserve (lowercase, alphanumeric and hyphens only)
            </p>
          </div>

          {/* Entity Type */}
          <div className="space-y-2">
            <Label htmlFor="entity_type">Entity Type</Label>
            <Input
              id="entity_type"
              value={formData.entity_type}
              onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
              placeholder="e.g., tenant, application, user"
              disabled={loading}
            />
            <p className="text-sm text-gray-500">
              The type of entity this slug is reserved for (optional)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Why is this slug reserved?"
              rows={3}
              disabled={loading}
            />
            <p className="text-sm text-gray-500">
              Explain why this slug is reserved (optional)
            </p>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active Status</Label>
              <p className="text-sm text-gray-500">
                Enable this reserved slug
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.slug?.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}