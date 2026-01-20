/**
 * TenantSelect Component
 * Select component for choosing tenant with search and current tenant info
 */

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { tenantsApi, Tenant } from '@/api/tenantsApi';
import { cn } from '@/components/ui/utils';

interface TenantSelectProps {
  value?: string;
  onChange: (tenantId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  excludeIds?: string[];
  className?: string;
}

export function TenantSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Chọn tenant...',
  excludeIds = [],
  className,
}: TenantSelectProps) {
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await tenantsApi.getAll();
      // Filter out excluded tenants
      const filtered = data.filter(t => !excludeIds.includes(t._id));
      setTenants(filtered);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTenant = tenants.find(t => t._id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn('justify-between', className)}
        >
          {selectedTenant ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{selectedTenant.name}</span>
              <span className="text-xs text-muted-foreground">({selectedTenant.code})</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm kiếm tenant..." />
          <CommandEmpty>Không tìm thấy tenant.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {tenants.map((tenant) => (
              <CommandItem
                key={tenant._id}
                value={`${tenant.name} ${tenant.code}`}
                onSelect={() => {
                  onChange(tenant._id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === tenant._id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium">{tenant.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tenant.code} • {tenant.tier}
                    </span>
                  </div>
                  {tenant.status !== 'ACTIVE' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                      {tenant.status}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}