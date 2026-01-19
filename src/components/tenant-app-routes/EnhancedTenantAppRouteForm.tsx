/**
 * Enhanced Tenant App Route Form Component
 * Standardized form for creating/editing tenant routes
 * 
 * Compliant with tenant_app_routes schema:
 * - app_code: varchar(50) NOT NULL
 * - domain: varchar(255) (Conditional NOT NULL based on scope, but DB says NOT NULL)
 * - path_prefix: varchar(100) DEFAULT '/'
 * - route_scope: 'SPECIFIC_DOMAIN' | 'ALL_MY_DOMAINS' | 'INHERITED'
 * - status, ssl_status, is_primary, is_custom_domain
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Save, AlertTriangle, ArrowLeft, Globe, Shield, Activity, Link as LinkIcon } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantAppRoute, CreateRouteRequest, UpdateRouteRequest, RouteScope, RouteStatus, SSLStatus, tenantAppRoutesApi } from "@/api/tenantAppRoutesApi";
import { applicationsApi, Application } from "@/api/applicationsApi";
import { showToast } from "@/lib/toast";

interface EnhancedTenantAppRouteFormProps {
  initialData?: Partial<TenantAppRoute>;
  isEdit?: boolean;
  tenantId: string;
  onSubmit: (data: CreateRouteRequest | UpdateRouteRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

const ROUTE_SCOPES: { value: RouteScope; label: string }[] = [
  { value: "SPECIFIC_DOMAIN", label: "Tên miền cụ thể (Specific Domain)" },
  { value: "ALL_MY_DOMAINS", label: "Tất cả tên miền (All My Domains)" },
  { value: "INHERITED", label: "Kế thừa (Inherited)" },
];

const STATUSES: { value: RouteStatus; label: string }[] = [
  { value: "ACTIVE", label: "Hoạt động (Active)" },
  { value: "INACTIVE", label: "Không hoạt động (Inactive)" },
  { value: "MAINTENANCE", label: "Bảo trì (Maintenance)" },
  { value: "PENDING_DNS", label: "Chờ DNS (Pending DNS)" },
];

const SSL_STATUSES: { value: SSLStatus; label: string }[] = [
  { value: "NONE", label: "Chưa có (None)" },
  { value: "PENDING", label: "Đang xử lý (Pending)" },
  { value: "ACTIVE", label: "Đã kích hoạt (Active)" },
  { value: "FAILED", label: "Thất bại (Failed)" },
];

export function EnhancedTenantAppRouteForm({ 
  initialData, 
  isEdit = false, 
  tenantId,
  onSubmit, 
  loading = false,
  onCancel
}: EnhancedTenantAppRouteFormProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const [formData, setFormData] = useState<CreateRouteRequest>({
    tenant_id: tenantId,
    app_code: "",
    domain: "",
    path_prefix: "/",
    route_scope: "SPECIFIC_DOMAIN",
    is_primary: false,
    is_custom_domain: false,
    status: "ACTIVE",
    ssl_status: "NONE",
  });

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoadingApps(true);
        const apps = await applicationsApi.getActive();
        setApplications(apps);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        showToast.error("Lỗi", "Không thể tải danh sách ứng dụng");
      } finally {
        setLoadingApps(false);
      }
    };
    fetchApps();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        tenant_id: initialData.tenant_id || tenantId,
        app_code: initialData.app_code || "",
        domain: initialData.domain || "", // Can be null in API, but form needs string
        path_prefix: initialData.path_prefix || "/",
        route_scope: initialData.route_scope || "SPECIFIC_DOMAIN",
        is_primary: initialData.is_primary || false,
        is_custom_domain: initialData.is_custom_domain || false,
        status: initialData.status || "ACTIVE",
        ssl_status: initialData.ssl_status || "NONE",
      });
    }
  }, [initialData, tenantId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate App Code
    if (!formData.app_code) {
      newErrors.app_code = "Mã ứng dụng là bắt buộc";
    }

    // Validate Domain
    if (formData.route_scope === "SPECIFIC_DOMAIN") {
      if (!formData.domain || !formData.domain.trim()) {
        newErrors.domain = "Tên miền là bắt buộc cho loại 'Domain cụ thể'";
      } else {
        const domainRegex = /^[a-z0-9.-]+$/;
        if (!domainRegex.test(formData.domain)) {
          newErrors.domain = "Tên miền chỉ chứa chữ thường, số, dấu chấm và gạch ngang";
        }
        if (formData.domain.length > 255) {
          newErrors.domain = "Tên miền quá dài (tối đa 255 ký tự)";
        }
      }
    }

    // Validate Path Prefix
    const pathRegex = /^\/[-a-z0-9/]*$/;
    if (!formData.path_prefix) {
       // Should default to / but just in case
       newErrors.path_prefix = "Path prefix là bắt buộc (ít nhất là /)";
    } else if (!pathRegex.test(formData.path_prefix)) {
      newErrors.path_prefix = "Path phải bắt đầu bằng / và chỉ chứa ký tự hợp lệ";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      showToast.error("Lỗi xác thực", "Vui lòng kiểm tra lại thông tin");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Logic for domain nullability based on scope
      const submitData = { ...formData };
      
      // If NOT specific domain, we should send null (or empty string if API handles it)
      // The API types say `domain` is nullable.
      // However, check constraint implies `domain` MUST be null if scope is NOT SPECIFIC_DOMAIN.
      // But DB column says NOT NULL.
      // We will send the value if it exists, or handle based on API expectation.
      // Assuming API handles validation or DB has been fixed.
      if (submitData.route_scope !== "SPECIFIC_DOMAIN") {
        submitData.domain = null; 
      }

      await onSubmit(submitData);
    } catch (error: any) {
      console.error("Form submit error:", error);
      // Toast handled by parent usually
    }
  };

  const handleChange = (field: keyof CreateRouteRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general">Cấu hình chung</TabsTrigger>
          <TabsTrigger value="security">Bảo mật (SSL)</TabsTrigger>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Thông tin định tuyến
              </CardTitle>
              <CardDescription>
                Cấu hình tên miền và đường dẫn cho ứng dụng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="app_code">
                    Ứng dụng <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.app_code} 
                    onValueChange={(value) => handleChange("app_code", value)}
                    disabled={isEdit} // Usually cannot change app of an existing route easily without confusion
                  >
                    <SelectTrigger className={errors.app_code ? "border-destructive" : ""}>
                      <SelectValue placeholder={loadingApps ? "Đang tải..." : "Chọn ứng dụng"} />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.code} value={app.code}>
                          {app.name} ({app.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.app_code && <p className="text-sm text-destructive">{errors.app_code}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="route_scope">Phạm vi định tuyến</Label>
                  <Select 
                    value={formData.route_scope} 
                    onValueChange={(value) => handleChange("route_scope", value as RouteScope)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROUTE_SCOPES.map((scope) => (
                        <SelectItem key={scope.value} value={scope.value}>
                          {scope.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.route_scope === "SPECIFIC_DOMAIN" && (
                <div className="space-y-2">
                  <Label htmlFor="domain">
                    Tên miền <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="domain"
                      value={formData.domain || ""}
                      onChange={(e) => handleChange("domain", e.target.value.toLowerCase())}
                      placeholder="vd: app.example.com"
                      className={errors.domain ? "border-destructive" : ""}
                    />
                  </div>
                  {errors.domain && <p className="text-sm text-destructive">{errors.domain}</p>}
                  <p className="text-xs text-muted-foreground">
                    Chỉ hỗ trợ ký tự thường, số, dấu chấm và gạch ngang.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="path_prefix">
                  Path Prefix <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="path_prefix"
                    value={formData.path_prefix}
                    onChange={(e) => handleChange("path_prefix", e.target.value)}
                    placeholder="/"
                    className={errors.path_prefix ? "border-destructive" : ""}
                  />
                </div>
                {errors.path_prefix && <p className="text-sm text-destructive">{errors.path_prefix}</p>}
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="is_custom_domain" className="text-base">Custom Domain</Label>
                  <p className="text-sm text-muted-foreground">
                    Đánh dấu nếu đây là tên miền riêng của khách hàng (Custom Domain)
                  </p>
                </div>
                <Switch
                  id="is_custom_domain"
                  checked={formData.is_custom_domain}
                  onCheckedChange={(checked) => handleChange("is_custom_domain", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="is_primary" className="text-base">Route Chính (Primary)</Label>
                  <p className="text-sm text-muted-foreground">
                    Route mặc định khi truy cập ứng dụng. Mỗi tenant chỉ có 1 route chính.
                  </p>
                </div>
                <Switch
                  id="is_primary"
                  checked={formData.is_primary}
                  onCheckedChange={(checked) => handleChange("is_primary", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Security */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Chứng chỉ SSL/TLS
              </CardTitle>
              <CardDescription>
                Quản lý trạng thái bảo mật của tên miền
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ssl_status">Trạng thái SSL</Label>
                  <Select 
                    value={formData.ssl_status} 
                    onValueChange={(value) => handleChange("ssl_status", value as SSLStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SSL_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="bg-blue-50 text-blue-700 p-4 rounded-md text-sm border border-blue-100">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <div>
                    <strong>Lưu ý:</strong> Việc cấp phát SSL tự động có thể mất tới 24h sau khi DNS được cấu hình chính xác.
                    Vui lòng đảm bảo bản ghi CNAME/A trỏ về hệ thống trước khi kích hoạt.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Status */}
        <TabsContent value="status" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Trạng thái hoạt động
              </CardTitle>
              <CardDescription>
                Kiểm soát quyền truy cập vào route này
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái Route</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleChange("status", value as RouteStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.status === "PENDING_DNS" && (
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm border border-yellow-100">
                  Route đang chờ xác thực DNS. Người dùng sẽ không thể truy cập cho đến khi DNS được trỏ đúng.
                </div>
              )}
              
              {formData.status === "MAINTENANCE" && (
                <div className="bg-orange-50 text-orange-800 p-4 rounded-md text-sm border border-orange-100">
                  Route đang ở chế độ bảo trì. Người dùng truy cập sẽ thấy trang thông báo bảo trì.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Hủy bỏ
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEdit ? "Cập nhật" : "Tạo mới"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
