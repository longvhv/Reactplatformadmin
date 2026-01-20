/**
 * Registration Source Badge Component
 * Displays registration source with appropriate styling
 */

import React from 'react';
import { Badge } from '../ui/badge';
import { useTranslation } from 'react-i18next';

interface RegistrationSourceBadgeProps {
  source?: string | null;
}

const SOURCE_STYLES: Record<string, { variant: any }> = {
  web: { variant: 'default' },
  mobile: { variant: 'secondary' },
  api: { variant: 'outline' },
  oauth: { variant: 'default' },
  google: { variant: 'default' },
  facebook: { variant: 'secondary' },
  github: { variant: 'outline' },
  email: { variant: 'default' },
  sso: { variant: 'secondary' },
  admin: { variant: 'destructive' },
  import: { variant: 'outline' },
};

export const RegistrationSourceBadge: React.FC<RegistrationSourceBadgeProps> = ({ source }) => {
  const { t } = useTranslation();
  
  if (!source) {
    return (
      <Badge variant="outline" className="text-gray-500">
        {t('common.unknown')}
      </Badge>
    );
  }

  const sourceKey = source.toLowerCase();
  const style = SOURCE_STYLES[sourceKey] || { variant: 'outline' };
  
  // Try to get translation, fallback to source itself if no translation exists
  const label = t(`common.${sourceKey}`, { defaultValue: source });

  return (
    <Badge variant={style.variant} className="font-medium">
      {label}
    </Badge>
  );
};