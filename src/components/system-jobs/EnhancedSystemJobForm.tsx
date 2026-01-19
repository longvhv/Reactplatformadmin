/**
 * Enhanced System Job Form Component
 * Standardized form for creating/editing system jobs
 * 
 * Compliant with system_jobs schema:
 * - job_name: varchar(255) NOT NULL
 * - job_type: varchar(100) NOT NULL
 * - description: text
 * - status: varchar(50) (pending, running, etc.)
 * - priority: varchar(20) (low, normal, high, critical)
 * - schedule_type: varchar(50)
 * - cron_expression: varchar(100)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Save, AlertTriangle, ArrowLeft, Clock, Activity, Settings, CalendarClock } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemJob, CreateJobRequest, UpdateJobRequest, systemJobsApi, validateCronExpression, parseCronExpression } from "@/api/systemJobsApi";
import { showToast } from "@/lib/toast";

interface EnhancedSystemJobFormProps {
  initialData?: Partial<SystemJob>;
  isEdit?: boolean;
  onSubmit: (data: CreateJobRequest | UpdateJobRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

const JOB_TYPES = [
  { value: "backup", label: "Backup & Restore" },
  { value: "cleanup", label: "Data Cleanup" },
  { value: "report", label: "Report Generation" },
  { value: "sync", label: "Data Synchronization" },
  { value: "notification", label: "Notification Broadcast" },
  { value: "archive", label: "Data Archival" },
  { value: "monitoring", label: "System Monitoring" },
  { value: "indexing", label: "Search Indexing" },
  { value: "maintenance", label: "General Maintenance" },
  { value: "validation", label: "Data Validation" },
];

const PRIORITIES = [
  { value: "low", label: "Thấp (Low)" },
  { value: "normal", label: "Bình thường (Normal)" },
  { value: "high", label: "Cao (High)" },
  { value: "critical", label: "Nghiêm trọng (Critical)" },
];

const SCHEDULE_TYPES = [
  { value: "manual", label: "Thủ công (Manual)" },
  { value: "scheduled", label: "Lên lịch (Cron)" },
  { value: "triggered", label: "Sự kiện (Triggered)" },
  { value: "recurring", label: "Định kỳ (Recurring)" },
];

const STATUSES = [
  { value: "pending", label: "Chờ xử lý (Pending)" },
  { value: "paused", label: "Tạm dừng (Paused)" },
  { value: "running", label: "Đang chạy (Running)" }, // Usually system managed, but editable by admin
  { value: "completed", label: "Hoàn thành (Completed)" },
  { value: "failed", label: "Thất bại (Failed)" },
];

export function EnhancedSystemJobForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  loading = false,
  onCancel
}: EnhancedSystemJobFormProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateJobRequest>({
    job_name: "",
    job_type: "maintenance",
    description: "",
    status: "pending",
    priority: "normal",
    schedule_type: "manual",
    cron_expression: "",
    is_active: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        job_name: initialData.job_name || "",
        job_type: initialData.job_type || "maintenance",
        description: initialData.description || "",
        status: initialData.status || "pending",
        priority: initialData.priority || "normal",
        schedule_type: initialData.schedule_type || "manual",
        cron_expression: initialData.cron_expression || "",
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate Job Name
    if (!formData.job_name.trim()) {
      newErrors.job_name = "Tên công việc là bắt buộc";
    } else if (formData.job_name.length > 255) {
      newErrors.job_name = "Tên công việc không được quá 255 ký tự";
    }

    // Validate Job Type
    if (!formData.job_type) {
      newErrors.job_type = "Loại công việc là bắt buộc";
    }

    // Validate Cron Expression if Scheduled
    if (formData.schedule_type === "scheduled") {
      if (!formData.cron_expression?.trim()) {
        newErrors.cron_expression = "Cron expression là bắt buộc khi chọn Lên lịch";
      } else if (!validateCronExpression(formData.cron_expression)) {
        newErrors.cron_expression = "Cron expression không hợp lệ (Format: * * * * *)";
      } else if (formData.cron_expression.length > 100) {
        newErrors.cron_expression = "Cron expression quá dài";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.job_name || newErrors.job_type || newErrors.description) {
        setActiveTab("general");
      } else if (newErrors.cron_expression) {
        setActiveTab("schedule");
      }
      showToast.error("Lỗi xác thực", "Vui lòng kiểm tra lại các trường thông tin");
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await onSubmit(formData);
  };

  const handleChange = (field: keyof CreateJobRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const cronDescription = formData.cron_expression && validateCronExpression(formData.cron_expression) 
    ? parseCronExpression(formData.cron_expression) 
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="schedule">Lịch trình</TabsTrigger>
          <TabsTrigger value="status">Trạng thái</TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </CardTitle>
              <CardDescription>
                Thiết lập tên và loại công việc hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="job_name">
                    Tên công việc <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="job_name"
                    value={formData.job_name}
                    onChange={(e) => handleChange("job_name", e.target.value)}
                    placeholder="VD: Nightly Backup"
                    className={errors.job_name ? "border-destructive" : ""}
                  />
                  {errors.job_name && <p className="text-sm text-destructive">{errors.job_name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_type">
                    Loại công việc <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.job_type} 
                    onValueChange={(value) => handleChange("job_type", value)}
                  >
                    <SelectTrigger className={errors.job_type ? "border-destructive" : ""}>
                      <SelectValue placeholder="Chọn loại công việc" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.job_type && <p className="text-sm text-destructive">{errors.job_type}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Mô tả chi tiết về công việc này..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Schedule */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Cấu hình lịch trình
              </CardTitle>
              <CardDescription>
                Định nghĩa khi nào công việc sẽ được thực thi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="schedule_type">Loại lịch trình</Label>
                <Select 
                  value={formData.schedule_type || "manual"} 
                  onValueChange={(value) => handleChange("schedule_type", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.schedule_type === "scheduled" && (
                <div className="space-y-4 border-l-2 border-indigo-200 pl-4">
                  <div className="space-y-2">
                    <Label htmlFor="cron_expression">
                      Cron Expression <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="cron_expression"
                        value={formData.cron_expression || ""}
                        onChange={(e) => handleChange("cron_expression", e.target.value)}
                        placeholder="* * * * *"
                        className={`font-mono ${errors.cron_expression ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.cron_expression && <p className="text-sm text-destructive">{errors.cron_expression}</p>}
                    <p className="text-xs text-muted-foreground">
                      Format: Minute Hour Day Month Weekday (VD: "0 0 * * *" là chạy hàng ngày lúc 00:00)
                    </p>
                  </div>
                  
                  {cronDescription && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                      <CalendarClock className="w-4 h-4" />
                      <span>Sẽ chạy: {cronDescription}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Status */}
        <TabsContent value="status" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Trạng thái & Ưu tiên
              </CardTitle>
              <CardDescription>
                Quản lý trạng thái hoạt động và mức độ ưu tiên
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái hiện tại</Label>
                  <Select 
                    value={formData.status || "pending"} 
                    onValueChange={(value) => handleChange("status", value as any)}
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

                <div className="space-y-2">
                  <Label htmlFor="priority">Mức độ ưu tiên</Label>
                  <Select 
                    value={formData.priority || "normal"} 
                    onValueChange={(value) => handleChange("priority", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-base">Kích hoạt</Label>
                  <p className="text-sm text-muted-foreground">
                    Cho phép hệ thống thực thi công việc này theo lịch trình
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
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel || (() => navigate("/platform/system-jobs"))}
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
