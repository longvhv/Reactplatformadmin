import { Fragment, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { showToast } from '../lib/toast';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useLanguage } from '../providers/LanguageProvider';
import { TenantMembersList, TenantMember } from '../components/tenantMembers/TenantMembersList';
import { TenantMemberForm, TenantMemberFormData } from '../components/tenantMembers/TenantMemberForm';
import { tenantMembersApi } from '../api/tenantMembersApi';
import { PageLayout } from '../components/layout/PageLayout';
import { StatisticsCards } from '../components/common/StatisticsCards';
import { Button } from '../components/ui/button';
import { UserPlus, Users, CheckCircle, Clock, AlertCircle, UserX } from 'lucide-react';

// ============================================
// MAIN COMPONENT
// ============================================

export function TenantMembersPage() {
  const { t } = useLanguage();
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TenantMember | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, tenantsData, usersData] = await Promise.all([
        tenantMembersApi.getAll(),
        tenantMembersApi.fetchTenants(),
        tenantMembersApi.fetchUsers()
      ]);
      
      // Enrich members with user data
      const enrichedMembers = membersData.map(member => {
        const user = usersData.find((u: any) => u._id === member.user_id);
        return {
          ...member,
          user_name: user?.name,
          user_email: user?.email,
          user_avatar: user?.avatar,
        };
      });
      
      setMembers(enrichedMembers);
      setTenants(tenantsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle add member
  const handleAdd = () => {
    setEditingMember(null);
    setFormOpen(true);
  };

  // Handle edit member
  const handleEdit = (member: TenantMember) => {
    setEditingMember(member);
    setFormOpen(true);
  };

  // Handle delete member
  const handleDelete = async (memberId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Member',
      description: 'Are you sure you want to remove this member?',
      onConfirm: async () => {
        try {
          await tenantMembersApi.delete(memberId);
          showToast.success('Member removed successfully');
          await loadData();
        } catch (error: any) {
          showToast.error(error.message || 'Failed to remove member');
        }
      },
      variant: 'destructive',
    });
  };

  // Handle form submit
  const handleFormSubmit = async (data: TenantMemberFormData) => {
    try {
      if (editingMember) {
        await tenantMembersApi.update(editingMember._id, data);
        showToast.success('Member updated successfully');
      } else {
        await tenantMembersApi.create(data);
        showToast.success('Member added successfully');
      }
      
      await loadData();
      setFormOpen(false);
      setEditingMember(null);
    } catch (error: any) {
      showToast.error(error.message || 'Failed to save member');
      throw error;
    }
  };

  // Stats
  const stats = useMemo(() => {
    return [
      { label: t('common.total'), value: members.length, color: 'indigo' as const, icon: Users },
      { label: 'Active', value: members.filter(m => m.status === 'ACTIVE').length, color: 'green' as const, icon: CheckCircle },
      { label: 'Onboarding', value: members.filter(m => m.status === 'ONBOARDING').length, color: 'blue' as const, icon: Clock },
      { label: 'Suspended', value: members.filter(m => m.status === 'SUSPENDED').length, color: 'orange' as const, icon: AlertCircle },
      { label: 'Resigned', value: members.filter(m => m.status === 'RESIGNED').length, color: 'gray' as const, icon: UserX },
    ];
  }, [members, t]);

  return (
    <PageLayout
      title={t('tenantMembers.title')}
      description={`${members.length} ${t('tenantMembers.members')}`}
      icon={Users}
      actions={
        <Button onClick={handleAdd} className="gap-2">
          <UserPlus className="w-4 h-4" />
          {t('tenantMembers.addMember')}
        </Button>
      }
    >
      <StatisticsCards stats={stats} columns={5} className="mb-0 border-none shadow-sm" />

      <TenantMembersList
        members={members}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TenantMemberForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMember(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingMember || undefined}
        tenants={tenants}
        users={users}
        managers={members.filter(m => ['OWNER', 'ADMIN'].includes(m.role))}
        mode={editingMember ? 'edit' : 'create'}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
        confirmLabel="Remove"
        cancelLabel="Cancel"
      />
    </PageLayout>
  );
}

export default TenantMembersPage;