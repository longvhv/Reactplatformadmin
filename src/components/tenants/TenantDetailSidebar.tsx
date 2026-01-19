/**
 * Tenant Detail Sidebar Component
 * Secondary navigation for tenant detail pages with grouped collapsible tabs
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import {
  LayoutDashboard,
  FileText,
  Activity,
  Settings,
  Sliders,
  Palette,
  Globe,
  Users,
  Shield,
  Lock,
  Key,
  Target,
  Route,
  Clock,
  HardDrive,
  RefreshCcw,
  ShoppingCart,
  Receipt,
  BarChart3,
  Webhook,
  KeyRound,
  Plug,
  TrendingUp,
  FileSearch,
  Radio,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  ChevronsDown,
  Building2,
  UserCircle,
} from 'lucide-react';

// Tab item type
interface TenantTab {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  status?: 'active' | 'planned' | 'beta';
}

// Tab group type
interface TenantTabGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  tabs: TenantTab[];
  defaultExpanded?: boolean;
}

// Tab groups configuration
const TENANT_TAB_GROUPS: TenantTabGroup[] = [
  {
    id: 'overview',
    label: 'Overview & Info',
    icon: <LayoutDashboard className="w-4 h-4" />,
    defaultExpanded: true,
    tabs: [
      {
        label: 'Overview',
        path: 'overview',
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        label: 'Details',
        path: 'details',
        icon: <FileText className="w-4 h-4" />,
      },
      {
        label: 'Activity',
        path: 'activity',
        icon: <Activity className="w-4 h-4" />,
      },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: <Settings className="w-4 h-4" />,
    defaultExpanded: true,
    tabs: [
      {
        label: 'Settings',
        path: 'settings',
        icon: <Settings className="w-4 h-4" />,
      },
      {
        label: 'Features',
        path: 'features',
        icon: <Sliders className="w-4 h-4" />,
      },
      {
        label: 'Branding',
        path: 'branding',
        icon: <Palette className="w-4 h-4" />,
      },
      {
        label: 'Domains',
        path: 'domains',
        icon: <Globe className="w-4 h-4" />,
      },
    ],
  },
  {
    id: 'users',
    label: 'Users & Access',
    icon: <Users className="w-4 h-4" />,
    defaultExpanded: true,
    tabs: [
      {
        label: 'Members',
        path: 'members',
        icon: <UserCircle className="w-4 h-4" />,
      },
      {
        label: 'Roles',
        path: 'roles',
        icon: <Shield className="w-4 h-4" />,
      },
      {
        label: 'User Groups',
        path: 'user-groups',
        icon: <Users className="w-4 h-4" />,
      },
      {
        label: 'Delegations',
        path: 'delegations',
        icon: <UserCircle className="w-4 h-4" />,
      },
      {
        label: 'SSO Config',
        path: 'sso',
        icon: <Key className="w-4 h-4" />,
      },
    ],
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: <Building2 className="w-4 h-4" />,
    defaultExpanded: true,
    tabs: [
      {
        label: 'Departments',
        path: 'departments',
        icon: <Building2 className="w-4 h-4" />,
      },
      {
        label: 'Locations',
        path: 'locations',
        icon: <Globe className="w-4 h-4" />,
      },
    ],
  },
  {
    id: 'resources',
    label: 'Platform Resources',
    icon: <Target className="w-4 h-4" />,
    defaultExpanded: false,
    tabs: [
      {
        label: 'Applications',
        path: 'applications',
        icon: <Target className="w-4 h-4" />,
      },
      {
        label: 'App Routes',
        path: 'routes',
        icon: <Route className="w-4 h-4" />,
      },
      {
        label: 'Rate Limits',
        path: 'rate-limits',
        icon: <Clock className="w-4 h-4" />,
      },
      {
        label: 'Storage',
        path: 'storage',
        icon: <HardDrive className="w-4 h-4" />,
        status: 'planned',
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing & Commerce',
    icon: <ShoppingCart className="w-4 h-4" />,
    defaultExpanded: false,
    tabs: [
      {
        label: 'Subscription',
        path: 'subscription',
        icon: <RefreshCcw className="w-4 h-4" />,
      },
      {
        label: 'Orders',
        path: 'orders',
        icon: <ShoppingCart className="w-4 h-4" />,
      },
      {
        label: 'Invoices',
        path: 'invoices',
        icon: <Receipt className="w-4 h-4" />,
        status: 'planned',
      },
      {
        label: 'Usage & Billing',
        path: 'usage',
        icon: <BarChart3 className="w-4 h-4" />,
        status: 'planned',
      },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations & API',
    icon: <Plug className="w-4 h-4" />,
    defaultExpanded: false,
    tabs: [
      {
        label: 'Webhooks',
        path: 'webhooks',
        icon: <Webhook className="w-4 h-4" />,
      },
      {
        label: 'API Keys',
        path: 'api-keys',
        icon: <KeyRound className="w-4 h-4" />,
        status: 'planned',
      },
      {
        label: 'Connected Apps',
        path: 'integrations',
        icon: <Plug className="w-4 h-4" />,
        status: 'planned',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & Monitoring',
    icon: <TrendingUp className="w-4 h-4" />,
    defaultExpanded: false,
    tabs: [
      {
        label: 'Analytics',
        path: 'analytics',
        icon: <TrendingUp className="w-4 h-4" />,
        status: 'planned',
      },
      {
        label: 'Audit Logs',
        path: 'audit-logs',
        icon: <FileSearch className="w-4 h-4" />,
        status: 'planned',
      },
      {
        label: 'API Activity',
        path: 'api-logs',
        icon: <Radio className="w-4 h-4" />,
        status: 'planned',
      },
    ],
  },
];

interface TenantDetailSidebarProps {
  tenant?: {
    _id: string;
    name: string;
    status: 'active' | 'inactive' | 'suspended';
  };
}

export function TenantDetailSidebar({ tenant }: TenantDetailSidebarProps) {
  const location = useLocation();
  const { tenant_id } = useParams();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Initialize expanded state from localStorage or defaults
  useEffect(() => {
    const savedState = localStorage.getItem('tenant_sidebar_expanded_groups');
    if (savedState) {
      setExpandedGroups(JSON.parse(savedState));
    } else {
      // Set default expanded state
      const defaultState: Record<string, boolean> = {};
      TENANT_TAB_GROUPS.forEach((group) => {
        defaultState[group.id] = group.defaultExpanded ?? false;
      });
      setExpandedGroups(defaultState);
    }
  }, []);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('tenant_sidebar_expanded_groups', JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    TENANT_TAB_GROUPS.forEach((group) => {
      allExpanded[group.id] = true;
    });
    setExpandedGroups(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    TENANT_TAB_GROUPS.forEach((group) => {
      allCollapsed[group.id] = false;
    });
    setExpandedGroups(allCollapsed);
  };

  const isActiveTab = (path: string) => {
    return location.pathname.endsWith(`/${path}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'inactive':
        return 'text-gray-600 bg-gray-50';
      case 'suspended':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const allExpanded = TENANT_TAB_GROUPS.every((group) => expandedGroups[group.id]);
  const allCollapsed = TENANT_TAB_GROUPS.every((group) => !expandedGroups[group.id]);

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
      {/* Back button */}
      <div className="p-4 border-b border-gray-200">
        <Link
          to="/admin/tenants"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tenants</span>
        </Link>
      </div>

      {/* Tenant header */}
      {tenant && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {tenant.name}
              </h2>
              <p className="text-xs text-gray-500 font-mono truncate mt-1">
                ID: {tenant._id}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            {getStatusIcon(tenant.status)}
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                tenant.status
              )}`}
            >
              {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Divider with expand/collapse controls */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-gray-200" />
          <button
            onClick={allExpanded ? collapseAll : expandAll}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title={allExpanded ? 'Collapse all' : 'Expand all'}
          >
            {allExpanded ? (
              <ChevronsRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronsDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Tab groups */}
        {TENANT_TAB_GROUPS.map((group, index) => {
          const isExpanded = expandedGroups[group.id] ?? group.defaultExpanded;
          const hasActiveTab = group.tabs.some((tab) => isActiveTab(tab.path));
          const needsDivider = index === 4; // Before Platform Resources group

          return (
            <div key={group.id}>
              {/* Section divider for secondary groups */}
              {needsDivider && (
                <div className="h-px bg-gray-200 my-4" />
              )}

              <div className="space-y-1">
                {/* Group header - collapsible */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    hasActiveTab
                      ? 'text-indigo-600 font-medium bg-indigo-50/50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {group.icon}
                    <h3 className="text-xs font-semibold uppercase tracking-wider">
                      {group.label}
                    </h3>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Group tabs - conditional render */}
                {isExpanded && (
                  <div className="ml-3 pl-3 border-l-2 border-indigo-100 space-y-0.5">
                    {group.tabs.map((tab) => {
                      const isActive = isActiveTab(tab.path);
                      const isDisabled = tab.status === 'planned';

                      return (
                        <Link
                          key={tab.path}
                          to={
                            isDisabled
                              ? '#'
                              : `/admin/tenants/${tenant_id}/${tab.path}`
                          }
                          className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors group ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-600 font-medium'
                              : isDisabled
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          onClick={(e) => isDisabled && e.preventDefault()}
                        >
                          <div className="flex items-center gap-3">
                            {tab.icon}
                            <span className="text-sm">{tab.label}</span>
                          </div>

                          {/* Status badges */}
                          <div className="flex items-center gap-1">
                            {tab.badge !== undefined && tab.badge > 0 && (
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  isActive
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {tab.badge}
                              </span>
                            )}

                            {tab.status === 'beta' && (
                              <span className="px-1.5 py-0.5 text-xs font-medium text-purple-600 bg-purple-100 rounded">
                                Beta
                              </span>
                            )}

                            {tab.status === 'planned' && (
                              <span className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded">
                                Soon
                              </span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200">
        <Link
          to={`/admin/tenants/${tenant_id}/settings`}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Tenant Settings</span>
        </Link>
      </div>
    </aside>
  );
}