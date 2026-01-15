/**
 * Reserved Slug Detail Page
 * View-only page with full information
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  reservedSlugsApi,
  ReservedSlug,
  getTypeColor,
  getTypeLabel,
  getMatchTypeLabel,
  getMatchTypeIcon,
} from '../api/reservedSlugsApi';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Edit, Trash2, RefreshCw, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function ReservedSlugDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<ReservedSlug | null>(null);

  useEffect(() => {
    if (id) {
      loadSlug(id);
    }
  }, [id]);

  const loadSlug = async (slugId: string) => {
    try {
      setLoading(true);
      const data = await reservedSlugsApi.getById(slugId);
      setSlug(data);
    } catch (error: any) {
      toast.error('Failed to load slug: ' + error.message);
      navigate('/core/reserved-slugs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!slug || !id) return;
    
    if (!confirm(`Are you sure you want to delete "${slug.slug}"?`)) return;
    
    try {
      await reservedSlugsApi.delete(id);
      toast.success(`Deleted "${slug.slug}"`);
      navigate('/core/reserved-slugs');
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleToggleActive = async () => {
    if (!slug || !id) return;
    
    try {
      if (slug.is_active) {
        await reservedSlugsApi.deactivate(id);
        toast.success('Slug deactivated');
      } else {
        await reservedSlugsApi.activate(id);
        toast.success('Slug activated');
      }
      loadSlug(id);
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!slug) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/core/reserved-slugs')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to list
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl font-bold text-foreground font-mono">
                  {slug.slug}
                </span>
              </h1>
              <p className="text-muted-foreground mt-2">
                Reserved Slug Details
              </p>
            </div>
            <div className="flex items-center gap-2">
              {slug.is_active ? (
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
              )}
              <Badge className={getTypeColor(slug.type)}>
                {getTypeLabel(slug.type)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate(`/core/reserved-slugs/edit/${id}`)}
            className="bg-primary hover:bg-primary/90"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleToggleActive}
          >
            {slug.is_active ? (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Slug ID</Label>
                <p className="font-mono text-sm mt-1">{slug._id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Slug</Label>
                <p className="font-mono font-semibold mt-1">{slug.slug}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge className={getTypeColor(slug.type)}>
                    {getTypeLabel(slug.type)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Match Type</Label>
                <p className="font-mono mt-1">
                  {getMatchTypeIcon(slug.match_type)} {getMatchTypeLabel(slug.match_type)}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {slug.is_active ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Version</Label>
                <p className="mt-1">v{slug.version}</p>
              </div>
            </div>

            {slug.reason && (
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="mt-1 text-sm">{slug.reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata / Snapshot */}
        {slug.items_snapshot && Object.keys(slug.items_snapshot).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Metadata Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                {JSON.stringify(slug.items_snapshot, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Audit Info */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Created At</Label>
                <p className="text-sm mt-1">{new Date(slug.created_at).toLocaleString('vi-VN')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Updated At</Label>
                <p className="text-sm mt-1">{new Date(slug.updated_at).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Type Explanation */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-base">How This Reservation Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
              {slug.match_type === 'EXACT' && (
                <p>
                  <strong>Exact Match:</strong> This slug blocks only exact matches. 
                  For example, "{slug.slug}" is blocked, but "{slug.slug}-panel" or "my-{slug.slug}" are allowed.
                </p>
              )}
              {slug.match_type === 'PREFIX' && (
                <p>
                  <strong>Prefix Match:</strong> This slug blocks anything that starts with it. 
                  For example, "{slug.slug}", "{slug.slug}-panel", "{slug.slug}123" are all blocked.
                </p>
              )}
              {slug.match_type === 'REGEX' && (
                <p>
                  <strong>Regex Pattern:</strong> This slug uses regular expression for complex matching. 
                  The pattern "{slug.slug}" is evaluated against input strings.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
