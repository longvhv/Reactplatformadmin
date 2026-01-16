/**
 * Data Region Badge Component
 * Displays data region with appropriate styling and flags
 */

import React from 'react';
import { Badge } from '../ui/badge';

interface DataRegionBadgeProps {
  region?: string | null;
}

const REGION_CONFIG: Record<string, { label: string; flag: string; variant: any }> = {
  'us-east-1': { label: 'US East', flag: '🇺🇸', variant: 'default' },
  'us-west-1': { label: 'US West', flag: '🇺🇸', variant: 'default' },
  'eu-west-1': { label: 'EU West', flag: '🇪🇺', variant: 'secondary' },
  'eu-central-1': { label: 'EU Central', flag: '🇪🇺', variant: 'secondary' },
  'ap-southeast-1': { label: 'Asia SE', flag: '🌏', variant: 'outline' },
  'ap-northeast-1': { label: 'Asia NE', flag: '🌏', variant: 'outline' },
  'ap-south-1': { label: 'Asia South', flag: '🇮🇳', variant: 'outline' },
  'sa-east-1': { label: 'South America', flag: '🌎', variant: 'outline' },
  'ca-central-1': { label: 'Canada', flag: '🇨🇦', variant: 'default' },
  'me-south-1': { label: 'Middle East', flag: '🌍', variant: 'secondary' },
  'af-south-1': { label: 'Africa', flag: '🌍', variant: 'secondary' },
};

export const DataRegionBadge: React.FC<DataRegionBadgeProps> = ({ region }) => {
  if (!region) {
    return (
      <Badge variant="outline" className="text-gray-500">
        🌐 Unknown
      </Badge>
    );
  }

  const config = REGION_CONFIG[region.toLowerCase()] || {
    label: region,
    flag: '🌐',
    variant: 'outline',
  };

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.flag} {config.label}
    </Badge>
  );
};
