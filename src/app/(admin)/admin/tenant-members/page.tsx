/**
 * Tenant Members Page
 * ✅ MIGRATED: Using Next.js shim for navigation
 */

'use client';

import React, { useState } from 'react';
import { Users, UserPlus, Search, Filter, MoreVertical, Edit, Trash2, UserX, Shield } from 'lucide-react';
import { useRouter } from '../../../../components/shim/next-navigation';
import { showToast } from '../../../../lib/toast';
import { ConfirmDialog } from '../../../../components/common/ConfirmDialog';
import { useLanguage } from '../../../../providers/LanguageProvider';

function TenantMembersPage() {
  const router = useRouter();
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
        const tenant = tenantsData.find((t: any) => t._id === member.tenant_id);
        return {
          ...member,
          user_name: user?.name || user?.email || 'Unknown',
          user_email: user?.email,
          tenant_name: tenant?.name || 'Unknown',
        };
      });
      
      setMembers(enrichedMembers);
      setTenants(tenantsData);
      setUsers(usersData);
    } catch (error: any) {
      showToast.error('Error', 'Failed to load tenant members');
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: TenantMemberFormData) => {
    try {
      await tenantMembersApi.create(data);
      showToast.success('Success', 'Member added successfully');
      setFormOpen(false);
      loadData();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to add member');
    }
  };

  const handleUpdate = async (data: TenantMemberFormData) => {
    if (!editingMember) return;
    
    try {
      await tenantMembersApi.update(editingMember._id, {
        ...data,
        version: editingMember.version
      });
      showToast.success('Success', 'Member updated successfully');
      setFormOpen(false);
      setEditingMember(null);
      loadData();
    } catch (error: any) {
      showToast.error('Error', error.message || 'Failed to update member');
    }
  };

  const handleDelete = (member: TenantMember) => {
    setConfirmDialog({
      open: true,
      title: 'Remove Member',
      description: `Remove ${member.user_name} from ${member.tenant_name}?`,
      onConfirm: async () => {
        try {
          await tenantMembersApi.delete(member._id);
          showToast.success('Success', 'Member removed');
          loadData();
        } catch (error: any) {
          showToast.error('Error', error.message || 'Failed to remove member');
        }
      },
      variant: 'destructive',
    });
  };

  const handleEdit = (member: TenantMember) => {
    setEditingMember(member);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingMember(null);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
    const resignedMembers = members.filter(m => m.status === 'RESIGNED').length;
    const onboardingMembers = members.filter(m => m.status === 'ONBOARDING').length;
    const suspendedMembers = members.filter(m => m.status === 'SUSPENDED').length;

    return [
      { label: 'Total Members', value: members.length, color: 'indigo' as const, icon: Users },
      { label: 'Active', value: activeMembers, color: 'green' as const, icon: CheckCircle },
      { label: 'Onboarding', value: onboardingMembers, color: 'blue' as const, icon: Clock },
      { label: 'Resigned/Suspended', value: resignedMembers + suspendedMembers, color: 'gray' as const, icon: UserX },
    ];
  }, [members]);

  return (
    <Fragment>
      <PageLayout
        icon={Users}
        title="Tenant Members"
        description="Manage tenant membership and access"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        }
      >
        <StatisticsCards stats={stats} columns={4} />

        <TenantMembersList
          members={members}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </PageLayout>

      {formOpen && (
        <TenantMemberForm
          open={formOpen}
          onClose={handleCloseForm}
          onSubmit={editingMember ? handleUpdate : handleCreate}
          initialData={editingMember || undefined}
          tenants={tenants}
          users={users}
        />
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </Fragment>
  );
}

export { TenantMembersPage };
export default TenantMembersPage;