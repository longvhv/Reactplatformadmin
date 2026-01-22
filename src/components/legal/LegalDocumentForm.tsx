'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from '../../shim/next-navigation';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { showToast } from '../../lib/toast';
import { legalDocumentsApi, LegalDocument, LegalDocumentType, LegalDocumentStatus } from '../../api/legalDocumentsApi';
import { useTenants } from '../../hooks/useTenants';
import { ArrowLeft, Save } from 'lucide-react';

const DOCUMENT_TYPES: { value: LegalDocumentType; label: string }[] = [
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'privacy_policy', label: 'Privacy Policy' },
  { value: 'cookie_policy', label: 'Cookie Policy' },
  { value: 'gdpr', label: 'GDPR' },
  { value: 'eula', label: 'EULA' },
  { value: 'sla', label: 'SLA' },
  { value: 'dpa', label: 'DPA' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: LegalDocumentStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
];

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  type: z.enum(['terms_of_service', 'privacy_policy', 'cookie_policy', 'gdpr', 'eula', 'sla', 'dpa', 'other']),
  version: z.string().min(1, 'Version is required'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  effective_date: z.string().optional(), // Date input returns string
  expiry_date: z.string().optional(),
  tenant_id: z.string().optional(),
  language: z.string().default('vi'),
  is_active: z.boolean().default(true),
  metadata: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid JSON format'),
  version_number: z.number().optional(), // Optimistic locking
});

type FormValues = z.infer<typeof formSchema>;

interface LegalDocumentFormProps {
  initialData?: LegalDocument;
  isEdit?: boolean;
}

export function LegalDocumentForm({ initialData, isEdit = false }: LegalDocumentFormProps) {
  const router = useRouter();
  const { tenants } = useTenants();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      slug: initialData?.slug || '',
      type: initialData?.type || 'terms_of_service',
      version: initialData?.version || '1.0',
      content: initialData?.content || '',
      summary: initialData?.summary || '',
      status: initialData?.status || 'draft',
      effective_date: initialData?.effective_date ? new Date(initialData.effective_date).toISOString().split('T')[0] : '',
      expiry_date: initialData?.expiry_date ? new Date(initialData.expiry_date).toISOString().split('T')[0] : '',
      tenant_id: initialData?.tenant_id || '',
      language: initialData?.language || 'vi',
      is_active: initialData?.is_active ?? true,
      metadata: initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : '{}',
      version_number: initialData?.version_number,
    },
  });

  // Auto-generate slug from title if slug is not manually touched or is empty
  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const currentSlug = form.getValues('slug');
    if (title && (!currentSlug || !isEdit)) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue('slug', slug);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload: any = {
        ...values,
        metadata: values.metadata ? JSON.parse(values.metadata) : {},
        // Ensure empty strings are treated as undefined for dates if needed, or stick to string
        effective_date: values.effective_date || undefined,
        expiry_date: values.expiry_date || undefined,
        tenant_id: values.tenant_id || undefined, // Send undefined if empty string for Global
      };

      if (isEdit && initialData?._id) {
        await legalDocumentsApi.update(initialData._id, payload);
        showToast.success('Success', 'Legal document updated successfully');
      } else {
        await legalDocumentsApi.create(payload);
        showToast.success('Success', 'Legal document created successfully');
      }
      router.push('/platform/legal-documents');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving legal document:', error);
      if (error?.response?.status === 409) {
         showToast.error('Conflict', 'The document has been modified by another user. Please refresh and try again.');
      } else {
         showToast.error('Error', error.message || 'Failed to save legal document');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => router.push('/platform/legal-documents')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Edit Legal Document' : 'New Legal Document'}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/platform/legal-documents')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
                <CardDescription>
                  Basic information about the legal document.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Terms of Service" 
                          {...field} 
                          onBlur={(e) => {
                            field.onBlur();
                            handleTitleBlur(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="terms-of-service" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content (Markdown)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="# Terms of Service\n\nWelcome..." 
                          className="min-h-[400px] font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief summary..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>
                  Additional JSON metadata for the document.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <FormField
                  control={form.control}
                  name="metadata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>JSON Data</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="{}" 
                          className="font-mono min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tenant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Global (All Tenants)</SelectItem>
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant._id} value={tenant._id}>
                              {tenant.name} ({tenant.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Leave empty for global documents.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="effective_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effective Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Active
                        </FormLabel>
                        <FormDescription>
                          Make this document available to users.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
