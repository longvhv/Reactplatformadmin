/**
 * Trans Component Wrapper
 * For complex translations with React components
 * Migration Phase 2 - 2026-01-16
 */

import React from 'react';
import { Trans as I18nextTrans, TransProps } from 'react-i18next';

/**
 * Enhanced Trans component with backward compatibility
 * 
 * @example
 * // Simple usage
 * <Trans i18nKey="welcome">Hello <strong>{{name}}</strong>!</Trans>
 * 
 * @example
 * // With components
 * <Trans i18nKey="terms">
 *   I agree to the <Link to="/terms">Terms of Service</Link>
 * </Trans>
 * 
 * @example
 * // With values
 * <Trans i18nKey="greeting" values={{ name: 'John', count: 5 }}>
 *   Hello <strong>{{name}}</strong>, you have {{count}} messages
 * </Trans>
 */
export function Trans(props: TransProps<string>) {
  return <I18nextTrans {...props} />;
}

/**
 * Type-safe Trans component with namespace support
 */
interface NamespacedTransProps extends Omit<TransProps<string>, 'ns'> {
  ns?: string;
}

export function NamespacedTrans({ ns = 'translation', ...props }: NamespacedTransProps) {
  return <I18nextTrans ns={ns} {...props} />;
}

// Export both as named and default
export default Trans;
