/**
 * Edit Reserved Slug Page
 * Production-ready with optimistic locking
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  reservedSlugsApi,
  ReservedSlug,
  UpdateReservedSlugRequest,
  SlugType,
  MatchType,
  getTypeColor,
  getTypeLabel,
} from '../api/reservedSlugsApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { Save, RefreshCw, Shield, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function EditReservedSlugPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState(true);
  const [slug, setSlug] = useState<ReservedSlug | null>(null);
  
  const [formData, setFormData] = useState<UpdateReservedSlugRequest>({
    type: 'SYSTEM',
    match_type: 'EXACT',
    reason: '',
    is_active: true,
    version: 1,
  });

  useEffect(() => {
    if (id) {
      loadSlug(id);
    }
  }, [id]);

  const loadSlug = async (slugId: string) => {
    try {
      setLoadingSlug(true);
      const data = await reservedSlugsApi.getById(slugId);
      setSlug(data);
      setFormData({
        type: data.type,
        match_type: data.match_type,
        reason: data.reason || '',
        is_active: data.is_active,
        items_snapshot: data.items_snapshot,
        version: data.version,
      });
    } catch (error: any) {
      console.error('Error loading slug:', error);
      toast.error('Failed to load slug: ' + error.message);
      navigate('/platform/reserved-slugs');
    } finally {
      setLoadingSlug(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !slug) return;

    try {
      setLoading(true);
      await reservedSlugsApi.update(id, formData);
      toast.success('Reserved slug updated successfully');
      navigate(`/platform/reserved-slugs/${id}`);
    } catch (error: any) {
      console.error('Error updating slug:', error);
      
      if (error.message.includes('Version conflict') || error.message.includes('409')) {
        toast.error('Slug was updated by someone else. Reloading...');
        if (id) loadSlug(id);
      } else {
        toast.error('Failed to update: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingSlug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading slug...</p>
        </div>
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Slug not found</p>
          <Button onClick={() => navigate('/platform/reserved-slugs')} className="mt-4">
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FormPageLayout
      mode="edit"
      title="Edit Reserved Slug"
      description={`Update ${slug?.slug || 'slug'}`}
      icon={Shield}
      backPath="/platform/reserved-slugs"
      backLabel="Back to list"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Read-only Info */}
        <Card>
          <CardHeader>
            <CardTitle>Read-only Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Slug ID</Label>
              <p className="font-mono text-sm mt-1">{slug._id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Slug / Keyword</Label>
              <p className="font-mono font-semibold mt-1">{slug.slug}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="text-sm mt-1">{new Date(slug.created_at).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Updated At</Label>
                <p className="text-sm mt-1">{new Date(slug.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editable Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Editable Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type */}
            <div>
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                required
              >
                <option value="SYSTEM">SYSTEM</option>
                <option value="BUSINESS">BUSINESS</option>
                <option value="OFFENSIVE">OFFENSIVE</option>
                <option value="FUTURE">FUTURE</option>
              </select>
            </div>

            {/* Match Type */}
            <div>
              <Label htmlFor="match_type">Match Type *</Label>
              <select
                id="match_type"
                name="match_type"
                value={formData.match_type}
                onChange={handleChange}
                className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                required
              >
                <option value="EXACT">EXACT</option>
                <option value="PREFIX">PREFIX</option>
                <option value="REGEX">REGEX</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Why is this slug reserved?"
                rows={3}
                className="mt-2"
              />
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/platform/reserved-slugs')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Current version: v{slug.version} • Updating to: v{slug.version + 1}
        </p>
      </form>
    </FormPageLayout>
  );
}