/**
 * EnhancedTenantForm Component
 * Advanced tenant creation/edit form with subscription support
 * 
 * ✅ IMPROVED 2026-01-18:
 * - Partner Tenant: Autocomplete from tenants with PARTNER/PROVIDER tier
 * - Parent Tenant: Autocomplete with search (handles thousands of tenants)
 * - Added tab to create tenant_subscription immediately
 * - Full dark mode support
 */

import { Fragment, useState } from "react";
import { useNavigate } from "react-router";
import { 
  ArrowLeft, Save, Building2, Globe, Mail, Phone, Calendar, 
  Database, Users, Shield, MapPin, Clock, Settings, Handshake, CreditCard
} from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { TenantCombobox } from "../common/TenantCombobox";
import { 
  Tenant, TenantStatus, TenantTier, BillingType, 
  DataRegion, ComplianceLevel 
} from "../../data/tenants";
import {
  CreateSubscriptionRequest,
  SubscriptionStatus,
  BillingCycle,
  PaymentStatus,
} from "../../api/tenantSubscriptionsApi";

interface TenantFormProps {
  tenant?: Tenant | null;
  tenants?: Tenant[];
  onSubmit: (data: Partial<Tenant>, subscriptionData?: CreateSubscriptionRequest) => Promise<void>;
  isEdit?: boolean;
  loading?: boolean;
  onCancel?: () => void;
}

export function EnhancedTenantForm({ tenant, tenants = [], onSubmit, isEdit = false, loading = false, onCancel }: TenantFormProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  // Remove internal loading state since we receive it as prop
  // const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    name: tenant?.name || "",
    code: tenant?.code || "",
    data_region: tenant?.data_region || "ap-southeast-1" as DataRegion,
    compliance_level: tenant?.compliance_level || "STANDARD" as ComplianceLevel,
    parent_tenant_id: tenant?.parent_tenant_id || null,
    partner_tenant_id: tenant?.partner_tenant_id || null,
    tier: tenant?.tier || "FREE" as TenantTier,
    billing_type: tenant?.billing_type || "POSTPAID" as BillingType,
    timezone: tenant?.timezone || "UTC",
    status: tenant?.status || "TRIAL" as TenantStatus,
    
    // Profile fields
    billing_email: tenant?.profile?.billing_email || "",
    phone: tenant?.profile?.phone || "",
    domain: tenant?.profile?.domain || "",
    contact_person: tenant?.profile?.contact_person || "",
    industry: tenant?.profile?.industry || "",
    company_size: tenant?.profile?.company_size || "",
    country: tenant?.profile?.country || "",
    address: tenant?.profile?.address || "",
    tax_id: tenant?.profile?.tax_id || "",
    
    // Settings fields
    max_users: tenant?.settings?.max_users || 10,
    max_storage: tenant?.settings?.max_storage || 10,
    mfa_enforced: tenant?.settings?.mfa_enforced || false,
    sso_enabled: tenant?.settings?.sso_enabled || false,
    custom_branding: tenant?.settings?.custom_branding || false,
    api_access: tenant?.settings?.api_access || false,
    subscription_end_date: tenant?.settings?.subscription_end_date || "",
  });

  // Subscription form data (for new tenants only)
  const [createSubscription, setCreateSubscription] = useState(!isEdit);
  const [subscriptionData, setSubscriptionData] = useState<Partial<CreateSubscriptionRequest>>({
    subscription_name: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    status: 'trial' as SubscriptionStatus,
    billing_cycle: 'monthly' as BillingCycle,
    auto_renew: true,
    is_trial: true,
    base_price: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    currency: 'USD',
    max_users: 10,
    current_users: 0,
    max_storage_gb: 10,
    current_storage_gb: 0,
    payment_status: 'unpaid' as PaymentStatus,
    features: [],
    limits: {},
    notes: "",
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = t("tenants.errors.nameRequired");
    if (!formData.code.trim()) {
      newErrors.code = t("tenants.errors.codeRequired");
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      newErrors.code = t("tenants.errors.codeInvalid");
    }

    if (!formData.billing_email.trim()) {
      newErrors.billing_email = t("tenants.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billing_email)) {
      newErrors.billing_email = t("tenants.errors.emailInvalid");
    }

    if (formData.max_users < 1) newErrors.max_users = t("tenants.errors.maxUsersInvalid");
    if (formData.max_storage < 1) newErrors.max_storage = t("tenants.errors.maxStorageInvalid");

    // Validate subscription if creating one
    if (createSubscription && !isEdit) {
      if (!subscriptionData.subscription_name?.trim()) {
        newErrors.subscription_name = "Tên subscription không được để trống";
      }
      if (!subscriptionData.end_date) {
        newErrors.end_date = "Ngày kết thúc không được để trống";
      } else if (subscriptionData.start_date && new Date(subscriptionData.end_date) < new Date(subscriptionData.start_date)) {
        newErrors.end_date = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Switch to tab with errors
      if (errors.name || errors.code) setActiveTab("basic");
      else if (errors.subscription_name || errors.end_date) setActiveTab("subscription");
      return;
    }

    // loading is handled by parent
    try {
      const submitData: Partial<Tenant> = {
        name: formData.name,
        code: formData.code,
        data_region: formData.data_region,
        compliance_level: formData.compliance_level,
        parent_tenant_id: formData.parent_tenant_id,
        partner_tenant_id: formData.partner_tenant_id,
        tier: formData.tier,
        billing_type: formData.billing_type,
        timezone: formData.timezone,
        status: formData.status,
        profile: {
          billing_email: formData.billing_email,
          phone: formData.phone,
          domain: formData.domain,
          contact_person: formData.contact_person,
          industry: formData.industry,
          company_size: formData.company_size,
          country: formData.country,
          address: formData.address,
          tax_id: formData.tax_id,
        },
        settings: {
          max_users: formData.max_users,
          max_storage: formData.max_storage,
          current_users: tenant?.settings?.current_users || 0,
          current_storage: tenant?.settings?.current_storage || 0,
          mfa_enforced: formData.mfa_enforced,
          sso_enabled: formData.sso_enabled,
          custom_branding: formData.custom_branding,
          api_access: formData.api_access,
          subscription_end_date: formData.subscription_end_date,
          features: tenant?.settings?.features || [],
        },
        version: tenant?.version || 1,
      };

      // Prepare subscription data if creating one
      const subscriptionPayload = (createSubscription && !isEdit) ? {
        ...subscriptionData,
        subscription_name: subscriptionData.subscription_name || `${formData.name} - Subscription`,
      } as CreateSubscriptionRequest : undefined;

      await onSubmit(submitData, subscriptionPayload);
      // Navigation is handled by parent usually, but we keep the old behavior if parent doesn't navigate
      // navigate("/admin/tenants"); 
    } catch (error) {
      console.error("Failed to save tenant:", error);
    } 
    // loading state is controlled by parent
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubscriptionChange = (field: string, value: any) => {
    setSubscriptionData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCodeGeneration = () => {
    const code = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    handleChange("code", code);
  };

  return (
    <Fragment>
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tenants")} className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </Button>
            <h1 className="text-2xl font-semibold">
              {isEdit ? t("tenants.editTenant") : t("tenants.addTenant")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isEdit ? t("tenants.editTenantDescription") : t("tenants.addTenantDescription")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">{t("tenants.tabs.basic")}</TabsTrigger>
              <TabsTrigger value="infrastructure">{t("tenants.tabs.infrastructure")}</TabsTrigger>
              <TabsTrigger value="billing">{t("tenants.tabs.subscription")}</TabsTrigger>
              {!isEdit && (
                <TabsTrigger value="subscription">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscription
                </TabsTrigger>
              )}
              <TabsTrigger value="settings">{t("tenants.tabs.settings")}</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {t("tenants.basicInformation")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">{t("tenants.name")} <span className="text-destructive">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        onBlur={handleCodeGeneration}
                        placeholder={t("tenants.namePlaceholder")}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <Label htmlFor="code">{t("tenants.code")} <span className="text-destructive">*</span></Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => handleChange("code", e.target.value)}
                        placeholder={t("tenants.codePlaceholder")}
                        className={errors.code ? "border-destructive" : ""}
                      />
                      {errors.code && <p className="text-sm text-destructive mt-1">{errors.code}</p>}
                    </div>

                    <div>
                      <Label htmlFor="domain" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {t("tenants.domain")}
                      </Label>
                      <Input
                        id="domain"
                        value={formData.domain}
                        onChange={(e) => handleChange("domain", e.target.value)}
                        placeholder={t("tenants.domainPlaceholder")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="billing_email" className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Billing Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="billing_email"
                        type="email"
                        value={formData.billing_email}
                        onChange={(e) => handleChange("billing_email", e.target.value)}
                        placeholder="billing@example.com"
                        className={errors.billing_email ? "border-destructive" : ""}
                      />
                      {errors.billing_email && <p className="text-sm text-destructive mt-1">{errors.billing_email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {t("tenants.phone")}
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="+84 123 456 789"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Infrastructure Settings */}
            <TabsContent value="infrastructure" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {t("tenants.infrastructure")}
                  </CardTitle>
                  <CardDescription>
                    Configure data region, compliance, and hierarchical relationships
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("tenants.dataRegion")}</Label>
                    <Select value={formData.data_region} onValueChange={(v) => handleChange("data_region", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ap-southeast-1">🌏 Asia Pacific (Singapore)</SelectItem>
                        <SelectItem value="us-east-1">🇺🇸 US East (Virginia)</SelectItem>
                        <SelectItem value="eu-central-1">🇪🇺 EU Central (Frankfurt)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {t("tenants.complianceLevel")}
                    </Label>
                    <Select value={formData.compliance_level} onValueChange={(v) => handleChange("compliance_level", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STANDARD">Standard</SelectItem>
                        <SelectItem value="GDPR">GDPR (Europe)</SelectItem>
                        <SelectItem value="HIPAA">HIPAA (Healthcare)</SelectItem>
                        <SelectItem value="PCI-DSS">PCI-DSS (Payment)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {t("tenants.timezone")}
                    </Label>
                    <Input
                      value={formData.timezone}
                      onChange={(e) => handleChange("timezone", e.target.value)}
                      placeholder="UTC"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {t("tenants.parentTenant")}
                    </Label>
                    <TenantCombobox
                      value={formData.parent_tenant_id}
                      onValueChange={(v) => handleChange("parent_tenant_id", v)}
                      placeholder={t("tenants.selectParentTenant")}
                      emptyText={t("tenants.noTenantsFound")}
                      excludeId={tenant?._id}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Search by name or domain to select parent tenant (optional)
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="flex items-center gap-2">
                      <Handshake className="w-4 h-4" />
                      {t("tenants.partnerTenant")}
                    </Label>
                    <TenantCombobox
                      value={formData.partner_tenant_id}
                      onValueChange={(v) => handleChange("partner_tenant_id", v)}
                      placeholder={t("tenants.selectPartnerTenant")}
                      emptyText={t("tenants.noPartnersFound")}
                      filterTier={['PARTNER_BASIC', 'PARTNER_PREMIUM', 'PARTNER_ELITE', 'PROVIDER']}
                      excludeId={tenant?._id}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Only shows tenants with Partner/Provider tier (defaults to PROVIDER)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription & Billing */}
            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("tenants.subscriptionAndBilling")}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t("tenants.tier")}</Label>
                    <Select value={formData.tier} onValueChange={(v) => handleChange("tier", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        <SelectItem value="PARTNER_BASIC">Partner Basic</SelectItem>
                        <SelectItem value="PARTNER_PREMIUM">Partner Premium</SelectItem>
                        <SelectItem value="PARTNER_ELITE">Partner Elite</SelectItem>
                        <SelectItem value="PROVIDER">Provider</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t("tenants.billingType")}</Label>
                    <Select value={formData.billing_type} onValueChange={(v) => handleChange("billing_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PREPAID">Prepaid</SelectItem>
                        <SelectItem value="POSTPAID">Postpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t("tenants.status")}</Label>
                    <Select value={formData.status} onValueChange={(v) => handleChange("status", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIAL">{t('common.trial')}</SelectItem>
                        <SelectItem value="ACTIVE">{t('common.active')}</SelectItem>
                        <SelectItem value="SUSPENDED">{t('common.suspended')}</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t("tenants.subscriptionEndDate")}</Label>
                    <Input
                      type="date"
                      value={formData.subscription_end_date}
                      onChange={(e) => handleChange("subscription_end_date", e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Create Subscription Tab (New Tenant Only) */}
            {!isEdit && (
              <TabsContent value="subscription" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Create Initial Subscription
                    </CardTitle>
                    <CardDescription>
                      Optionally create a subscription for this tenant immediately
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="create-sub">Create subscription on tenant creation</Label>
                      <Switch
                        id="create-sub"
                        checked={createSubscription}
                        onCheckedChange={setCreateSubscription}
                      />
                    </div>

                    {createSubscription && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor="sub_name">Subscription Name <span className="text-destructive">*</span></Label>
                            <Input
                              id="sub_name"
                              value={subscriptionData.subscription_name}
                              onChange={(e) => handleSubscriptionChange("subscription_name", e.target.value)}
                              placeholder={`${formData.name} - Standard Plan`}
                              className={errors.subscription_name ? "border-destructive" : ""}
                            />
                            {errors.subscription_name && (
                              <p className="text-sm text-destructive mt-1">{errors.subscription_name}</p>
                            )}
                          </div>

                          <div>
                            <Label>Start Date</Label>
                            <Input
                              type="date"
                              value={subscriptionData.start_date}
                              onChange={(e) => handleSubscriptionChange("start_date", e.target.value)}
                            />
                          </div>

                          <div>
                            <Label>End Date <span className="text-destructive">*</span></Label>
                            <Input
                              type="date"
                              value={subscriptionData.end_date}
                              onChange={(e) => handleSubscriptionChange("end_date", e.target.value)}
                              className={errors.end_date ? "border-destructive" : ""}
                            />
                            {errors.end_date && <p className="text-sm text-destructive mt-1">{errors.end_date}</p>}
                          </div>

                          <div>
                            <Label>Status</Label>
                            <Select 
                              value={subscriptionData.status} 
                              onValueChange={(v) => handleSubscriptionChange("status", v as SubscriptionStatus)}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Billing Cycle</Label>
                            <Select 
                              value={subscriptionData.billing_cycle} 
                              onValueChange={(v) => handleSubscriptionChange("billing_cycle", v as BillingCycle)}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Base Price (USD)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={subscriptionData.base_price}
                              onChange={(e) => handleSubscriptionChange("base_price", parseFloat(e.target.value) || 0)}
                            />
                          </div>

                          <div>
                            <Label>Max Users</Label>
                            <Input
                              type="number"
                              min="1"
                              value={subscriptionData.max_users}
                              onChange={(e) => handleSubscriptionChange("max_users", parseInt(e.target.value) || 1)}
                            />
                          </div>

                          <div>
                            <Label>Max Storage (GB)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={subscriptionData.max_storage_gb}
                              onChange={(e) => handleSubscriptionChange("max_storage_gb", parseInt(e.target.value) || 10)}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="auto_renew"
                              checked={subscriptionData.auto_renew}
                              onCheckedChange={(v) => handleSubscriptionChange("auto_renew", v)}
                            />
                            <Label htmlFor="auto_renew">Auto Renew</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="is_trial"
                              checked={subscriptionData.is_trial}
                              onCheckedChange={(v) => handleSubscriptionChange("is_trial", v)}
                            />
                            <Label htmlFor="is_trial">Is Trial</Label>
                          </div>

                          <div className="md:col-span-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                              id="notes"
                              value={subscriptionData.notes || ""}
                              onChange={(e) => handleSubscriptionChange("notes", e.target.value)}
                              placeholder="Additional notes about this subscription..."
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Advanced Settings */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    {t("tenants.advancedSettings")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {t("tenants.maxUsers")}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.max_users}
                        onChange={(e) => handleChange("max_users", parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        {t("tenants.maxStorage")} (GB)
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={formData.max_storage}
                        onChange={(e) => handleChange("max_storage", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mfa">{t("tenants.mfaEnforced")}</Label>
                      <Switch
                        id="mfa"
                        checked={formData.mfa_enforced}
                        onCheckedChange={(v) => handleChange("mfa_enforced", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="sso">{t("tenants.ssoEnabled")}</Label>
                      <Switch
                        id="sso"
                        checked={formData.sso_enabled}
                        onCheckedChange={(v) => handleChange("sso_enabled", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="branding">{t("tenants.customBranding")}</Label>
                      <Switch
                        id="branding"
                        checked={formData.custom_branding}
                        onCheckedChange={(v) => handleChange("custom_branding", v)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="api">{t("tenants.apiAccess")}</Label>
                      <Switch
                        id="api"
                        checked={formData.api_access}
                        onCheckedChange={(v) => handleChange("api_access", v)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel || (() => navigate("/admin/tenants"))} 
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? t("common.saveChanges") : t("tenants.createTenant")}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Fragment>
  );
}