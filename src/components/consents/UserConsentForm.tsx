/**
 * UserConsentForm Component
 * Form for creating and editing user consents
 * 
 * ✅ COMPLIANT with public.user_consents schema
 * - Supports all fields including metadata
 * - Handles relationships (User, Legal Document)
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form@7.55.0';
import { toast } from 'sonner@2.0.3';
import { 
  Save, 
  X, 
  FileText, 
  Globe, 
  Smartphone, 
  Code, 
  Mail, 
  UserPlus, 
  User, 
  ShoppingCart, 
  AlertTriangle 
} from 'lucide-react';
import { 
  userConsentsApi, 
  UserConsent, 
  CreateConsentRequest, 
  UpdateConsentRequest,
  ConsentMethod,
  ConsentMethodHelper 
} from '../../api/userConsentsApi';
import { legalDocumentsApi } from '../../api/legalDocumentsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface UserConsentFormProps {
  initialData?: Partial<UserConsent>;
  userId?: string; // Pre-select user if provided
  isEdit?: boolean;
  onSuccess?: (consent: UserConsent) => void;
  onCancel?: () => void;
}

interface FormData {
  user_id: string;
  legal_document_id: string;
  consent_given: boolean;
  consent_date: string;
  consent_method: ConsentMethod;
  consent_ip: string;
  consent_user_agent: string;
  expires_at: string;
  renewal_required: boolean;
  metadata: string; // JSON string for editing
  withdrawn: boolean;
  withdrawn_date: string;
  withdrawn_reason: string;
  source_application: string;
  source_page: string;
}

export function UserConsentForm({ 
  initialData, 
  userId, 
  isEdit = false, 
  onSuccess, 
  onCancel 
}: UserConsentFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [legalDocuments, setLegalDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: {
      user_id: initialData?.user_id || userId || '',
      legal_document_id: initialData?.legal_document_id || '',
      consent_given: initialData?.consent_given ?? true,
      consent_date: initialData?.consent_date ? new Date(initialData.consent_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      consent_method: initialData?.consent_method || 'web',
      consent_ip: initialData?.consent_ip || '',
      consent_user_agent: initialData?.consent_user_agent || '',
      expires_at: initialData?.expires_at ? new Date(initialData.expires_at).toISOString().slice(0, 16) : '',
      renewal_required: initialData?.renewal_required || false,
      metadata: JSON.stringify(initialData?.metadata || {}, null, 2),
      withdrawn: initialData?.withdrawn || false,
      withdrawn_date: initialData?.withdrawn_date ? new Date(initialData.withdrawn_date).toISOString().slice(0, 16) : '',
      withdrawn_reason: initialData?.withdrawn_reason || '',
      source_application: initialData?.source_application || '',
      source_page: initialData?.source_page || '',
    }
  });

  const withdrawn = watch('withdrawn');

  // Load legal documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await legalDocumentsApi.getAll();
        setLegalDocuments(docs);
      } catch (error) {
        console.error('Failed to load legal documents', error);
        toast.error('Could not load legal documents');
      }
    };
    fetchDocs();
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Parse metadata
      let metadata = {};
      try {
        metadata = JSON.parse(data.metadata);
      } catch (e) {
        toast.error('Invalid JSON in metadata');
        setLoading(false);
        return;
      }

      const commonData = {
        consent_given: data.consent_given,
        consent_date: new Date(data.consent_date).toISOString(),
        consent_method: data.consent_method,
        consent_ip: data.consent_ip || null,
        consent_user_agent: data.consent_user_agent || null,
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
        renewal_required: data.renewal_required,
        metadata: metadata,
        withdrawn: data.withdrawn,
        withdrawn_date: data.withdrawn ? (data.withdrawn_date ? new Date(data.withdrawn_date).toISOString() : new Date().toISOString()) : null,
        withdrawn_reason: data.withdrawn ? data.withdrawn_reason : null,
        source_application: data.source_application || null,
        source_page: data.source_page || null,
      };

      let result: UserConsent;

      if (isEdit && initialData?._id) {
        // Update
        const updateData: UpdateConsentRequest = {
          ...commonData,
        };
        result = await userConsentsApi.update(initialData._id, updateData);
        toast.success('Consent updated successfully');
      } else {
        // Create
        if (!data.user_id) {
          toast.error('User ID is required');
          setLoading(false);
          return;
        }
        if (!data.legal_document_id) {
          toast.error('Legal Document is required');
          setLoading(false);
          return;
        }

        const createData: CreateConsentRequest = {
          user_id: data.user_id,
          legal_document_id: data.legal_document_id,
          ...commonData,
        };
        result = await userConsentsApi.create(createData);
        toast.success('Consent created successfully');
      }

      if (onSuccess) onSuccess(result);
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || 'Failed to save consent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="details">Chi tiết & Tracking</TabsTrigger>
          <TabsTrigger value="status">Trạng thái & JSON</TabsTrigger>
        </TabsList>

        {/* GENERAL TAB */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Liên kết người dùng và tài liệu pháp lý</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">User ID <span className="text-red-500">*</span></Label>
                  <Input 
                    id="user_id" 
                    {...register('user_id', { required: true })} 
                    disabled={isEdit || !!userId} 
                    className={errors.user_id ? "border-red-500" : ""}
                  />
                  {errors.user_id && <p className="text-sm text-red-500">User ID là bắt buộc</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_document_id">Tài liệu pháp lý <span className="text-red-500">*</span></Label>
                  <Controller
                    name="legal_document_id"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange} 
                        disabled={isEdit}
                      >
                        <SelectTrigger className={errors.legal_document_id ? "border-red-500" : ""}>
                          <SelectValue placeholder="Chọn tài liệu..." />
                        </SelectTrigger>
                        <SelectContent>
                          {legalDocuments.map((doc) => (
                            <SelectItem key={doc._id} value={doc._id}>
                              {doc.title} (v{doc.version})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.legal_document_id && <p className="text-sm text-red-500">Vui lòng chọn tài liệu</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consent_date">Ngày đồng ý</Label>
                  <Input 
                    id="consent_date" 
                    type="datetime-local" 
                    {...register('consent_date')} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consent_method">Phương thức</Label>
                  <Controller
                    name="consent_method"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web"><div className="flex items-center gap-2"><Globe className="w-4 h-4"/> Website</div></SelectItem>
                          <SelectItem value="mobile"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4"/> Mobile App</div></SelectItem>
                          <SelectItem value="api"><div className="flex items-center gap-2"><Code className="w-4 h-4"/> API</div></SelectItem>
                          <SelectItem value="email"><div className="flex items-center gap-2"><Mail className="w-4 h-4"/> Email</div></SelectItem>
                          <SelectItem value="signup"><div className="flex items-center gap-2"><UserPlus className="w-4 h-4"/> Sign Up</div></SelectItem>
                          <SelectItem value="profile"><div className="flex items-center gap-2"><User className="w-4 h-4"/> Profile</div></SelectItem>
                          <SelectItem value="checkout"><div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4"/> Checkout</div></SelectItem>
                          <SelectItem value="other"><div className="flex items-center gap-2"><FileText className="w-4 h-4"/> Khác</div></SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Controller
                  name="consent_given"
                  control={control}
                  render={({ field }) => (
                    <Checkbox 
                      id="consent_given" 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                  )}
                />
                <Label htmlFor="consent_given">Đã cấp quyền (Consent Given)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết & Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="consent_ip">IP Address</Label>
                  <Input id="consent_ip" {...register('consent_ip')} placeholder="192.168.1.1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consent_user_agent">User Agent</Label>
                  <Input id="consent_user_agent" {...register('consent_user_agent')} placeholder="Mozilla/5.0..." />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source_application">Ứng dụng nguồn</Label>
                  <Input id="source_application" {...register('source_application')} placeholder="Portal App" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source_page">Trang nguồn</Label>
                  <Input id="source_page" {...register('source_page')} placeholder="/register" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                 <div className="space-y-2">
                  <Label htmlFor="expires_at">Ngày hết hạn</Label>
                  <Input 
                    id="expires_at" 
                    type="datetime-local" 
                    {...register('expires_at')} 
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Controller
                    name="renewal_required"
                    control={control}
                    render={({ field }) => (
                      <Checkbox 
                        id="renewal_required" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    )}
                  />
                  <Label htmlFor="renewal_required">Yêu cầu gia hạn khi hết hạn</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATUS TAB */}
        <TabsContent value="status" className="space-y-4 mt-4">
           <Card>
            <CardHeader>
              <CardTitle>Trạng thái & Rút quyền</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Controller
                    name="withdrawn"
                    control={control}
                    render={({ field }) => (
                      <Checkbox 
                        id="withdrawn" 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                      />
                    )}
                  />
                  <Label htmlFor="withdrawn" className="font-semibold text-red-600">Đã rút lại quyền (Withdrawn)</Label>
                </div>

                {withdrawn && (
                  <div className="grid grid-cols-1 gap-4 pl-6 border-l-2 border-red-200 ml-1">
                    <div className="space-y-2">
                      <Label htmlFor="withdrawn_date">Ngày rút lại</Label>
                      <Input 
                        id="withdrawn_date" 
                        type="datetime-local" 
                        {...register('withdrawn_date')} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdrawn_reason">Lý do rút lại</Label>
                      <Textarea 
                        id="withdrawn_reason" 
                        {...register('withdrawn_reason')} 
                        placeholder="Người dùng yêu cầu..." 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata (JSON)</Label>
                <Textarea 
                  id="metadata" 
                  {...register('metadata')} 
                  className="font-mono text-sm h-[200px]"
                />
                <p className="text-xs text-muted-foreground">JSON data only.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy bỏ
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? (
             <>
               <span className="animate-spin mr-2">⏳</span> Đang lưu...
             </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? 'Cập nhật' : 'Tạo mới'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}