/**
 * Tenant Card Component
 * 
 * Displays tenant information with actions
 */

import { Building2, Users, HardDrive, Calendar, Mail, Phone, Globe, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tenant, tenantStatusColors, subscriptionTierColors } from '../../data/tenants';
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

  const storagePercent = (tenant.currentStorage / tenant.maxStorage) * 100;
  const usersPercent = (tenant.currentUsers / tenant.maxUsers) * 100;

  return (
    <div 
      className="bg-card rounded-xl border border-border/40 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => navigate(`/tenants/${tenant.id}`)}
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
                {tenant.domain && (
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{tenant.slug}</p>
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
                    onClick={(e) => { e.stopPropagation(); onDelete(tenant.id); }}
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
          <Badge className={`${subscriptionTierColors[tenant.subscriptionTier]} text-white`}>
            {t(`tenants.tier.${tenant.subscriptionTier}`)}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{t('tenants.until')}: {new Date(tenant.subscriptionEndDate).toLocaleDateString('vi-VN')}</span>
          </div>
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
                {tenant.currentUsers}/{tenant.maxUsers}
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
                {tenant.currentStorage}/{tenant.maxStorage} GB
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">{tenant.billingEmail}</span>
          </div>
          {tenant.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{tenant.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}