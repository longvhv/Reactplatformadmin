/**
 * Enhanced Tenant Digital Asset Form Component
 * Standardized form for creating/editing digital assets
 * 
 * Compliant with tenant_digital_assets schema:
 * - name: text NOT NULL
 * - asset_type: varchar(50) NOT NULL
 * - status: varchar(20) NOT NULL (default PENDING)
 * - auto_renew: boolean NOT NULL (default true)
 * - asset_metadata: jsonb NOT NULL (default {})
 * - activated_at: timestamp with time zone NULL
 * - expires_at: timestamp with time zone NULL
 * - order_id: uuid NULL (references subscription_orders)
 */

import { useState, useEffect } from "react";
import { Save, AlertTriangle, Calendar, Database, FileCode, Tag } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantDigitalAsset, CreateAssetRequest, UpdateAssetRequest, AssetType, AssetStatus, digitalAssetsApi } from "@/api/digitalAssetsApi";
import { ordersApi, Order } from "@/api/ordersApi";
import { showToast } from "@/lib/toast";

interface EnhancedTenantDigitalAssetFormProps {
  initialData?: Partial<TenantDigitalAsset>;
  isEdit?: boolean;
  tenantId: string;
  onSubmit: (data: CreateAssetRequest | UpdateAssetRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: "DOMAIN", label: "Tên miền (Domain)" },
  { value: "SSL", label: "Chứng chỉ SSL" },
  { value: "LICENSE_KEY", label: "License Key" },
  { value: "SOFTWARE", label: "Phần mềm (Software)" },
  { value: "SUBSCRIPTION", label: "Gói đăng ký (Subscription)" },
  { value: "OTHER", label: "Khác (Other)" },
];

const STATUSES: { value: AssetStatus; label: string }[] = [
  { value: "PENDING", label: "Chờ kích hoạt (Pending)" },
  { value: "PROVISIONING", label: "Đang khởi tạo (Provisioning)" },
  { value: "ACTIVE", label: "Đang hoạt động (Active)" },
  { value: "SUSPENDED", label: "Bị tạm ngưng (Suspended)" },
  { value: "EXPIRED", label: "Đã hết hạn (Expired)" },
  { value: "TRANSFERRING", label: "Đang chuyển đổi (Transferring)" },
];

export function EnhancedTenantDigitalAssetForm({ 
  initialData, 
  isEdit = false, 
  tenantId,
  onSubmit, 
  loading = false,
  onCancel
}: EnhancedTenantDigitalAssetFormProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [metadataJson, setMetadataJson] = useState("{}");

  const [formData, setFormData] = useState<CreateAssetRequest>({
    tenant_id: tenantId,
    name: "",
    asset_type: "DOMAIN",
    status: "PENDING",
    auto_renew: true,
    order_id: null,
    activated_at: null,
    expires_at: null,
    asset_metadata: {},
  });

  useEffect(() => {
    // Fetch orders for this tenant
    const fetchOrders = async () => {
      try {
        const tenantOrders = await ordersApi.getAll({ tenant_id: tenantId });
        setOrders(tenantOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    };
    if (tenantId) fetchOrders();
  }, [tenantId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        tenant_id: initialData.tenant_id || tenantId,
        name: initialData.name || "",
        asset_type: initialData.asset_type || "DOMAIN",
        status: initialData.status || "PENDING",
        auto_renew: initialData.auto_renew ?? true,
        order_id: initialData.order_id || null,
        activated_at: initialData.activated_at || null,
        expires_at: initialData.expires_at || null,
        asset_metadata: initialData.asset_metadata || {},
      });
      setMetadataJson(JSON.stringify(initialData.asset_metadata || {}, null, 2));
    }
  }, [initialData, tenantId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên tài sản là bắt buộc";
    }

    if (!formData.asset_type) {
      newErrors.asset_type = "Loại tài sản là bắt buộc";
    }

    if (formData.activated_at && formData.expires_at) {
      const start = new Date(formData.activated_at);
      const end = new Date(formData.expires_at);
      if (end <= start) {
        newErrors.expires_at = "Ngày hết hạn phải sau ngày kích hoạt";
      }
    }

    // Validate Metadata JSON
    try {
      JSON.parse(metadataJson);
    } catch (e) {
      newErrors.asset_metadata = "JSON metadata không hợp lệ";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name || newErrors.asset_type) setActiveTab("general");
      else if (newErrors.expires_at) setActiveTab("dates");
      else if (newErrors.asset_metadata) setActiveTab("metadata");
      
      showToast.error("Lỗi xác thực", "Vui lòng kiểm tra lại thông tin");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const parsedMetadata = JSON.parse(metadataJson);
      await onSubmit({
        ...formData,
        asset_metadata: parsedMetadata,
      });
    } catch (error: any) {
      console.error("Form submit error:", error);
      showToast.error("Lỗi", error.message || "Có lỗi xảy ra");
    }
  };

  const handleChange = (field: keyof CreateAssetRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const formatDateTimeLocal = (isoString: string | null | undefined) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="dates">Thời hạn & Đơn hàng</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>
                Định danh và trạng thái của tài sản số
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Tên tài sản <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="VD: example.com, SSL Certificate 2024"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="asset_type">
                    Loại tài sản <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.asset_type} 
                    onValueChange={(value) => handleChange("asset_type", value as AssetType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại tài sản" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleChange("status", value as AssetStatus)}
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

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="auto_renew" className="text-base">Tự động gia hạn</Label>
                  <p className="text-sm text-muted-foreground">
                    Tài sản sẽ được tự động gia hạn khi hết hạn
                  </p>
                </div>
                <Switch
                  id="auto_renew"
                  checked={formData.auto_renew}
                  onCheckedChange={(checked) => handleChange("auto_renew", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Dates & Order */}
        <TabsContent value="dates" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Thời hạn & Liên kết
              </CardTitle>
              <CardDescription>
                Quản lý thời gian hiệu lực và đơn hàng liên quan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="order_id">Đơn hàng liên kết</Label>
                <Select 
                  value={formData.order_id || "none"} 
                  onValueChange={(value) => handleChange("order_id", value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn hàng (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Không liên kết --</SelectItem>
                    {orders.map((order) => (
                      <SelectItem key={order._id} value={order._id}>
                        {order.order_number} ({order.status}) - {new Date(order.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="activated_at">Ngày kích hoạt</Label>
                  <Input
                    id="activated_at"
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.activated_at)}
                    onChange={(e) => handleChange("activated_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Ngày hết hạn</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formatDateTimeLocal(formData.expires_at)}
                    onChange={(e) => handleChange("expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className={errors.expires_at ? "border-destructive" : ""}
                  />
                  {errors.expires_at && <p className="text-sm text-destructive">{errors.expires_at}</p>}
                </div>
              </div>

              {formData.expires_at && (
                 <div className="bg-blue-50 text-blue-700 p-3 rounded text-sm flex items-center gap-2">
                   <AlertTriangle className="w-4 h-4" />
                   Tài sản sẽ hết hiệu lực vào: {new Date(formData.expires_at).toLocaleString()}
                 </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Metadata */}
        <TabsContent value="metadata" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                Metadata (JSON)
              </CardTitle>
              <CardDescription>
                Dữ liệu bổ sung cho tài sản (cấu hình kỹ thuật, thông tin nhà cung cấp...)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metadata">JSON Editor</Label>
                <Textarea
                  id="metadata"
                  value={metadataJson}
                  onChange={(e) => setMetadataJson(e.target.value)}
                  className={`font-mono text-sm h-[300px] ${errors.asset_metadata ? "border-destructive" : ""}`}
                  placeholder="{}"
                />
                {errors.asset_metadata && <p className="text-sm text-destructive">{errors.asset_metadata}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                Nhập dữ liệu định dạng JSON hợp lệ. Ví dụ: <code>{`{ "registrar": "GoDaddy", "dns_managed": true }`}</code>
              </p>
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
