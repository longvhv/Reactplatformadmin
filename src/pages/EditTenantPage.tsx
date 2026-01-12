import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TenantForm } from "@/components/tenants/TenantForm";
import { getTenantById, updateTenant } from "@/api/tenantApi";
import { Tenant } from "@/data/tenants";
import { useLanguage } from "@/providers/LanguageProvider";

export function EditTenantPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenant();
  }, [id]);

  const loadTenant = async () => {
    if (!id) return;

    try {
      const data = await getTenantById(id);
      setTenant(data);
    } catch (error) {
      console.error("Failed to load tenant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<Tenant>) => {
    if (!id) return;
    await updateTenant(id, data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">{t("errors.notFound")}</p>
        </div>
      </div>
    );
  }

  return <TenantForm tenant={tenant} onSubmit={handleSubmit} isEdit={true} />;
}
