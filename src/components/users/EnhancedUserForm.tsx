/**
 * Enhanced User Form Component
 * Standardized form for creating/editing users
 * 
 * Compliant with users schema:
 * - email: varchar(255) NOT NULL, regex checked
 * - full_name: text NOT NULL
 * - phone_number: varchar(20) NULL, UNIQUE
 * - avatar_url: text NULL, regex checked
 * - status: 'ACTIVE' | 'BANNED' | 'DISABLED' | 'PENDING'
 * - locale: 'vi-VN' | 'en-US' ...
 * - metadata: jsonb NOT NULL
 * - is_verified, is_support_staff, mfa_enabled: boolean
 */

import { useState, useEffect } from "react";
import { Save, User as UserIcon, Mail, Phone, Globe, Shield, Lock, FileCode, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { User, CreateUserRequest, UpdateUserRequest, UserStatus, Locale, USER_STATUSES, LOCALES } from "../../api/usersApi";
import { showToast } from "../../lib/toast";

interface EnhancedUserFormProps {
  initialData?: Partial<User>;
  isEdit?: boolean;
  onSubmit: (data: CreateUserRequest | UpdateUserRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động (Active)",
  BANNED: "Bị cấm (Banned)",
  DISABLED: "Vô hiệu hóa (Disabled)",
  PENDING: "Chờ duyệt (Pending)",
};

export function EnhancedUserForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  loading = false,
  onCancel
}: EnhancedUserFormProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("general");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [metadataJson, setMetadataJson] = useState("{}");

  const [formData, setFormData] = useState<CreateUserRequest & { mfa_enabled?: boolean; status?: UserStatus; is_verified?: boolean }>({
    email: "",
    full_name: "",
    phone_number: "",
    password: "", // Only for creation
    avatar_url: "",
    status: "ACTIVE",
    is_support_staff: false,
    mfa_enabled: false,
    is_verified: false,
    locale: "vi-VN",
    metadata: {},
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || "",
        full_name: initialData.full_name || "",
        phone_number: initialData.phone_number || "",
        password: "", // Never populate password
        avatar_url: initialData.avatar_url || "",
        status: initialData.status || "ACTIVE",
        is_support_staff: initialData.is_support_staff || false,
        mfa_enabled: initialData.mfa_enabled || false,
        is_verified: initialData.is_verified || false,
        locale: initialData.locale || "vi-VN",
        metadata: initialData.metadata || {},
      });
      setMetadataJson(JSON.stringify(initialData.metadata || {}, null, 2));
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate Email
    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Email không đúng định dạng";
      }
    }

    // Validate Full Name
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Họ tên là bắt buộc";
    }

    // Validate Avatar URL
    if (formData.avatar_url && !/^https?:\/\//.test(formData.avatar_url)) {
      newErrors.avatar_url = "URL ảnh đại diện phải bắt đầu bằng http:// hoặc https://";
    }

    // Validate Metadata JSON
    try {
      JSON.parse(metadataJson);
    } catch (e) {
      newErrors.metadata = "JSON metadata không hợp lệ";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.email || newErrors.full_name || newErrors.phone_number) setActiveTab("general");
      else if (newErrors.avatar_url) setActiveTab("profile"); // Fallback if general
      else if (newErrors.metadata) setActiveTab("advanced");
      
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
      
      // Construct payload
      const submitData: any = {
        ...formData,
        metadata: parsedMetadata,
      };

      // Clean up fields
      if (isEdit || !submitData.password) {
        delete submitData.password;
      }
      
      // Handle empty optional fields
      if (!submitData.phone_number) delete submitData.phone_number;
      if (!submitData.avatar_url) delete submitData.avatar_url;

      // Type cast to ensure compatibility with interface
      if (isEdit) {
        await onSubmit(submitData as UpdateUserRequest);
      } else {
        await onSubmit(submitData as CreateUserRequest);
      }
    } catch (error: any) {
      console.error("Form submit error:", error);
      showToast.error("Lỗi", error.message || "Có lỗi xảy ra");
    }
  };

  const handleChange = (field: string, value: any) => {
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
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="security">Bảo mật & Quyền</TabsTrigger>
          <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription>
                Thông tin định danh cơ bản của người dùng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Họ và tên <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={errors.full_name ? "border-destructive" : ""}
                  />
                  {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="user@example.com"
                      className={errors.email ? "border-destructive" : ""}
                      disabled={isEdit} // Email acts as identifier, usually immutable
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Số điện thoại</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone_number"
                      value={formData.phone_number || ""}
                      onChange={(e) => handleChange("phone_number", e.target.value)}
                      placeholder="+84..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locale">Ngôn ngữ / Vùng</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <Select 
                      value={formData.locale} 
                      onValueChange={(value) => handleChange("locale", value)}
                    >
                      <SelectTrigger>
                      <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCALES.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    value={formData.avatar_url || ""}
                    onChange={(e) => handleChange("avatar_url", e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className={errors.avatar_url ? "border-destructive" : ""}
                  />
                  {errors.avatar_url && <p className="text-sm text-destructive">{errors.avatar_url}</p>}
                </div>

                {/* Password field for creation only */}
                {!isEdit && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="password">Mật khẩu khởi tạo (Tùy chọn)</Label>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password || ""}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="Để trống nếu muốn gửi email thiết lập mật khẩu"
                      />
                    </div>
                  </div>
                )}
              </div>

              {!isEdit && !formData.password && (
                <div className="bg-blue-50 p-4 rounded-md text-sm border border-blue-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-blue-700">
                    <strong>Lưu ý:</strong> Nếu không nhập mật khẩu, hệ thống sẽ gửi email hướng dẫn thiết lập mật khẩu cho người dùng mới.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Security */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Bảo mật & Trạng thái
              </CardTitle>
              <CardDescription>
                Quản lý quyền truy cập, trạng thái tài khoản và MFA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái tài khoản</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleChange("status", value as UserStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Xác thực Email (Verified)</Label>
                    <p className="text-sm text-muted-foreground">
                      Người dùng đã xác thực email sở hữu
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_verified}
                    onCheckedChange={(checked) => handleChange("is_verified", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Nhân viên hỗ trợ (Support Staff)</Label>
                    <p className="text-sm text-muted-foreground">
                      Cấp quyền truy cập hệ thống hỗ trợ
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_support_staff}
                    onCheckedChange={(checked) => handleChange("is_support_staff", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label className="text-base">Bảo mật 2 lớp (MFA)</Label>
                    <p className="text-sm text-muted-foreground">
                      Yêu cầu xác thực 2 yếu tố khi đăng nhập
                    </p>
                  </div>
                  <Switch
                    checked={formData.mfa_enabled}
                    onCheckedChange={(checked) => handleChange("mfa_enabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Advanced */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                Metadata (JSON)
              </CardTitle>
              <CardDescription>
                Dữ liệu bổ sung cho người dùng (preferences, external IDs...)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metadata">JSON Editor</Label>
                <Textarea
                  id="metadata"
                  value={metadataJson}
                  onChange={(e) => setMetadataJson(e.target.value)}
                  className={`font-mono text-sm h-[300px] ${errors.metadata ? "border-destructive" : ""}`}
                  placeholder="{}"
                />
                {errors.metadata && <p className="text-sm text-destructive">{errors.metadata}</p>}
              </div>
              <p className="text-xs text-muted-foreground">
                Nhập dữ liệu định dạng JSON hợp lệ. Ví dụ: <code>{`{ "department": "Sales", "employee_id": "E123" }`}</code>
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
