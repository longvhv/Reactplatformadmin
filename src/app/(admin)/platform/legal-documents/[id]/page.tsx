'use client';

import React, { useEffect, useState } from 'react';
import { LegalDocumentForm } from '@/components/legal/LegalDocumentForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { FileText } from 'lucide-react';
import { legalDocumentsApi, LegalDocument } from '@/api/legalDocumentsApi';
import { showToast } from '@/lib/toast';
import { useRouter, useParams } from '@/components/shim/next-navigation';

export default function EditLegalDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const id = params?.id as string;

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await legalDocumentsApi.getById(id);
        setDocument(data);
      } catch (err) {
        console.error(err);
        showToast.error('Error', 'Failed to load document');
        router.push('/platform/legal-documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, router]);

  if (loading) {
    return (
      <PageLayout
        icon={FileText}
        title="Edit Legal Document"
        description="Loading..."
        showBackButton
        backHref="/platform/legal-documents"
      >
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </PageLayout>
    );
  }

  if (!document) return null;

  return (
    <PageLayout
      icon={FileText}
      title={`Edit: ${document.title}`}
      description="Update document content, status, and metadata"
      showBackButton
      backHref="/platform/legal-documents"
    >
      <LegalDocumentForm initialData={document} isEdit={true} />
    </PageLayout>
  );
}