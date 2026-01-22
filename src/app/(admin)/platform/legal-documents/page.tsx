'use client';

import { useState, useEffect } from 'react';
import { useTenants } from '../../../../hooks/useTenants';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../../../providers/LanguageProvider';
import { useRouter } from '../../../../components/shim/next-navigation';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  Archive
} from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { 
  legalDocumentsApi, 
  LegalDocument,
  DocumentType,
  DocumentStatus 
} from '../../../../api/legalDocumentsApi';
import { showToast } from '../../../../lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';

export default function LegalDocumentsPage() {
  const router = useRouter();
  const { tenants } = useTenants();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [tenantMap, setTenantMap] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const docs = await legalDocumentsApi.getAll();
      setDocuments(docs);
      
      const tMap: Record<string, string> = {};
      tenants.forEach(t => tMap[t._id] = t.name);
      setTenantMap(tMap);

    } catch (err) {
      console.error(err);
      showToast.error('Error', 'Failed to load legal documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenants.length > 0 || Object.keys(tenantMap).length === 0) {
        const tMap: Record<string, string> = {};
        tenants.forEach(t => tMap[t._id] = t.name);
        setTenantMap(tMap);
    }
  }, [tenants]);

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    try {
      await legalDocumentsApi.delete(id);
      showToast.success('Success', 'Document deleted');
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      showToast.error('Error', 'Failed to delete document');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this document?')) return;
    try {
        // Assuming current user ID is handled by backend or we pass a placeholder
        // In a real app, useAuth() would provide the user ID
        await legalDocumentsApi.archive(id, 'current-user-id'); 
        showToast.success('Success', 'Document archived');
        loadData();
    } catch (err) {
        showToast.error('Error', 'Failed to archive document');
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm('Are you sure you want to publish this document?')) return;
    try {
        await legalDocumentsApi.publish(id, 'current-user-id');
        showToast.success('Success', 'Document published');
        loadData();
    } catch (err) {
        showToast.error('Error', 'Failed to publish document');
    }
  };

  const filteredDocuments = documents.filter(d => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
        d.title.toLowerCase().includes(query) ||
        d.slug.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;

    return true;
  });

  const getStatusBadge = (status: string) => {
      const config: Record<string, { icon: any, label: string, class: string }> = {
        published: { icon: CheckCircle, label: 'Published', class: 'bg-green-100 text-green-800' },
        draft: { icon: Clock, label: 'Draft', class: 'bg-gray-100 text-gray-800' },
        archived: { icon: Archive, label: 'Archived', class: 'bg-orange-100 text-orange-800' },
      };
      
      const c = config[status] || config.draft;
      const Icon = c.icon;
      
      return (
          <Badge variant="outline" className={`border-0 ${c.class} flex items-center gap-1`}>
              <Icon className="w-3 h-3" /> {c.label}
          </Badge>
      );
  };

  return (
    <PageLayout
      icon={FileText}
      title="Legal Documents"
      description="Manage terms, policies, and other legal documents"
      actions={
        <Button onClick={() => router.push('/platform/legal-documents/create')}>
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by title or slug..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
           <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-gray-100' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
        </div>

        {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="terms_of_service">Terms of Service</option>
                  <option value="privacy_policy">Privacy Policy</option>
                  <option value="cookie_policy">Cookie Policy</option>
                  <option value="gdpr">GDPR</option>
                  <option value="eula">EULA</option>
                  <option value="sla">SLA</option>
                  <option value="dpa">DPA</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

        {loading ? (
           <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
           </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title / Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type / Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((d) => (
                  <tr key={d._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{d.title}</div>
                      <div className="text-xs text-gray-500">{d.slug}</div>
                      {d.tenant_id && (
                          <div className="mt-1 text-xs text-indigo-600 bg-indigo-50 inline-block px-1 rounded">
                              {tenantMap[d.tenant_id] || 'Specific Tenant'}
                          </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 capitalize">{d.type.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-gray-500">v{d.version}</div>
                    </td>
                    <td className="px-6 py-4">
                        {getStatusBadge(d.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{d.effective_date ? new Date(d.effective_date).toLocaleDateString() : 'N/A'}</div>
                      {d.expiry_date && <div className="text-xs text-gray-400">Expires: {new Date(d.expiry_date).toLocaleDateString()}</div>}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4 text-gray-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/platform/legal-documents/${d._id}`)}>
                                Edit Details
                            </DropdownMenuItem>
                            
                            {d.status === 'draft' && (
                                <DropdownMenuItem onClick={() => handlePublish(d._id)}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Publish
                                </DropdownMenuItem>
                            )}
                            
                            {d.status !== 'archived' && (
                                <DropdownMenuItem onClick={() => handleArchive(d._id)}>
                                    <Archive className="w-4 h-4 mr-2 text-orange-600" />
                                    Archive
                                </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => handleDelete(d._id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      No documents found.
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