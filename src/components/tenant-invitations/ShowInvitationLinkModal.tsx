/**
 * Show Invitation Link Modal
 * Displays the invitation link and token for manual sharing
 */

import React, { useState } from 'react';
import { TenantInvitation, tenantInvitationsApi } from '@/api/tenantInvitationsApi';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Copy } from 'lucide-react';
import { useTranslation } from '@/providers/LanguageProvider';

interface ShowInvitationLinkModalProps {
  invitation: TenantInvitation;
  onClose: () => void;
}

export const ShowInvitationLinkModal: React.FC<ShowInvitationLinkModalProps> = ({ 
  invitation, 
  onClose 
}) => {
  const { t } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const link = tenantInvitationsApi.getInvitationLink(invitation);

  const copyLink = () => {
    navigator.clipboard.writeText(link.url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(link.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('invitations.invitationLink') || 'Invitation Link'}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  {t('invitations.shareSecurely') || 'Share Securely'}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  {t('invitations.shareSecurelyMessage') || 'This link contains a secure token. Share it only with the intended recipient.'}
                </p>
              </div>
            </div>
          </div>

          {/* Invitation URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('invitations.invitationUrl') || 'Invitation URL'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={link.url}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none"
              />
              <Button onClick={copyLink} variant="outline">
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('invitations.token') || 'Token'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={link.token}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none"
              />
              <Button onClick={copyToken} variant="outline">
                {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('invitations.tokenHelp') || 'Can be used for manual acceptance via API or CLI.'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>
            {t('common.close') || 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};
