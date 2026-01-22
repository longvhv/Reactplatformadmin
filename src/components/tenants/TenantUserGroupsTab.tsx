/**
 * TenantUserGroupsTab Component
 * Wrapper for UserGroupList within Tenant context
 */

import { UserGroupList } from '../user-groups/UserGroupList';

interface TenantUserGroupsTabProps {
  tenantId: string;
}

export function TenantUserGroupsTab({ tenantId }: TenantUserGroupsTabProps) {
  return <UserGroupList tenantId={tenantId} />;
}

export default TenantUserGroupsTab;
