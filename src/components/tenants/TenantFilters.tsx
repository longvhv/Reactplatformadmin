/**
 * TenantFilters Component
 * Filter controls for tenant list
 */

import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { TenantStatus, TenantTier, DataRegion } from '../../data/tenants';
import { useTranslation } from 'react-i18next';

interface TenantFiltersProps {
  statusFilter: TenantStatus | 'all';
  tierFilter: TenantTier | 'all';
  regionFilter: DataRegion | 'all';
  hierarchyFilter: 'all' | 'root' | 'children';
  onStatusChange: (value: TenantStatus | 'all') => void;
  onTierChange: (value: TenantTier | 'all') => void;
  onRegionChange: (value: DataRegion | 'all') => void;
  onHierarchyChange: (value: 'all' | 'root' | 'children') => void;
  onClear: () => void;
}

export function TenantFilters({
  statusFilter,
  tierFilter,
  regionFilter,
  hierarchyFilter,
  onStatusChange,
  onTierChange,
  onRegionChange,
  onHierarchyChange,
  onClear,
}: TenantFiltersProps) {
  const { t } = useTranslation();

  return (
    <>
      <Select value={statusFilter} onValueChange={(v: any) => onStatusChange(v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('common.allStatuses')}</SelectItem>
          <SelectItem value="TRIAL">{t('common.trial')}</SelectItem>
          <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
          <SelectItem value="SUSPENDED">{t('common.suspended')}</SelectItem>
          <SelectItem value="CANCELLED">{t('common.cancelled')}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={tierFilter} onValueChange={(v: any) => onTierChange(v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tier" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          <SelectItem value="FREE">Free</SelectItem>
          <SelectItem value="PRO">Pro</SelectItem>
          <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          <SelectItem value="PARTNER_BASIC">Partner Basic</SelectItem>
          <SelectItem value="PARTNER_PREMIUM">Partner Premium</SelectItem>
          <SelectItem value="PARTNER_ELITE">Partner Elite</SelectItem>
        </SelectContent>
      </Select>

      <Select value={regionFilter} onValueChange={(v: any) => onRegionChange(v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Regions</SelectItem>
          <SelectItem value="ap-southeast-1">🌏 Singapore</SelectItem>
          <SelectItem value="us-east-1">🇺🇸 Virginia</SelectItem>
          <SelectItem value="eu-central-1">🇪🇺 Frankfurt</SelectItem>
        </SelectContent>
      </Select>

      <Select value={hierarchyFilter} onValueChange={(v: any) => onHierarchyChange(v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Hierarchy" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="root">Root Only</SelectItem>
          <SelectItem value="children">Children Only</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onClear}>
        Clear
      </Button>
    </>
  );
}