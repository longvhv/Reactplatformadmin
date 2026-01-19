/**
 * Add Reserved Slug Page
 * Production-ready form with validation
 * ✅ UPDATED 2026-01-15: Unified design with FormPageLayout
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  reservedSlugsApi,
  CreateReservedSlugRequest,
  SlugType,
  MatchType,
  validateSlugFormat,
  normalizeSlug,
} from '../api/reservedSlugsApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FormPageLayout } from '../components/layouts/FormPageLayout';
import { Save, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function AddReservedSlugPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState<string>('');
  
  const [formData, setFormData] = useState<CreateReservedSlugRequest>({
    slug: '',
    type: 'SYSTEM',
    match_type: 'EXACT',
    reason: '',
    is_active: true,
    // items_snapshot removed - will be set to null by API
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear slug error when user types
    if (name === 'slug') {
      setSlugError('');
    }
  };

  const handleSlugBlur = () => {
    if (formData.slug) {
      const normalized = normalizeSlug(formData.slug);
      setFormData(prev => ({ ...prev, slug: normalized }));
      
      const validation = validateSlugFormat(normalized);
      if (!validation.valid) {
        setSlugError(validation.error || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate slug
    const validation = validateSlugFormat(formData.slug);
    if (!validation.valid) {
      setSlugError(validation.error || '');
      toast.error('Please fix the slug format');
      return;
    }

    // Check if slug already reserved
    try {
      const check = await reservedSlugsApi.checkSlug(formData.slug);
      if (check.reserved) {
        setSlugError('This slug is already reserved');
        toast.error('Slug already exists');
        return;
      }
    } catch (error: any) {
      console.error('Error checking slug:', error);
    }

    // Create slug
    try {
      setLoading(true);
      const created = await reservedSlugsApi.create(formData);
      toast.success(`Reserved slug "${created.slug}" created successfully`);
      navigate(`/platform/reserved-slugs/${created._id}`);
    } catch (error: any) {
      console.error('Error creating slug:', error);
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        setSlugError('This slug is already reserved');
        toast.error('Slug already exists');
      } else {
        toast.error('Failed to create reserved slug: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPageLayout
      mode="add"
      title="Add Reserved Slug"
      description="Create a new system-reserved slug"
      icon={Shield}
      backPath="/platform/reserved-slugs"
      backLabel="Quay lại danh sách"
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Slug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Slug */}
            <div>
              <Label htmlFor="slug">Slug / Keyword *</Label>
              <Input
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                onBlur={handleSlugBlur}
                placeholder="admin"
                required
                className={`mt-2 font-mono ${slugError ? 'border-red-500' : ''}`}
              />
              {slugError && (
                <p className="text-sm text-red-600 mt-1">{slugError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Only lowercase letters, numbers, and hyphens. Auto-normalized on blur.
              </p>
            </div>

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
                <option value="SYSTEM">SYSTEM - System/technical slugs</option>
                <option value="BUSINESS">BUSINESS - Business-related slugs</option>
                <option value="OFFENSIVE">OFFENSIVE - Offensive/inappropriate words</option>
                <option value="FUTURE">FUTURE - Reserved for future use</option>
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
                <option value="EXACT">EXACT - Exact match only</option>
                <option value="PREFIX">PREFIX - Match if starts with slug</option>
                <option value="REGEX">REGEX - Regular expression pattern</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.match_type === 'EXACT' && 'Blocks only exact matches (e.g., "admin" blocks "admin" but not "admin-panel")'}
                {formData.match_type === 'PREFIX' && 'Blocks anything starting with this (e.g., "admin" blocks "admin", "admin-panel", "admin123")'}
                {formData.match_type === 'REGEX' && 'Use regex pattern for complex matching (advanced)'}
              </p>
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
                Active (immediately enforce this reservation)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/platform/reserved-slugs')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !!slugError}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Reserved Slug
              </>
            )}
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
}