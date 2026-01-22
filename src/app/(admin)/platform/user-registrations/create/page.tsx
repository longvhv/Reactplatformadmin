/**
 * User Registrations Create Form
 * ✅ MIGRATED from /pages/platform/user-registrations/add.tsx
 */
'use client';
import { Fragment, useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { UserPlus, Save } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { userRegistrationsApi } from '../../../../../api/userRegistrationsApi';
import { showToast } from '../../../../../lib/toast';

function UserRegistrationsCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', name: '', role: 'user' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await userRegistrationsApi.create(formData);
      showToast.success('Success', 'Created successfully');
      router.push('/platform/user-registrations');
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return <Fragment><PageLayout icon={UserPlus} title="Create User Registration" description="Register new user"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Email</label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Name</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={loading}><Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save'}</Button><Button type="button" variant="outline" onClick={() => router.push('/platform/user-registrations')}>Cancel</Button></div></form></Card></PageLayout></Fragment>;
}
export { UserRegistrationsCreatePage };
export default UserRegistrationsCreatePage;
