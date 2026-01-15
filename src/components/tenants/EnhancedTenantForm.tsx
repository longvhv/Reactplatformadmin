import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Save, Building2, Globe, Mail, Phone, Calendar, 
  Database, Users, Shield, MapPin, Clock, Settings 
} from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Tenant, TenantStatus, TenantTier, BillingType, 
  DataRegion, ComplianceLevel 
} from "@/data/tenants";

interface TenantFormProps {
  tenant?: Tenant;
  tenants?: Tenant[];
  onSubmit: (data: Partial<Tenant>) => Promise<void>;
  isEdit?: boolean;
}

export function EnhancedTenantForm({ tenant, tenants = [], onSubmit, isEdit = false }: TenantFormProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: tenant?.name || "",
    code: tenant?.code || "",
    data_region: tenant?.data_region || "ap-southeast-1" as DataRegion,
    compliance_level: tenant?.compliance_level || "STANDARD" as ComplianceLevel,
    parent_tenant_id: tenant?.parent_tenant_id || null,
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData: Partial<Tenant> = {
        name: formData.name,
        code: formData.code,
        data_region: formData.data_region,
        compliance_level: formData.compliance_level,
        parent_tenant_id: formData.parent_tenant_id,
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

      await onSubmit(submitData);
      navigate("/core/tenants");
    } catch (error) {
      console.error("Failed to save tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/core/tenants")} className="gap-2 mb-4">
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
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">{t("tenants.tabs.basic")}</TabsTrigger>
            <TabsTrigger value="infrastructure">{t("tenants.tabs.infrastructure")}</TabsTrigger>
            <TabsTrigger value="subscription">{t("tenants.tabs.subscription")}</TabsTrigger>
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

                <div>
                  <Label>{t("tenants.parentTenant")}</Label>
                  <Select 
                    value={formData.parent_tenant_id || "none"} 
                    onValueChange={(v) => handleChange("parent_tenant_id", v === "none" ? null : v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("tenants.noParent")}</SelectItem>
                      {tenants.filter(t => t._id !== tenant?._id).map((t) => (
                        <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription & Billing */}
          <TabsContent value="subscription" className="space-y-6">
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
                      <SelectItem value="TRIAL">Trial</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
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
          <Button type="button" variant="outline" onClick={() => navigate("/core/tenants")} disabled={loading}>
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
  );
}