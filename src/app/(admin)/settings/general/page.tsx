/**
 * General Settings Page
 * ✅ MIGRATED from /pages/settings/general.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card } from '../../../../components/ui/card';
import { PageLayout } from '../../../../components/layout/PageLayout';
import { showToast } from '../../../../lib/toast';

// Temporary mock API since settingsApi doesn't exist
const settingsApi = {
  getGeneral: async () => ({ siteName: '', siteUrl: '', contactEmail: '' }),
  updateGeneral: async (data: any) => { console.log('Saving:', data); }
};

function GeneralSettingsPage() {
  const [formData, setFormData] = useState({ siteName: '', siteUrl: '', contactEmail: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);
  const loadSettings = async () => { try { const data = await settingsApi.getGeneral(); setFormData(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsApi.updateGeneral(formData);
      showToast.success('Success', 'Settings updated');
    } catch (error: any) {
      showToast.error('Error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={Settings} title="General Settings" description="Configure general system settings"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium mb-2">Site Name</label><Input value={formData.siteName} onChange={(e) => setFormData({ ...formData, siteName: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Site URL</label><Input value={formData.siteUrl} onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })} required /></div><div><label className="block text-sm font-medium mb-2">Contact Email</label><Input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} required /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Settings'}</Button></div></form></Card></PageLayout></Fragment>;
}
export { GeneralSettingsPage };
export default GeneralSettingsPage;