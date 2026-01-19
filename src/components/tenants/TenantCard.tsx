/**
 * Tenant Card Component
 * 
 * Displays tenant information with actions
 */

import { Building2, Users, HardDrive, Calendar, Mail, Phone, Globe, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router';
import type { Tenant } from '../../data/tenants';
import { tenantStatusColors, tenantTierColors } from '../../utils/tenant-utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useLanguage } from '../../providers/LanguageProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

interface TenantCardProps {
  tenant: Tenant;
  onEdit?: (tenant: Tenant) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (tenant: Tenant) => void;
}

export function TenantCard({ tenant, onEdit, onDelete, onViewDetails }: TenantCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Defensive: Ensure settings exists
  const settings = tenant.settings || {
    current_storage: 0,
    max_storage: 100,
    current_users: 0,
    max_users: 10,
  };

  const profile = tenant.profile || {};

  const storagePercent = settings.max_storage > 0 
    ? (settings.current_storage / settings.max_storage) * 100 
    : 0;
  const usersPercent = settings.max_users > 0 
    ? (settings.current_users / settings.max_users) * 100 
    : 0;

  return (
    <div 
      className="bg-card rounded-xl border border-border/40 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/admin/tenants/${tenant._id}`)}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold truncate">{tenant.name}</h3>
                {profile.domain && (
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">/{tenant.code}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`${tenantStatusColors[tenant.status]} text-white`}>
              {t(`tenants.status.${tenant.status}`)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onViewDetails && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(tenant); }}>
                    {t('common.viewDetails')}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(tenant); }}>
                    {t('common.edit')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => { e.stopPropagation(); onDelete(tenant._id); }}
                    className="text-destructive"
                  >
                    {t('common.delete')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="flex items-center gap-2">
          <Badge className={`${tenantTierColors[tenant.tier]} text-white`}>
            {t(`tenants.tier.${tenant.tier}`)}
          </Badge>
          {settings.subscription_end_date && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{t('tenants.until')}: {new Date(settings.subscription_end_date).toLocaleDateString('vi-VN')}</span>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Users */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">{t('tenants.users')}</span>
              </div>
              <span className="text-muted-foreground">
                {settings.current_users}/{settings.max_users}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usersPercent > 90 ? 'bg-red-500' : usersPercent > 70 ? 'bg-yellow-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(usersPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="font-medium">{t('tenants.storage')}</span>
              </div>
              <span className="text-muted-foreground">
                {settings.current_storage}/{settings.max_storage} GB
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-yellow-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(storagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="pt-4 border-t border-border/40 space-y-2">
          {profile.billing_email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="truncate">{profile.billing_email}</span>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{profile.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}