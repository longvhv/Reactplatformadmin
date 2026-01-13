/**
 * Tenant Members Management Page
 * Manage tenant-user relationships with CRUD operations
 * 
 * Features:
 * - List all tenant members with filtering
 * - Add/Edit/Delete members
 * - Offline-first with localStorage fallback
 * - i18n support
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '../providers/LanguageProvider';
import { TenantMembersList, TenantMember } from '../components/tenantMembers/TenantMembersList';
import { TenantMemberForm, TenantMemberFormData } from '../components/tenantMembers/TenantMemberForm';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// ============================================
// API FUNCTIONS
// ============================================

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

async function fetchTenantMembers(): Promise<TenantMember[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenant-members`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tenant members');
    }

    const result = await response.json();
    const members = result.data || [];
    
    // Cache to localStorage
    localStorage.setItem('tenant_members_cache', JSON.stringify(members));
    
    return members;
  } catch (error) {
    console.error('[fetchTenantMembers] Error:', error);
    
    // Fallback to localStorage
    const cached = localStorage.getItem('tenant_members_cache');
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fallback to demo data
    const demoData = localStorage.getItem('seed_tenant_members');
    if (demoData) {
      return JSON.parse(demoData);
    }
    
    return [];
  }
}

async function createTenantMember(data: TenantMemberFormData): Promise<TenantMember> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenant-members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create tenant member');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('[createTenantMember] Error:', error);
    throw error;
  }
}

async function updateTenantMember(id: string, data: Partial<TenantMemberFormData>): Promise<TenantMember> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenant-members/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update tenant member');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('[updateTenantMember] Error:', error);
    throw error;
  }
}

async function deleteTenantMember(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenant-members/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete tenant member');
    }
  } catch (error) {
    console.error('[deleteTenantMember] Error:', error);
    throw error;
  }
}

async function fetchTenants() {
  try {
    const response = await fetch(`${API_BASE_URL}/tenants`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch tenants');
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('[fetchTenants] Error:', error);
    
    // Fallback to localStorage
    const cached = localStorage.getItem('tenants_cache');
    if (cached) {
      return JSON.parse(cached);
    }
    
    return [];
  }
}

async function fetchUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch users');
    
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('[fetchUsers] Error:', error);
    
    // Fallback to localStorage
    const cached = localStorage.getItem('users_cache');
    if (cached) {
      return JSON.parse(cached);
    }
    
    return [];
  }
}

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

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, tenantsData, usersData] = await Promise.all([
        fetchTenantMembers(),
        fetchTenants(),
        fetchUsers()
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
      toast.error('Failed to load data');
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
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await deleteTenantMember(memberId);
      toast.success('Member removed successfully');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  // Handle form submit
  const handleFormSubmit = async (data: TenantMemberFormData) => {
    try {
      if (editingMember) {
        await updateTenantMember(editingMember._id, data);
        toast.success('Member updated successfully');
      } else {
        await createTenantMember(data);
        toast.success('Member added successfully');
      }
      
      await loadData();
      setFormOpen(false);
      setEditingMember(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save member');
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <TenantMembersList
        members={members}
        loading={loading}
        onAdd={handleAdd}
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
    </div>
  );
}
