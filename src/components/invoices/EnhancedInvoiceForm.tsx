/**
 * Enhanced Invoice Form Component
 * Standardized form for creating/editing subscription invoices
 * 
 * Compliant with subscription_invoices schema:
 * - invoice_number: varchar(50) NOT NULL UNIQUE
 * - status: ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE')
 * - amounts: numeric(19,4) >= 0
 * - billing_info, items_snapshot, tax_breakdown: jsonb
 * - dates: billing_period_start <= billing_period_end
 * - pdf_url: text
 * - subscription_id: uuid
 */

import { useState, useEffect } from "react";
import { Save, Plus, Trash, Calendar, FileText, User, DollarSign, Tag, Link as LinkIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  Invoice, 
  CreateInvoiceRequest, 
  UpdateInvoiceRequest, 
  ItemSnapshot, 
  BillingInfo 
} from "../../api/invoiceApi";
import { tenantsApi, Tenant } from "../../api/tenantsApi";
import { tenantSubscriptionsApi } from "../../api/tenantSubscriptionsApi";
import { showToast } from "../../lib/toast";

interface EnhancedInvoiceFormProps {
  initialData?: Partial<Invoice>;
  isEdit?: boolean;
  onSubmit: (data: CreateInvoiceRequest | UpdateInvoiceRequest) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

const INVOICE_STATUSES = [
  { value: "DRAFT", label: "Nháp (Draft)" },
  { value: "OPEN", label: "Chờ thanh toán (Open)" },
  { value: "PAID", label: "Đã thanh toán (Paid)" },
  { value: "VOID", label: "Đã hủy (Void)" },
  { value: "UNCOLLECTIBLE", label: "Không thể thu hồi (Uncollectible)" },
];

const CURRENCIES = ["VND", "USD"];

export function EnhancedInvoiceForm({ 
  initialData, 
  isEdit = false, 
  onSubmit, 
  loading = false,
  onCancel
}: EnhancedInvoiceFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]); // Use appropriate type if available
  
  // Form State
  const [formData, setFormData] = useState<Partial<CreateInvoiceRequest>>({
    invoice_number: "",
    tenant_id: "",
    subscription_id: "",
    status: "DRAFT",
    currency_code: "VND",
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    amount_paid: 0,
    billing_period_start: new Date().toISOString(),
    billing_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    items_snapshot: [],
    billing_info: {},
    tax_breakdown: [],
    metadata: {},
    pdf_url: "",
  });

  const [items, setItems] = useState<ItemSnapshot[]>([]);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({});
  const [metadataJson, setMetadataJson] = useState("{}");

  useEffect(() => {
    // Load tenants
    const fetchTenants = async () => {
      try {
        const data = await tenantsApi.getAll();
        setTenants(data);
      } catch (err) {
        console.error("Failed to load tenants", err);
      }
    };
    fetchTenants();
  }, []);

  // Fetch subscriptions when tenant_id changes
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!formData.tenant_id) {
        setSubscriptions([]);
        return;
      }
      try {
        const data = await tenantSubscriptionsApi.getAll({ tenant_id: formData.tenant_id });
        setSubscriptions(data);
      } catch (err) {
        console.error("Failed to load subscriptions", err);
      }
    };
    fetchSubscriptions();
  }, [formData.tenant_id]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        billing_period_start: initialData.billing_period_start || new Date().toISOString(),
        billing_period_end: initialData.billing_period_end || new Date().toISOString(),
        due_date: initialData.due_date || new Date().toISOString(),
        subscription_id: initialData.subscription_id || "", // Ensure subscription_id is set
      });
      setItems(initialData.items_snapshot || []);
      setBillingInfo(initialData.billing_info || {});
      setMetadataJson(JSON.stringify(initialData.metadata || {}, null, 2));
    }
  }, [initialData]);

  // Auto-calculate totals when items change
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    setFormData(prev => {
      const discount = prev.discount_amount || 0;
      const tax = prev.tax_amount || 0;
      const total = Math.max(0, subtotal - discount + tax);
      return {
        ...prev,
        subtotal,
        total_amount: total
      };
    });
  }, [items, formData.discount_amount, formData.tax_amount]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoice_number?.trim()) newErrors.invoice_number = "Số hóa đơn là bắt buộc";
    if (!formData.tenant_id) newErrors.tenant_id = "Khách hàng (Tenant) là bắt buộc";
    
    if (formData.billing_period_start && formData.billing_period_end) {
      if (new Date(formData.billing_period_start) > new Date(formData.billing_period_end)) {
        newErrors.dates = "Ngày bắt đầu phải trước ngày kết thúc";
      }
    }

    try {
      JSON.parse(metadataJson);
    } catch {
      newErrors.metadata = "JSON không hợp lệ";
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
      const submitData: any = {
        ...formData,
        // Ensure subscription_id is undefined if empty string to match optional type
        subscription_id: formData.subscription_id || undefined,
        items_snapshot: items,
        billing_info: billingInfo,
        metadata: JSON.parse(metadataJson),
        version: initialData?.version || 1
      };
      
      await onSubmit(submitData);
    } catch (error: any) {
      console.error("Submit error:", error);
      showToast.error("Lỗi", error.message || "Có lỗi xảy ra");
    }
  };

  // Helper to update form fields
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[field];
        return newErrs;
      });
    }
  };

  // Item helpers
  const addItem = () => {
    setItems([...items, { name: "", qty: 1, price: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: keyof ItemSnapshot, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate item total
    if (field === "qty" || field === "price") {
      newItems[index].total = (newItems[index].qty || 0) * (newItems[index].price || 0);
    }
    
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const formatDateValue = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="items">Sản phẩm/Dịch vụ</TabsTrigger>
          <TabsTrigger value="billing">Thông tin thanh toán</TabsTrigger>
          <TabsTrigger value="advanced">Nâng cao</TabsTrigger>
        </TabsList>

        {/* --- GENERAL TAB --- */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Thông tin hóa đơn
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Số hóa đơn <span className="text-destructive">*</span></Label>
                <Input 
                  id="invoice_number"
                  value={formData.invoice_number}
                  onChange={e => updateField("invoice_number", e.target.value)}
                  placeholder="INV-2024-001"
                  className={errors.invoice_number ? "border-destructive" : ""}
                />
                {errors.invoice_number && <p className="text-sm text-destructive">{errors.invoice_number}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenant_id">Khách hàng (Tenant) <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.tenant_id} 
                  onValueChange={val => {
                    updateField("tenant_id", val);
                    updateField("subscription_id", ""); // Reset subscription when tenant changes
                  }}
                  disabled={isEdit}
                >
                  <SelectTrigger className={errors.tenant_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Chọn khách hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map(t => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tenant_id && <p className="text-sm text-destructive">{errors.tenant_id}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscription_id">Gói đăng ký (Subscription)</Label>
                <Select 
                  value={formData.subscription_id} 
                  onValueChange={val => updateField("subscription_id", val)}
                  disabled={!formData.tenant_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.tenant_id ? "Chọn gói đăng ký (Tùy chọn)" : "Vui lòng chọn khách hàng trước"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Không chọn --</SelectItem>
                    {subscriptions.map(s => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.plan_code || "Subscription"} ({s.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={val => updateField("status", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tiền tệ</Label>
                <Select 
                  value={formData.currency_code} 
                  onValueChange={val => updateField("currency_code", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kỳ thanh toán (Từ - Đến)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="datetime-local"
                    value={formatDateValue(formData.billing_period_start)}
                    onChange={e => updateField("billing_period_start", new Date(e.target.value).toISOString())}
                  />
                  <Input 
                    type="datetime-local"
                    value={formatDateValue(formData.billing_period_end)}
                    onChange={e => updateField("billing_period_end", new Date(e.target.value).toISOString())}
                  />
                </div>
                {errors.dates && <p className="text-sm text-destructive">{errors.dates}</p>}
              </div>

              <div className="space-y-2">
                <Label>Hạn thanh toán (Due Date)</Label>
                <Input 
                  type="datetime-local"
                  value={formatDateValue(formData.due_date)}
                  onChange={e => updateField("due_date", new Date(e.target.value).toISOString())}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ITEMS TAB --- */}
        <TabsContent value="items" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                Chi tiết sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg bg-muted/20">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs">Tên sản phẩm</Label>
                      <Input 
                        value={item.name} 
                        onChange={e => updateItem(idx, "name", e.target.value)}
                        placeholder="VD: Gói Basic" 
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Số lượng</Label>
                      <Input 
                        type="number" 
                        min="1"
                        value={item.qty} 
                        onChange={e => updateItem(idx, "qty", parseFloat(e.target.value))} 
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Đơn giá</Label>
                      <Input 
                        type="number" 
                        min="0"
                        value={item.price} 
                        onChange={e => updateItem(idx, "price", parseFloat(e.target.value))} 
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label className="text-xs">Thành tiền</Label>
                      <div className="h-10 flex items-center font-semibold text-sm">
                        {item.total.toLocaleString()}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-destructive">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addItem} className="w-full border-dashed">
                  <Plus className="w-4 h-4 mr-2" /> Thêm dòng
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t">
                <div>{/* Spacer */}</div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Tạm tính (Subtotal)</Label>
                    <span className="font-medium">{formData.subtotal?.toLocaleString()} {formData.currency_code}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Giảm giá</Label>
                    <Input 
                      type="number" 
                      className="w-32 text-right h-8" 
                      value={formData.discount_amount}
                      onChange={e => updateField("discount_amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Thuế</Label>
                    <Input 
                      type="number" 
                      className="w-32 text-right h-8"
                      value={formData.tax_amount}
                      onChange={e => updateField("tax_amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                    <Label className="text-lg">Tổng cộng</Label>
                    <span className="text-indigo-600">{formData.total_amount?.toLocaleString()} {formData.currency_code}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- BILLING INFO TAB --- */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Tên khách hàng / Công ty</Label>
                <Input 
                  value={billingInfo.customer_name || ""} 
                  onChange={e => setBillingInfo(prev => ({ ...prev, customer_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Mã số thuế</Label>
                <Input 
                  value={billingInfo.tax_id || ""} 
                  onChange={e => setBillingInfo(prev => ({ ...prev, tax_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email nhận hóa đơn</Label>
                <Input 
                  type="email"
                  value={billingInfo.customer_email || ""} 
                  onChange={e => setBillingInfo(prev => ({ ...prev, customer_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input 
                  value={billingInfo.customer_phone || ""} 
                  onChange={e => setBillingInfo(prev => ({ ...prev, customer_phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Địa chỉ</Label>
                <Textarea 
                  value={billingInfo.address || ""} 
                  onChange={e => setBillingInfo(prev => ({ ...prev, address: e.target.value }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- ADVANCED TAB --- */}
        <TabsContent value="advanced" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Thông tin hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  PDF URL
                </Label>
                <Input 
                  value={formData.pdf_url || ""}
                  onChange={e => updateField("pdf_url", e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">Link đến file PDF của hóa đơn (nếu có)</p>
              </div>

              <div className="space-y-2">
                <Label>Metadata (JSON)</Label>
                <Textarea
                  value={metadataJson}
                  onChange={e => setMetadataJson(e.target.value)}
                  className={`font-mono text-sm h-[200px] ${errors.metadata ? "border-destructive" : ""}`}
                />
                {errors.metadata && <p className="text-sm text-destructive mt-1">{errors.metadata}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Hủy bỏ
        </Button>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? "Đang lưu..." : (isEdit ? "Cập nhật" : "Tạo mới")}
          {!loading && <Save className="w-4 h-4 ml-2" />}
        </Button>
      </div>
    </form>
  );
}
