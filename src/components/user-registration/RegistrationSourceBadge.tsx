/**
 * Registration Source Badge Component
 * Displays registration source with appropriate styling
 */

import React from 'react';
import { Badge } from '../ui/badge';

interface RegistrationSourceBadgeProps {
  source?: string | null;
}

const SOURCE_STYLES: Record<string, { variant: any; label: string }> = {
  web: { variant: 'default', label: 'Web' },
  mobile: { variant: 'secondary', label: 'Mobile' },
  api: { variant: 'outline', label: 'API' },
  oauth: { variant: 'default', label: 'OAuth' },
  google: { variant: 'default', label: 'Google' },
  facebook: { variant: 'secondary', label: 'Facebook' },
  github: { variant: 'outline', label: 'GitHub' },
  email: { variant: 'default', label: 'Email' },
  sso: { variant: 'secondary', label: 'SSO' },
  admin: { variant: 'destructive', label: 'Admin' },
  import: { variant: 'outline', label: 'Import' },
};

export const RegistrationSourceBadge: React.FC<RegistrationSourceBadgeProps> = ({ source }) => {
  if (!source) {
    return (
      <Badge variant="outline" className="text-gray-500">
        Unknown
      </Badge>
    );
  }

  const style = SOURCE_STYLES[source.toLowerCase()] || {
    variant: 'outline',
    label: source,
  };

  return (
    <Badge variant={style.variant} className="font-medium">
      {style.label}
    </Badge>
  );
};
