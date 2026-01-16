/**
 * Traffic Log Filters Component
 * Provides filtering options for traffic logs
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { TrafficLogFilters as FilterType } from '../../api/trafficLogsApi';

interface TrafficLogFiltersProps {
  filters: FilterType;
  onFilterChange: (filters: FilterType) => void;
  methods?: string[];
  appCodes?: string[];
  regions?: string[];
}

export const TrafficLogFilters: React.FC<TrafficLogFiltersProps> = ({
  filters,
  onFilterChange,
  methods = [],
  appCodes = [],
  regions = [],
}) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...localFilters, search: value || undefined };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterType = {};
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.values(localFilters).some((value) => value !== undefined);

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('trafficLogs.searchPlaceholder')}
            value={localFilters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* HTTP Method */}
        <Select
          value={localFilters.method || 'all'}
          onValueChange={(value) =>
            handleFilterChange('method', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('trafficLogs.method')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Code */}
        <Select
          value={localFilters.status_code?.toString() || 'all'}
          onValueChange={(value) =>
            handleFilterChange('status_code', value === 'all' ? undefined : parseInt(value))
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t('trafficLogs.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="200">200 OK</SelectItem>
            <SelectItem value="201">201 Created</SelectItem>
            <SelectItem value="204">204 No Content</SelectItem>
            <SelectItem value="301">301 Moved</SelectItem>
            <SelectItem value="302">302 Found</SelectItem>
            <SelectItem value="400">400 Bad Request</SelectItem>
            <SelectItem value="401">401 Unauthorized</SelectItem>
            <SelectItem value="403">403 Forbidden</SelectItem>
            <SelectItem value="404">404 Not Found</SelectItem>
            <SelectItem value="500">500 Server Error</SelectItem>
            <SelectItem value="502">502 Bad Gateway</SelectItem>
            <SelectItem value="503">503 Unavailable</SelectItem>
          </SelectContent>
        </Select>

        {/* Toggle Advanced Filters */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {t('common.filters')}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={handleClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            {t('common.clear')}
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* App Code */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('trafficLogs.appCode')}
            </label>
            <Select
              value={localFilters.app_code || 'all'}
              onValueChange={(value) =>
                handleFilterChange('app_code', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {appCodes.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Region */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('trafficLogs.dataRegion')}
            </label>
            <Select
              value={localFilters.data_region || 'all'}
              onValueChange={(value) =>
                handleFilterChange('data_region', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Min Latency */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('trafficLogs.minLatency')} (ms)
            </label>
            <Input
              type="number"
              placeholder="0"
              value={localFilters.min_latency || ''}
              onChange={(e) =>
                handleFilterChange('min_latency', e.target.value ? parseInt(e.target.value) : undefined)
              }
            />
          </div>

          {/* Max Latency */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('trafficLogs.maxLatency')} (ms)
            </label>
            <Input
              type="number"
              placeholder="5000"
              value={localFilters.max_latency || ''}
              onChange={(e) =>
                handleFilterChange('max_latency', e.target.value ? parseInt(e.target.value) : undefined)
              }
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('trafficLogs.startDate')}
            </label>
            <Input
              type="datetime-local"
              value={localFilters.start_date || ''}
              onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {t('trafficLogs.endDate')}
            </label>
            <Input
              type="datetime-local"
              value={localFilters.end_date || ''}
              onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
