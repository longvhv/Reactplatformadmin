/**
 * Security Settings Page
 * ✅ MIGRATED from /pages/settings/security.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { settingsApi } from '@/api/settingsApi';
import { showToast } from '@/lib/toast';

function SecuritySettingsPage() {
  const [formData, setFormData] = useState({ twoFactorEnabled: false, sessionTimeout: 30, passwordMinLength: 8 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);
  const loadSettings = async () => { try { const data = await settingsApi.getSecurity(); setFormData(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsApi.updateSecurity(formData);
      showToast.success('Success', 'Security settings updated');
    } catch (error: any) {
      showToast.error('Error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return <Fragment><PageLayout icon={Shield} title="Security Settings" description="Configure security and authentication settings"><Card className="p-6"><form onSubmit={handleSubmit} className="space-y-4"><div className="flex items-center gap-3"><input type="checkbox" checked={formData.twoFactorEnabled} onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })} className="w-4 h-4" /><label className="text-sm font-medium">Enable Two-Factor Authentication</label></div><div><label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label><Input type="number" value={formData.sessionTimeout} onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })} required /></div><div><label className="block text-sm font-medium mb-2">Password Min Length</label><Input type="number" value={formData.passwordMinLength} onChange={(e) => setFormData({ ...formData, passwordMinLength: parseInt(e.target.value) })} required /></div><div className="flex gap-2 pt-4"><Button type="submit" disabled={saving}><Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : 'Save Settings'}</Button></div></form></Card></PageLayout></Fragment>;
}
export { SecuritySettingsPage };
export default SecuritySettingsPage;
