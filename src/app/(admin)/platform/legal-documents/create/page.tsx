'use client';

import React from 'react';
import { LegalDocumentForm } from '@/components/legal/LegalDocumentForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { FileText } from 'lucide-react';

export default function CreateLegalDocumentPage() {
  return (
    <PageLayout
      icon={FileText}
      title="Create Legal Document"
      description="Create a new terms of service, privacy policy, or other legal document"
      showBackButton
      backHref="/platform/legal-documents"
    >
      <LegalDocumentForm />
    </PageLayout>
  );
}
