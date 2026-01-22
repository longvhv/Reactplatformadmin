'use client';

import { useRouter } from '@/components/shim/next-navigation';
import { 
  FileCheck, Plus, Search, Filter, Trash2, Edit, CheckCircle, 
  XCircle, Clock, AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { 
  userConsentsApi, 
  UserConsent, 
  getConsentMethodLabel, 
  getConsentMethodColor,
  formatConsentStatus
} from '@/api/userConsentsApi';
import { showToast } from '@/lib/toast';
import { usersApi } from '@/api/usersApi';
import { legalDocumentsApi } from '@/api/legalDocumentsApi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export default function UserConsentsPage() {
  const router = useRouter();
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mapping for display
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [docMap, setDocMap] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [consentsData, usersData, docsData] = await Promise.all([
        userConsentsApi.getAll(),
        usersApi.getAll(),
        legalDocumentsApi.getAll()
      ]);
      
      setConsents(consentsData);

      // Create maps for quick lookup
      const uMap: Record<string, string> = {};
      usersData.forEach(u => uMap[u._id] = u.full_name);
      setUserMap(uMap);

      const dMap: Record<string, string> = {};
      docsData.forEach(d => dMap[d._id] = d.title);
      setDocMap(dMap);

    } catch (err) {
      console.error(err);
      showToast.error('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this consent record? This is a destructive action.')) return;
    try {
      await userConsentsApi.delete(id);
      showToast.success('Success', 'Consent record deleted');
      setConsents(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      showToast.error('Error', 'Failed to delete');
    }
  };

  const handleRevoke = async (id: string) => {
     if (!confirm('Are you sure you want to revoke this consent?')) return;
     try {
        await userConsentsApi.revoke(id, 'Admin revoked via platform');
        showToast.success('Success', 'Consent revoked');
        loadData(); // Reload to refresh status
     } catch (err) {
        showToast.error('Error', 'Failed to revoke');
     }
  };

  const filteredConsents = consents.filter(c => {
    const userName = userMap[c.user_id] || '';
    const docName = docMap[c.legal_document_id] || '';
    const searchLower = searchQuery.toLowerCase();
    
    return userName.toLowerCase().includes(searchLower) || 
           docName.toLowerCase().includes(searchLower) ||
           c.consent_ip?.includes(searchLower);
  });

  return (
    <PageLayout
      icon={FileCheck}
      title="User Consents"
      description="Track and manage user agreements to legal documents"
      actions={
        <Button onClick={() => router.push('/platform/user-consents/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Record
        </Button>
      }
    >
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              placeholder="Search by user, document, or IP..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
           <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConsents.map((consent) => {
                    const status = formatConsentStatus(consent);
                    return (
                  <tr key={consent._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{userMap[consent.user_id] || 'Unknown User'}</div>
                      <div className="text-xs text-gray-500 font-mono">{consent.consent_ip}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{docMap[consent.legal_document_id] || 'Unknown Doc'}</div>
                      <div className="text-xs text-gray-500">v{consent.document_version || '?'}</div>
                    </td>
                    <td className="px-6 py-4">
                        {consent.consent_method && (
                            <Badge className={getConsentMethodColor(consent.consent_method)}>
                                {getConsentMethodLabel(consent.consent_method)}
                            </Badge>
                        )}
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant="outline" className={status.color}>
                          {status.label}
                       </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(consent.consent_date), 'MMM dd, yyyy')}
                      <div className="text-xs text-gray-400">
                        {format(new Date(consent.consent_date), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/platform/user-consents/edit/${consent._id}`)}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Button>
                        {!consent.withdrawn && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevoke(consent._id)}
                                title="Revoke Consent"
                            >
                                <XCircle className="w-4 h-4 text-orange-600" />
                            </Button>
                        )}
                         <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(consent._id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )})}
                {filteredConsents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No consent records found.
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