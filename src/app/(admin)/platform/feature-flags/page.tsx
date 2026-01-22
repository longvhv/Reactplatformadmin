'use client';
import { useState, useEffect } from 'react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { Flag, Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { featureFlagsApi, FeatureFlag } from '../../../../api/featureFlagsApi';
import { showToast } from '../../../../lib/toast';

function FeatureFlagsPage() {
  const router = useRouter();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [environment, setEnvironment] = useState<string>('all');

  const loadFlags = async () => {
    try {
      setLoading(true);
      const data = await featureFlagsApi.getAll();
      setFlags(data);
    } catch (error: any) {
      console.error('Failed to load feature flags:', error);
      showToast.error('Error', 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      // Optimistic update
      setFlags(prev => prev.map(f => 
        f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f
      ));
      
      await featureFlagsApi.toggle(flag.id);
      showToast.success('Success', `Flag ${flag.flag_key} ${flag.is_enabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      // Revert on error
      setFlags(prev => prev.map(f => 
        f.id === flag.id ? { ...f, is_enabled: flag.is_enabled } : f
      ));
      showToast.error('Error', 'Failed to toggle flag');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag? This action cannot be undone.')) return;
    
    try {
      await featureFlagsApi.delete(id);
      showToast.success('Success', 'Feature flag deleted');
      setFlags(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      showToast.error('Error', 'Failed to delete feature flag');
    }
  };

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = 
      flag.flag_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flag.flag_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEnv = environment === 'all' || flag.environment === environment;
    
    return matchesSearch && matchesEnv;
  });

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
      case 'production': return <Badge className="bg-green-600 hover:bg-green-700">PROD</Badge>;
      case 'staging': return <Badge className="bg-yellow-600 hover:bg-yellow-700">STG</Badge>;
      case 'development': return <Badge className="bg-gray-600 hover:bg-gray-700">DEV</Badge>;
      default: return <Badge variant="secondary">{env}</Badge>;
    }
  };

  return (
    <PageLayout
      icon={Flag}
      title="Feature Flags"
      description="Manage feature toggles, experiments, and gradual rollouts"
      actions={
        <Button onClick={() => router.push('/platform/feature-flags/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Flag
        </Button>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by key or name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10" 
            />
          </div>
          <div className="flex gap-2">
            {['all', 'production', 'staging', 'development'].map((env) => (
              <Button
                key={env}
                variant={environment === env ? "default" : "outline"}
                size="sm"
                onClick={() => setEnvironment(env)}
                className="capitalize"
              >
                {env}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flag Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Environment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rollout</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFlags.map((flag) => (
                  <tr key={flag.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <button 
                        onClick={() => handleToggle(flag)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${flag.is_enabled ? 'bg-green-500' : 'bg-gray-200'}`}
                      >
                        <span className={`${flag.is_enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <span 
                              className="cursor-pointer hover:text-indigo-600 hover:underline"
                              onClick={() => router.push(`/platform/feature-flags/${flag.id}`)}
                            >
                              {flag.flag_name}
                            </span>
                            {getTypeBadge(flag.flag_type)}
                          </div>
                          <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
                            {flag.flag_key}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEnvBadge(flag.environment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500" 
                            style={{ width: `${flag.percentage_rollout}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{flag.percentage_rollout}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/platform/feature-flags/${flag.id}`)}
                          title="View details"
                        >
                          <Search className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/platform/feature-flags/edit/${flag.id}`)}
                          title="Edit configuration"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(flag.id)}
                          title="Delete flag"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFlags.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No feature flags found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageLayout>
  );
}

export default FeatureFlagsPage;