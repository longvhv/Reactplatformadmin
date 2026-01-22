/**
 * Backup & Restore Page
 * ✅ MIGRATED from /pages/admin/backup-restore.tsx
 */
'use client';
import { Fragment, useState, useEffect } from 'react';
import { Database, Download, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageLayout } from '@/components/layout/PageLayout';
import { backupApi } from '@/api/backupApi';
import { showToast } from '@/lib/toast';

function BackupRestorePage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadBackups(); }, []);
  const loadBackups = async () => { try { setLoading(true); const data = await backupApi.getAll(); setBackups(data); } catch (error: any) { showToast.error('Error', 'Failed to load'); } finally { setLoading(false); } };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      await backupApi.create();
      showToast.success('Success', 'Backup created');
      loadBackups();
    } catch (error: any) {
      showToast.error('Error', 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = (backup: any) => {
    showToast.success('Success', 'Downloading backup...');
  };

  const handleRestore = async (backup: any) => {
    if (!confirm('Are you sure you want to restore this backup?')) return;
    try {
      await backupApi.restore(backup._id);
      showToast.success('Success', 'Backup restored');
    } catch (error: any) {
      showToast.error('Error', 'Failed to restore');
    }
  };

  const handleDelete = async (backup: any) => {
    if (!confirm('Are you sure?')) return;
    try {
      await backupApi.delete(backup._id);
      showToast.success('Success', 'Backup deleted');
      loadBackups();
    } catch (error: any) {
      showToast.error('Error', 'Failed to delete');
    }
  };

  return <Fragment><PageLayout icon={Database} title="Backup & Restore" description="Manage system backups and restore points" actions={<Button onClick={handleCreateBackup} disabled={creating}><Database className="w-4 h-4 mr-2" />{creating ? 'Creating...' : 'Create Backup'}</Button>}><Card className="p-6">{loading ? <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div> : <div className="space-y-3">{backups.map((backup) => (<div key={backup._id} className="flex items-center justify-between p-4 border rounded"><div><p className="font-medium">{backup.name}</p><p className="text-sm text-gray-500">Created {new Date(backup.created_at).toLocaleString()} • Size: {backup.size}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => handleDownload(backup)}><Download className="w-4 h-4 mr-2" />Download</Button><Button size="sm" onClick={() => handleRestore(backup)}><Upload className="w-4 h-4 mr-2" />Restore</Button><Button size="sm" variant="destructive" onClick={() => handleDelete(backup)}><Trash2 className="w-4 h-4" /></Button></div></div>))}</div>}</Card></PageLayout></Fragment>;
}
export { BackupRestorePage };
export default BackupRestorePage;
