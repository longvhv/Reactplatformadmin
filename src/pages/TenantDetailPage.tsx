/**
 * TenantDetailPage Component - Sidebar Layout
 * 
 * Full-screen layout with vertical sidebar navigation
 * Tabs: Overview, Edit, Members, Departments, User Groups, Locations, SSO Configs, Children, Activity
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Edit, Save, X, Loader2, Building2, Users, Activity, 
  Settings, Building, MapPin, Shield, GitBranch 
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { useTenants } from "@/hooks/useTenants";
import { Button } from "@/components/ui/button";
import { TenantOverview } from "@/components/tenants/TenantOverview";
import { BasicInfoTab } from "@/components/tenants/form-tabs/BasicInfoTab";
import { InfrastructureTab } from "@/components/tenants/form-tabs/InfrastructureTab";
import { SubscriptionTab } from "@/components/tenants/form-tabs/SubscriptionTab";
import { SettingsTab } from "@/components/tenants/form-tabs/SettingsTab";
import { TenantMembersTab } from "@/components/tenants/TenantMembersTab";
import { TenantDepartmentsTab } from "@/components/tenants/TenantDepartmentsTab";
import { TenantUserGroupsTab } from "@/components/tenants/TenantUserGroupsTab";
import { TenantLocationsTab } from "@/components/tenants/TenantLocationsTab";
import { TenantSSOConfigsTab } from "@/components/tenants/TenantSSOConfigsTab";
import type { Tenant } from "@/data/tenants";

type TabType = "overview" | "edit" | "members" | "departments" | "userGroups" | "locations" | "ssoConfigs" | "children" | "activity";

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const { getTenant, updateTenant } = useTenants({ autoLoad: false });
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [formData, setFormData] = useState<Partial<Tenant>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load tenant data
  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const data = await getTenant(id);
      if (data) {
        setTenant(data);
        setFormData(data);
      }
    } catch (err) {
      console.error("Error loading tenant:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle nested field change
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof Tenant] as any || {}),
        [field]: value
      }
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.code?.trim()) {
      newErrors.code = "Code is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      newErrors.code = "Code must contain only lowercase letters, numbers, and hyphens";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm() || !tenant || !id) return;

    setSaving(true);
    try {
      const updated = await updateTenant(id, {
        ...formData,
        version: tenant.version
      });
      
      setTenant(updated);
      setFormData(updated);
      setActiveTab("overview");
    } catch (err) {
      console.error("Error saving tenant:", err);
      alert(err instanceof Error ? err.message : "Failed to save tenant");
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData(tenant || {});
    setErrors({});
    setActiveTab("overview");
  };

  // Sidebar navigation items
  const navItems = [
    { id: "overview", label: "Overview", icon: Building2, group: "main" },
    { id: "edit", label: "Edit Details", icon: Edit, group: "main" },
    { id: "members", label: "Members", icon: Users, group: "organization" },
    { id: "departments", label: "Departments", icon: Building, group: "organization" },
    { id: "userGroups", label: "User Groups", icon: Users, group: "organization" },
    { id: "locations", label: "Locations", icon: MapPin, group: "organization" },
    { id: "ssoConfigs", label: "SSO Configs", icon: Shield, group: "security" },
    { id: "children", label: "Child Tenants", icon: GitBranch, group: "hierarchy" },
    { id: "activity", label: "Activity Log", icon: Activity, group: "other" },
  ];

  // Group navigation items
  const groupedNavItems = [
    { 
      title: null, 
      items: navItems.filter(item => item.group === "main") 
    },
    { 
      title: "Organization", 
      items: navItems.filter(item => item.group === "organization") 
    },
    { 
      title: "Security", 
      items: navItems.filter(item => item.group === "security") 
    },
    { 
      title: "Other", 
      items: navItems.filter(item => item.group === "hierarchy" || item.group === "other") 
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t("errors.notFound") || "Tenant not found"}</p>
          <Button onClick={() => navigate("/tenants")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("common.back") || "Back to Tenants"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/tenants")}
            className="w-full justify-start mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tenants
          </Button>
          <div>
            <h2 className="font-semibold text-gray-900 truncate">{tenant.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {tenant.code} • {tenant.tier}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {groupedNavItems.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              {group.title && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.title}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Actions */}
        {activeTab === "edit" && (
          <div className="p-4 border-t border-gray-200 space-y-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
              size="sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="w-full"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {activeTab === "overview" && (
            <TenantOverview tenant={tenant} />
          )}

          {activeTab === "edit" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Tenant Details</h1>
                <p className="text-gray-500">Update tenant information and settings</p>
              </div>

              {/* Basic Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Basic Information
                </h2>
                <BasicInfoTab
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                  onNestedChange={handleNestedChange}
                />
              </div>

              {/* Infrastructure */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Infrastructure
                </h2>
                <InfrastructureTab
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                />
              </div>

              {/* Subscription */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Subscription
                </h2>
                <SubscriptionTab
                  formData={formData}
                  errors={errors}
                  onChange={handleFieldChange}
                />
              </div>

              {/* Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">
                  Settings
                </h2>
                <SettingsTab
                  formData={formData}
                  errors={errors}
                  onChange={handleNestedChange}
                />
              </div>
            </div>
          )}

          {activeTab === "members" && id && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Members</h1>
                <p className="text-gray-500">Manage tenant members and their roles</p>
              </div>
              <TenantMembersTab tenantId={id} />
            </div>
          )}

          {activeTab === "departments" && id && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Departments</h1>
                <p className="text-gray-500">Organize members into departments</p>
              </div>
              <TenantDepartmentsTab tenantId={id} />
            </div>
          )}

          {activeTab === "userGroups" && id && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">User Groups</h1>
                <p className="text-gray-500">Manage user groups and permissions</p>
              </div>
              <TenantUserGroupsTab tenantId={id} />
            </div>
          )}

          {activeTab === "locations" && id && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Locations</h1>
                <p className="text-gray-500">Manage physical locations and branches</p>
              </div>
              <TenantLocationsTab tenantId={id} />
            </div>
          )}

          {activeTab === "ssoConfigs" && id && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">SSO Configurations</h1>
                <p className="text-gray-500">Configure single sign-on integrations</p>
              </div>
              <TenantSSOConfigsTab tenantId={id} />
            </div>
          )}

          {activeTab === "children" && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Child Tenants
              </h3>
              <p className="text-gray-500">
                Hierarchical tenant management coming soon
              </p>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Activity Log
              </h3>
              <p className="text-gray-500">
                Audit trail and activity history coming soon
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
