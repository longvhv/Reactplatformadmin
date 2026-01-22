/**
 * Feature Flag Detail Page
 * 
 * Read-only view of a feature flag.
 * Displays configuration, targeting rules, and audit information.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from '../../../../../../components/shim/next-navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Flag
} from 'lucide-react';
import { Button } from '../../../../../../components/ui/button';
import { PageLayout } from '../../../../../../components/layout/PageLayout';
import { featureFlagsApi, FeatureFlag } from '../../../../../../api/featureFlagsApi';
import { showToast } from '../../../../../../lib/toast';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../../components/ui/card';
import { Badge } from '../../../../../../components/ui/badge';
import { ConfirmDialog } from '../../../../../../components/common/ConfirmDialog';

export default function FeatureFlagDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadFlag();
    }
  }, [id]);

  const loadFlag = async () => {
    try {
      setLoading(true);
      const data = await featureFlagsApi.getById(id);
      setFlag(data);
    } catch (error: any) {
      console.error('Failed to load feature flag:', error);
      showToast.error('Error', 'Failed to load feature flag details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!flag) return;
    try {
      await featureFlagsApi.delete(flag.id);
      showToast.success('Success', 'Feature flag deleted');
      router.push('/platform/feature-flags');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to delete feature flag');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!flag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500 text-lg">Feature flag not found</p>
        <Button onClick={() => router.push('/platform/feature-flags')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
      </div>
    );
  }

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'boolean': return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Boolean</Badge>;
      case 'percentage': return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">Percentage</Badge>;
      case 'experiment': return <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Experiment</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getEnvBadge = (env: string) => {
    switch(env) {
      case 'production': return <Badge className="bg-green-600">Production</Badge>;
      case 'staging': return <Badge className="bg-yellow-600">Staging</Badge>;
      case 'development': return <Badge className="bg-gray-600">Development</Badge>;
      default: return <Badge variant="secondary">{env}</Badge>;
    }
  };

  return (
    <PageLayout
      icon={Flag}
      title={flag.flag_name}
      description={flag.flag_key}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/platform/feature-flags')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={() => router.push(`/platform/feature-flags/edit/${flag.id}`)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Overview</span>
                <div className="flex gap-2">
                  {flag.is_enabled ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Enabled
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Disabled
                    </Badge>
                  )}
                  {getEnvBadge(flag.environment)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-900">{flag.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Key</h3>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                    {flag.flag_key}
                  </code>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                  <div>{getTypeBadge(flag.flag_type)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Targeting Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Target Audience</h3>
                  <div className="capitalize">{flag.target_audience || 'All'}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Rollout Percentage</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600" 
                        style={{ width: `${flag.percentage_rollout}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{flag.percentage_rollout}%</span>
                  </div>
                </div>
              </div>

              {flag.conditions && Object.keys(flag.conditions).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" /> Advanced Conditions
                  </h3>
                  <pre className="bg-gray-50 p-4 rounded-lg border text-xs font-mono overflow-auto max-h-60">
                    {JSON.stringify(flag.conditions, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
          
          {flag.metadata && Object.keys(flag.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-600" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded-lg border text-xs font-mono overflow-auto max-h-60">
                  {JSON.stringify(flag.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Created At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(flag.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {new Date(flag.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {flag.created_by && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Created By</p>
                      <p className="text-sm text-gray-900">{flag.created_by}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">Status History</h4>
                {flag.enabled_at && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500">Last Enabled</p>
                    <p className="text-sm text-gray-900">
                      {new Date(flag.enabled_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {flag.disabled_at && (
                  <div>
                    <p className="text-xs text-gray-500">Last Disabled</p>
                    <p className="text-sm text-gray-900">
                      {new Date(flag.disabled_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {!flag.enabled_at && !flag.disabled_at && (
                  <p className="text-xs text-gray-400 italic">No status history available</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="text-xs text-gray-400 text-center">
            <p>ID: {flag.id}</p>
          </div>
        </div>
      </div>

      <ConfirmDialog 
        open={showDeleteDialog} 
        onOpenChange={setShowDeleteDialog} 
        title="Delete Feature Flag" 
        description={`Are you sure you want to delete "${flag.flag_name}"? This action cannot be undone.`} 
        onConfirm={handleDelete} 
        variant="destructive" 
      />
    </PageLayout>
  );
}