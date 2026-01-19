/**
 * TenantCombobox Component
 * Autocomplete combobox for selecting tenants with search functionality
 * Supports thousands of tenants with debounced search
 */

import { useState, useEffect, useCallback } from 'react';
import { Check, ChevronsUpDown, Search, Building2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { tenantsApi, Tenant } from '@/api/tenantsApi';
import { useLanguage } from '@/providers/LanguageProvider';

interface TenantComboboxProps {
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  filterTier?: ('PARTNER_BASIC' | 'PARTNER_PREMIUM' | 'PARTNER_ELITE' | 'PROVIDER')[];
  excludeId?: string;
  className?: string;
}

export function TenantCombobox({
  value,
  onValueChange,
  placeholder = 'Select tenant...',
  emptyText = 'No tenant found.',
  filterTier,
  excludeId,
  className,
}: TenantComboboxProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Load initial tenant if value exists
  useEffect(() => {
    if (value && !selectedTenant) {
      loadTenant(value);
    }
  }, [value]);

  // Load selected tenant details
  const loadTenant = async (tenantId: string) => {
    try {
      const tenant = await tenantsApi.getById(tenantId);
      if (tenant) {
        setSelectedTenant(tenant);
      }
    } catch (error) {
      console.error('Failed to load tenant:', error);
    }
  };

  // Search tenants with debounce
  const searchTenants = useCallback(
    async (query: string) => {
      try {
        setLoading(true);
        
        // Build filter params
        const params: any = {
          limit: 50, // Limit results for performance
        };
        
        // Add search query
        if (query) {
          params.search = query; // Search by name or domain
        }
        
        // Filter by tier if specified
        if (filterTier && filterTier.length > 0) {
          params.tier = filterTier.join(',');
        }

        const results = await tenantsApi.getAll(params);
        
        // Exclude current tenant if editing
        const filtered = excludeId 
          ? results.filter((t) => t._id !== excludeId)
          : results;
        
        setTenants(filtered);
      } catch (error) {
        console.error('Failed to search tenants:', error);
        setTenants([]);
      } finally {
        setLoading(false);
      }
    },
    [filterTier, excludeId]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) {
        searchTenants(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, open, searchTenants]);

  // Load initial results when opened
  useEffect(() => {
    if (open && tenants.length === 0) {
      searchTenants('');
    }
  }, [open]);

  const handleSelect = (tenantId: string) => {
    const tenant = tenants.find((t) => t._id === tenantId);
    setSelectedTenant(tenant || null);
    onValueChange(tenantId === value ? null : tenantId);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTenant(null);
    onValueChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedTenant ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{selectedTenant.name}</span>
              {selectedTenant.profile?.domain && (
                <span className="text-xs text-muted-foreground truncate">
                  ({selectedTenant.profile.domain})
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t('common.searchPlaceholder')}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {/* Clear option */}
                  {value && (
                    <CommandItem
                      value="__clear__"
                      onSelect={handleClear}
                      className="text-muted-foreground"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="h-4 w-4" />
                        <span>{t('common.clear')}</span>
                      </div>
                    </CommandItem>
                  )}
                  
                  {tenants.map((tenant) => (
                    <CommandItem
                      key={tenant._id}
                      value={tenant._id}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === tenant._id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{tenant.name}</span>
                          {tenant.tier && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                              {tenant.tier}
                            </span>
                          )}
                        </div>
                        {tenant.profile?.domain && (
                          <span className="text-xs text-muted-foreground truncate">
                            {tenant.profile.domain}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}