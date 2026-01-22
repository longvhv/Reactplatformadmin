'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserConsent, 
  CreateConsentRequest, 
  UpdateConsentRequest, 
  ConsentMethod,
  userConsentsApi 
} from '../../api/userConsentsApi';
import { usersApi, User } from '../../api/usersApi';
import { legalDocumentsApi } from '../../api/legalDocumentsApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CalendarIcon, Save, X, Info } from 'lucide-react';
import { showToast } from '../../lib/toast';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '../ui/utils';

interface UserConsentFormProps {
  initialData?: UserConsent;
  isEdit?: boolean;
  onSubmit: (data: CreateConsentRequest | UpdateConsentRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function UserConsentForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  onCancel, 
  loading = false 
}: UserConsentFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateConsentRequest>>({
    consent_given: true,
    consent_method: 'web',
    withdrawn: false,
    renewal_required: false,
    consent_date: new Date().toISOString(),
    metadata: {},
    ...initialData
  });

  const [metadataJson, setMetadataJson] = useState(
    JSON.stringify(initialData?.metadata || {}, null, 2)
  );

  // Load dependencies
  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [usersData, docsData] = await Promise.all([
          usersApi.getAll(),
          legalDocumentsApi.getAll()
        ]);
        setUsers(usersData);
        setDocuments(docsData);
      } catch (err) {
        console.error('Failed to load dependencies', err);
        showToast.error('Error', 'Failed to load users or documents');
      }
    };
    
    // Only load if not provided or if we need to select them (create mode)
    // Even in edit mode, we might want to display names instead of IDs
    loadDependencies();
  }, []);

  const handleChange = (field: keyof CreateConsentRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleJsonChange = (value: string) => {
    setMetadataJson(value);
  };

  const validate = () => {
    if (!isEdit) {
        if (!formData.user_id) return 'User is required';
        if (!formData.legal_document_id) return 'Legal Document is required';
    }
    
    try {
      JSON.parse(metadataJson);
    } catch (e) {
      return 'Invalid JSON metadata';
    }

    if (formData.withdrawn && !formData.withdrawn_date) {
        // Auto-set withdrawn date if not set
        setFormData(prev => ({ ...prev, withdrawn_date: new Date().toISOString() }));
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      showToast.error('Validation Error', error);
      return;
    }

    try {
      const payload = {
        ...formData,
        metadata: JSON.parse(metadataJson),
      };
      await onSubmit(payload as any);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-10">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="details">Details & Context</TabsTrigger>
          <TabsTrigger value="advanced">Advanced & Metadata</TabsTrigger>
        </TabsList>

        {/* --- BASIC INFO --- */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Consent Identity</CardTitle>
              <CardDescription>Who consented to what?</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <Label className="required">User</Label>
                {isEdit ? (
                    <div className="p-2 bg-gray-100 rounded border text-sm text-gray-700">
                        {users.find(u => u._id === formData.user_id)?.full_name || formData.user_id}
                    </div>
                ) : (
                  <Select 
                    value={formData.user_id} 
                    onValueChange={(v) => handleChange('user_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select User..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u._id} value={u._id}>
                            {u.full_name} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label className="required">Legal Document</Label>
                 {isEdit ? (
                    <div className="p-2 bg-gray-100 rounded border text-sm text-gray-700">
                        {documents.find(d => d._id === formData.legal_document_id)?.title || formData.legal_document_id}
                    </div>
                ) : (
                  <Select 
                    value={formData.legal_document_id} 
                    onValueChange={(v) => handleChange('legal_document_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Document..." />
                    </SelectTrigger>
                    <SelectContent>
                      {documents.map(d => (
                        <SelectItem key={d._id} value={d._id}>
                            {d.title} (v{d.version})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                 <Label>Consent Date</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.consent_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.consent_date ? format(new Date(formData.consent_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.consent_date ? new Date(formData.consent_date) : undefined}
                        onSelect={(d) => d && handleChange('consent_date', d.toISOString())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
              </div>

              <div>
                  <Label>Consent Method</Label>
                  <Select 
                    value={formData.consent_method || 'web'} 
                    onValueChange={(v) => handleChange('consent_method', v as ConsentMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">Web Interface</SelectItem>
                      <SelectItem value="mobile">Mobile App</SelectItem>
                      <SelectItem value="signup">Sign Up Flow</SelectItem>
                      <SelectItem value="api">API Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="profile">Profile Settings</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

               <div className="flex items-center space-x-2 pt-4">
                  <Switch 
                    id="consent_given" 
                    checked={formData.consent_given}
                    onCheckedChange={(c) => handleChange('consent_given', c)}
                  />
                  <Label htmlFor="consent_given">Consent Given (Active)</Label>
               </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* --- DETAILS & CONTEXT --- */}
        <TabsContent value="details" className="space-y-6 mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Technical Context</CardTitle>
                    <CardDescription>IP Address, User Agent, and Source</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label>IP Address</Label>
                        <Input 
                            value={formData.consent_ip || ''} 
                            onChange={e => handleChange('consent_ip', e.target.value)}
                            placeholder="e.g. 192.168.1.1"
                        />
                    </div>
                     <div>
                        <Label>User Agent</Label>
                        <Input 
                            value={formData.consent_user_agent || ''} 
                            onChange={e => handleChange('consent_user_agent', e.target.value)}
                            placeholder="Browser string..."
                        />
                    </div>
                    <div>
                        <Label>Source Application</Label>
                        <Input 
                            value={formData.source_application || ''} 
                            onChange={e => handleChange('source_application', e.target.value)}
                            placeholder="e.g. AdminPortal"
                        />
                    </div>
                     <div>
                        <Label>Source Page</Label>
                        <Input 
                            value={formData.source_page || ''} 
                            onChange={e => handleChange('source_page', e.target.value)}
                            placeholder="e.g. /signup"
                        />
                    </div>
                </CardContent>
             </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Status & Withdrawal</CardTitle>
                    <CardDescription>Manage consent lifecycle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center justify-between border p-4 rounded-lg bg-red-50">
                        <div>
                            <Label className="text-red-700">Withdrawn / Revoked</Label>
                            <p className="text-xs text-red-600">Has the user revoked this consent?</p>
                        </div>
                        <Switch 
                            checked={formData.withdrawn}
                            onCheckedChange={(c) => handleChange('withdrawn', c)}
                        />
                    </div>

                    {formData.withdrawn && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2">
                             <div>
                                <Label>Withdrawn Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.withdrawn_date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.withdrawn_date ? format(new Date(formData.withdrawn_date), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.withdrawn_date ? new Date(formData.withdrawn_date) : undefined}
                                        onSelect={(d) => d && handleChange('withdrawn_date', d.toISOString())}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label>Reason for Withdrawal</Label>
                                <Input 
                                    value={formData.withdrawn_reason || ''}
                                    onChange={e => handleChange('withdrawn_reason', e.target.value)}
                                    placeholder="e.g. User requested via email"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
             </Card>
        </TabsContent>

        {/* --- ADVANCED --- */}
        <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Expiration & Renewal</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2 border p-4 rounded-lg">
                        <Switch 
                            checked={formData.renewal_required}
                            onCheckedChange={c => handleChange('renewal_required', c)}
                        />
                        <Label>Renewal Required</Label>
                    </div>
                     <div>
                         <Label>Expires At</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.expires_at && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.expires_at ? format(new Date(formData.expires_at), "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={formData.expires_at ? new Date(formData.expires_at) : undefined}
                                onSelect={(d) => d && handleChange('expires_at', d.toISOString())}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                     </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea 
                        value={metadataJson}
                        onChange={e => handleJsonChange(e.target.value)}
                        className="font-mono text-xs h-[200px]"
                    />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 pt-6 border-t mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2"/> Save Record</>}
        </Button>
      </div>
    </form>
  );
}