import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Building2, Globe, Mail, Phone, Calendar, Database, Users } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tenant, TenantStatus } from "@/data/tenants";

interface TenantFormProps {
  tenant?: Tenant;
  onSubmit: (data: Partial<Tenant>) => Promise<void>;
  isEdit?: boolean;
}

export function TenantForm({ tenant, onSubmit, isEdit = false }: TenantFormProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: tenant?.name || "",
    slug: tenant?.slug || "",
    domain: tenant?.domain || "",
    billingEmail: tenant?.billingEmail || "",
    phone: tenant?.phone || "",
    subscriptionTier: tenant?.subscriptionTier || "starter",
    status: tenant?.status || "trial",
    maxUsers: tenant?.maxUsers || 10,
    maxStorage: tenant?.maxStorage || 10,
    subscriptionEndDate: tenant?.subscriptionEndDate || "",
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("tenants.errors.nameRequired");
    }

    if (!formData.slug.trim()) {
      newErrors.slug = t("tenants.errors.slugRequired");
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = t("tenants.errors.slugInvalid");
    }

    if (!formData.billingEmail.trim()) {
      newErrors.billingEmail = t("tenants.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      newErrors.billingEmail = t("tenants.errors.emailInvalid");
    }

    if (formData.maxUsers < 1) {
      newErrors.maxUsers = t("tenants.errors.maxUsersInvalid");
    }

    if (formData.maxStorage < 1) {
      newErrors.maxStorage = t("tenants.errors.maxStorageInvalid");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      navigate("/tenants");
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

  const handleSlugGeneration = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    handleChange("slug", slug);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/tenants")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </Button>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? t("tenants.editTenant") : t("tenants.addTenant")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEdit ? t("tenants.editTenantDescription") : t("tenants.addTenantDescription")}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("tenants.basicInformation")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("tenants.name")} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={handleSlugGeneration}
                  placeholder={t("tenants.namePlaceholder")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("tenants.slug")} <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder={t("tenants.slugPlaceholder")}
                  className={errors.slug ? "border-red-500" : ""}
                />
                {errors.slug && (
                  <p className="text-sm text-red-500 mt-1">{errors.slug}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("tenants.slugHelp")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t("tenants.domain")}
                </label>
                <Input
                  value={formData.domain}
                  onChange={(e) => handleChange("domain", e.target.value)}
                  placeholder={t("tenants.domainPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("tenants.contactInformation")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("tenants.billingEmail")} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => handleChange("billingEmail", e.target.value)}
                  placeholder={t("tenants.emailPlaceholder")}
                  className={errors.billingEmail ? "border-red-500" : ""}
                />
                {errors.billingEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.billingEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t("tenants.phone")}
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder={t("tenants.phonePlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Subscription & Limits */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("tenants.subscriptionAndLimits")}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("tenants.subscriptionTier")}
                </label>
                <select
                  value={formData.subscriptionTier}
                  onChange={(e) => handleChange("subscriptionTier", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="starter">{t("tenants.tier.starter")}</option>
                  <option value="professional">{t("tenants.tier.professional")}</option>
                  <option value="enterprise">{t("tenants.tier.enterprise")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("tenants.statusLabel")}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">{t("tenants.status.active")}</option>
                  <option value="trial">{t("tenants.status.trial")}</option>
                  <option value="suspended">{t("tenants.status.suspended")}</option>
                  <option value="cancelled">{t("tenants.status.cancelled")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t("tenants.maxUsers")}
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxUsers}
                  onChange={(e) => handleChange("maxUsers", parseInt(e.target.value) || 0)}
                  className={errors.maxUsers ? "border-red-500" : ""}
                />
                {errors.maxUsers && (
                  <p className="text-sm text-red-500 mt-1">{errors.maxUsers}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {t("tenants.maxStorage")} (GB)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxStorage}
                  onChange={(e) => handleChange("maxStorage", parseInt(e.target.value) || 0)}
                  className={errors.maxStorage ? "border-red-500" : ""}
                />
                {errors.maxStorage && (
                  <p className="text-sm text-red-500 mt-1">{errors.maxStorage}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("tenants.subscriptionEndDate")}
                </label>
                <Input
                  type="date"
                  value={formData.subscriptionEndDate}
                  onChange={(e) => handleChange("subscriptionEndDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/tenants")}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
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
    </div>
  );
}