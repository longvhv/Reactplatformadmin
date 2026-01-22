/**
 * Enhanced Application Form
 * Standardized form component for creating/editing applications
 * 
 * Compliant with database schema:
 * - code: varchar(50), UNIQUE, regex ^[A-Z0-9_]+$
 * - name: varchar(255), NOT NULL
 * - description: text
 * - is_active: boolean
 */

import { useState, useEffect } from "react";
import { useRouter } from "../../shim/next-navigation";
import { Save, AppWindow, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react";
import { useLanguage } from "../../providers/LanguageProvider";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Application } from "../../api/applicationsApi";

interface EnhancedApplicationFormProps {
  initialData?: Partial<Application>;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void>;
  loading?: boolean;
}

export function EnhancedApplicationForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  loading = false 
}: EnhancedApplicationFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        description: initialData.description || "",
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate Code
    if (!formData.code.trim()) {
      newErrors.code = "Mã ứng dụng là bắt buộc";
    } else if (formData.code.length > 50) {
      newErrors.code = "Mã ứng dụng không được quá 50 ký tự";
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = "Mã ứng dụng phải là chữ hoa, số và gạch dưới (VD: APP_CODE)";
    }

    // Validate Name
    if (!formData.name.trim()) {
      newErrors.name = "Tên ứng dụng là bắt buộc";
    } else if (formData.name.length > 255) {
      newErrors.name = "Tên ứng dụng không được quá 255 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCodeChange = (value: string) => {
    // Auto-uppercase and simple cleanup for better UX
    const formatted = value.toUpperCase().replace(/\s+/g, '_');
    handleChange("code", formatted);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AppWindow className="w-5 h-5 text-indigo-600" />
            Thông tin ứng dụng
          </CardTitle>
          <CardDescription>
            Thiết lập thông tin cơ bản cho ứng dụng kỹ thuật
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="code">
                Mã ứng dụng <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="VD: TENANT_MGMT"
                disabled={isEdit}
                className={errors.code ? "border-destructive" : ""}
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
              <p className="text-xs text-muted-foreground">
                Định dạng: CHỮ_HOA_GẠCH_DƯỚI, tối đa 50 ký tự. Không thể thay đổi sau khi tạo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Tên ứng dụng <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="VD: Hệ thống quản lý Tenant"
                className={errors.name ? "border-destructive" : ""}
                maxLength={255}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Mô tả chi tiết về chức năng của ứng dụng..."
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-base">Kích hoạt ứng dụng</Label>
              <p className="text-sm text-muted-foreground">
                Cho phép ứng dụng này được sử dụng trong hệ thống
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Usage Info - Only show on edit */}
      {isEdit && (
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="space-y-1">
                <h4 className="font-medium text-blue-900 dark:text-blue-300">Trạng thái hệ thống</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Ứng dụng này đang được quản lý bởi hệ thống. Việc thay đổi mã ứng dụng bị vô hiệu hóa để đảm bảo tính toàn vẹn dữ liệu.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/core/applications")}
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