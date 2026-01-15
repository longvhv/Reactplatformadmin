/**
 * Reserved Slugs List Page
 * Production-ready with stats, filters, and bulk actions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  reservedSlugsApi, 
  ReservedSlug,
  SlugType,
  MatchType,
  getTypeColor,
  getTypeLabel,
  getMatchTypeLabel,
  getMatchTypeIcon,
  useReservedSlugStats
} from '../api/reservedSlugsApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Plus, 
  Search, 
  Filter, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function ReservedSlugsPage() {
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refresh: refreshStats } = useReservedSlugStats();
  
  const [slugs, setSlugs] = useState<ReservedSlug[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<SlugType | ''>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadSlugs();
  }, [typeFilter, activeFilter]);

  const loadSlugs = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (typeFilter) filters.type = typeFilter;
      if (activeFilter !== 'all') filters.is_active = activeFilter === 'active';
      
      const data = await reservedSlugsApi.getAll(filters);
      setSlugs(data);
    } catch (error: any) {
      toast.error('Failed to load reserved slugs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Are you sure you want to delete "${slug}"?`)) return;
    
    try {
      await reservedSlugsApi.delete(id);
      toast.success(`Deleted "${slug}"`);
      loadSlugs();
      refreshStats();
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await reservedSlugsApi.deactivate(id);
        toast.success('Slug deactivated');
      } else {
        await reservedSlugsApi.activate(id);
        toast.success('Slug activated');
      }
      loadSlugs();
      refreshStats();
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    }
  };

  // Filter by search
  const filteredSlugs = slugs.filter(slug => 
    slug.slug.toLowerCase().includes(search.toLowerCase()) ||
    (slug.reason && slug.reason.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/90 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-foreground">
                Reserved Slugs
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage system-wide reserved slugs and keywords
            </p>
          </div>
          <Button
            onClick={() => navigate('/core/reserved-slugs/add')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Slug
          </Button>
        </div>

        {/* Stats Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Slugs</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Offensive</p>
                    <p className="text-2xl font-bold text-red-600">{stats.byType.OFFENSIVE}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search slugs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as SlugType | '')}
                className="px-3 py-2 border border-input rounded-lg bg-background"
              >
                <option value="">All Types</option>
                <option value="SYSTEM">System</option>
                <option value="BUSINESS">Business</option>
                <option value="OFFENSIVE">Offensive</option>
                <option value="FUTURE">Future</option>
              </select>

              {/* Active Filter */}
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value as any)}
                className="px-3 py-2 border border-input rounded-lg bg-background"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <Button
                variant="outline"
                onClick={loadSlugs}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : filteredSlugs.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No reserved slugs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Slug</th>
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Match</th>
                      <th className="text-left py-3 px-4 font-semibold">Reason</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-right py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSlugs.map((slug) => (
                      <tr 
                        key={slug._id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/core/reserved-slugs/${slug._id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-mono font-semibold">{slug.slug}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getTypeColor(slug.type)}>
                            {getTypeLabel(slug.type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground font-mono">
                            {getMatchTypeIcon(slug.match_type)} {getMatchTypeLabel(slug.match_type)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground line-clamp-1">
                            {slug.reason || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {slug.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/core/reserved-slugs/${slug._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/core/reserved-slugs/edit/${slug._id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(slug._id, slug.is_active)}
                            >
                              {slug.is_active ? (
                                <XCircle className="h-4 w-4 text-gray-600" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(slug._id, slug.slug)}
                              className="hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredSlugs.length} of {slugs.length} slugs
        </div>
      </div>
    </div>
  );
}
