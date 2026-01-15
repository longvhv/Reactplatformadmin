/**
 * Add Tenant Page
 * 
 * Features:
 * - Complete tenant creation form
 * - Hierarchical tenant support (parent selection)
 * - Partner relationship support
 * - Dynamic profile and settings
 * - Full validation
 * - i18n support
 * - Indigo theme design
 * 
 * Database Schema: tenants table
 * Route: /core/tenants/add
 * 
 * Fixed: SelectItem empty values replaced with 'none' (2026-01-15)
 * 
 * @see /api/tenantsApi.ts
 * @see /data/tenants.ts
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Save, X, Globe, Shield, 
  Clock, CreditCard, Settings, User, MapPin 
} from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner@2.0.3';
import { tenantsApi, CreateTenantRequest } from '../api/tenantsApi';
import type { 
  TenantStatus, 
  TenantTier, 
  DataRegion, 
  ComplianceLevel,
  BillingType,
  Tenant 
} from '../data/tenants';

// ==================== CONSTANTS ====================

const TENANT_TIERS: { value: TenantTier; label: string }[] = [
  { value: 'FREE', label: 'Free - Gói miễn phí' },
  { value: 'PRO', label: 'Pro - Gói chuyên nghiệp' },
  { value: 'ENTERPRISE', label: 'Enterprise - Gói doanh nghiệp' },
  { value: 'PARTNER_BASIC', label: 'Partner Basic - Đối tác cơ bản' },
  { value: 'PARTNER_PREMIUM', label: 'Partner Premium - Đối tác cao cấp' },
  { value: 'PARTNER_ELITE', label: 'Partner Elite - Đối tác ưu tú' },
  { value: 'PROVIDER', label: 'Provider - Nhà cung cấp nền tảng' },
];

const TENANT_STATUSES: { value: TenantStatus; label: string }[] = [
  { value: 'TRIAL', label: 'Trial - Dùng thử' },
  { value: 'ACTIVE', label: 'Active - Đang hoạt động' },
  { value: 'SUSPENDED', label: 'Suspended - Tạm ngưng' },
  { value: 'CANCELLED', label: 'Cancelled - Đã hủy' },
];

const DATA_REGIONS: { value: DataRegion; label: string }[] = [
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
];

const COMPLIANCE_LEVELS: { value: ComplianceLevel; label: string }[] = [
  { value: 'STANDARD', label: 'Standard - Chuẩn' },
  { value: 'GDPR', label: 'GDPR - Châu Âu' },
  { value: 'HIPAA', label: 'HIPAA - Y tế Mỹ' },
  { value: 'PCI-DSS', label: 'PCI-DSS - Thanh toán' },
];

const BILLING_TYPES: { value: BillingType; label: string }[] = [
  { value: 'PREPAID', label: 'Prepaid - Trả trước' },
  { value: 'POSTPAID', label: 'Postpaid - Trả sau' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Ho_Chi_Minh',
  'Australia/Sydney',
];

// ==================== COMPONENT ====================

export default function AddTenantPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // ==================== STATE ====================

  // Form data - Core fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [tier, setTier] = useState<TenantTier>('FREE');
  const [status, setStatus] = useState<TenantStatus>('TRIAL');
  const [dataRegion, setDataRegion] = useState<DataRegion>('ap-southeast-1');
  const [complianceLevel, setComplianceLevel] = useState<ComplianceLevel>('STANDARD');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');
  const [billingType, setBillingType] = useState<BillingType>('POSTPAID');

  // Hierarchical & Partner
  const [parentTenantId, setParentTenantId] = useState<string>('none');
  const [partnerTenantId, setPartnerTenantId] = useState<string>('none');

  // Profile fields
  const [billingEmail, setBillingEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [domain, setDomain] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [website, setWebsite] = useState('');

  // Settings fields
  const [maxUsers, setMaxUsers] = useState(10);
  const [maxStorage, setMaxStorage] = useState(50);
  const [mfaEnforced, setMfaEnforced] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [customBranding, setCustomBranding] = useState(false);
  const [apiAccess, setApiAccess] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);

  // ==================== EFFECTS ====================

  useEffect(() => {
    loadTenants();
  }, []);

  // Auto-generate code from name
  useEffect(() => {
    if (name && !code) {
      const generatedCode = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 64);
      setCode(generatedCode);
    }
  }, [name, code]);

  // Auto-set limits based on tier
  useEffect(() => {
    switch (tier) {
      case 'FREE':
        setMaxUsers(10);
        setMaxStorage(50);
        setApiAccess(false);
        setSsoEnabled(false);
        setCustomBranding(false);
        break;
      case 'PRO':
        setMaxUsers(50);
        setMaxStorage(200);
        setApiAccess(true);
        setSsoEnabled(false);
        setCustomBranding(true);
        break;
      case 'ENTERPRISE':
        setMaxUsers(200);
        setMaxStorage(1000);
        setApiAccess(true);
        setSsoEnabled(true);
        setCustomBranding(true);
        break;
      case 'PARTNER_BASIC':
        setMaxUsers(30);
        setMaxStorage(100);
        setApiAccess(true);
        break;
      case 'PARTNER_PREMIUM':
        setMaxUsers(100);
        setMaxStorage(500);
        setApiAccess(true);
        setSsoEnabled(true);
        break;
      case 'PARTNER_ELITE':
        setMaxUsers(500);
        setMaxStorage(2000);
        setApiAccess(true);
        setSsoEnabled(true);
        setCustomBranding(true);
        break;
      case 'PROVIDER':
        setMaxUsers(1000);
        setMaxStorage(5000);
        setApiAccess(true);
        setSsoEnabled(true);
        setCustomBranding(true);
        setMfaEnforced(true);
        break;
    }
  }, [tier]);

  // ==================== HANDLERS ====================

  const loadTenants = async () => {
    try {
      const data = await tenantsApi.getAll();
      setAvailableTenants(data);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!code.trim()) {
      newErrors.code = 'Mã tenant là bắt buộc';
    } else if (!/^[a-z0-9-]+$/.test(code)) {
      newErrors.code = 'Mã tenant chỉ chứa chữ thường, số và dấu gạch ngang';
    }

    if (!name.trim()) {
      newErrors.name = 'Tên tenant là bắt buộc';
    }

    if (!billingEmail.trim()) {
      newErrors.billingEmail = 'Email thanh toán là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
      newErrors.billingEmail = 'Email không hợp lệ';
    }

    if (maxUsers < 1) {
      newErrors.maxUsers = 'Số lượng user tối thiểu là 1';
    }

    if (maxStorage < 1) {
      newErrors.maxStorage = 'Dung lượng tối thiểu là 1 GB';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setLoading(true);

    try {
      const requestData: CreateTenantRequest = {
        code: code.trim(),
        name: name.trim(),
        tier,
        status,
        data_region: dataRegion,
        compliance_level: complianceLevel,
        timezone,
        billing_type: billingType,
        parent_tenant_id: parentTenantId === 'none' ? null : parentTenantId,
        partner_tenant_id: partnerTenantId === 'none' ? null : partnerTenantId,
        profile: {
          billing_email: billingEmail.trim(),
          phone: phone.trim() || undefined,
          domain: domain.trim() || undefined,
          contact_person: contactPerson.trim() || undefined,
          industry: industry.trim() || undefined,
          company_size: companySize || undefined,
          country: country.trim() || undefined,
          address: address.trim() || undefined,
          tax_id: taxId.trim() || undefined,
          website: website.trim() || undefined,
        },
        settings: {
          max_users: maxUsers,
          max_storage: maxStorage,
          current_users: 0,
          current_storage: 0,
          mfa_enforced: mfaEnforced,
          sso_enabled: ssoEnabled,
          custom_branding: customBranding,
          api_access: apiAccess,
          features: [],
        },
      };

      const newTenant = await tenantsApi.create(requestData);

      toast.success('Tạo tenant thành công!', {
        description: `Tenant "${newTenant.name}" đã được tạo`,
      });

      navigate('/core/tenants');
    } catch (error: any) {
      console.error('Failed to create tenant:', error);
      toast.error('Tạo tenant thất bại', {
        description: error?.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/core/tenants');
  };

  // Clear error when field changes
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">Thêm tenant mới</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Tạo một tổ chức/doanh nghiệp mới trong hệ thống
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Tên tenant <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError('name');
                    }}
                    placeholder="Acme Corporation"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Code */}
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Mã tenant <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toLowerCase());
                      clearError('code');
                    }}
                    placeholder="acme-corp"
                    className={errors.code ? 'border-red-500' : ''}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-500">{errors.code}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Chỉ sử dụng chữ thường, số và dấu gạch ngang
                  </p>
                </div>

                {/* Tier */}
                <div className="space-y-2">
                  <Label htmlFor="tier">
                    Gói dịch vụ <span className="text-red-500">*</span>
                  </Label>
                  <Select value={tier} onValueChange={(v) => setTier(v as TenantTier)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TENANT_TIERS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">
                    Trạng thái <span className="text-red-500">*</span>
                  </Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as TenantStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TENANT_STATUSES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Hạ tầng & Bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Region */}
                <div className="space-y-2">
                  <Label htmlFor="dataRegion">
                    Khu vực dữ liệu <span className="text-red-500">*</span>
                  </Label>
                  <Select value={dataRegion} onValueChange={(v) => setDataRegion(v as DataRegion)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATA_REGIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Compliance Level */}
                <div className="space-y-2">
                  <Label htmlFor="complianceLevel">
                    Mức độ tuân thủ <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={complianceLevel} 
                    onValueChange={(v) => setComplianceLevel(v as ComplianceLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLIANCE_LEVELS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label htmlFor="timezone">Múi giờ</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing Type */}
                <div className="space-y-2">
                  <Label htmlFor="billingType">
                    Hình thức thanh toán <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={billingType} 
                    onValueChange={(v) => setBillingType(v as BillingType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_TYPES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hierarchical & Partner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Quan hệ tổ chức
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Parent Tenant */}
                <div className="space-y-2">
                  <Label htmlFor="parentTenant">Tenant cha (tùy chọn)</Label>
                  <Select value={parentTenantId} onValueChange={setParentTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Không có tenant cha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      {availableTenants.map((tenant) => (
                        <SelectItem key={tenant._id} value={tenant._id}>
                          {tenant.name} ({tenant.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Dùng cho cấu trúc tổ chức phân cấp
                  </p>
                </div>

                {/* Partner Tenant */}
                <div className="space-y-2">
                  <Label htmlFor="partnerTenant">Đối tác (tùy chọn)</Label>
                  <Select value={partnerTenantId} onValueChange={setPartnerTenantId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Không có đối tác" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      {availableTenants
                        .filter(t => t.tier?.startsWith('PARTNER_'))
                        .map((tenant) => (
                          <SelectItem key={tenant._id} value={tenant._id}>
                            {tenant.name} ({tenant.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Chọn đối tác quản lý tenant này
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Billing Email */}
                <div className="space-y-2">
                  <Label htmlFor="billingEmail">
                    Email thanh toán <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={billingEmail}
                    onChange={(e) => {
                      setBillingEmail(e.target.value);
                      clearError('billingEmail');
                    }}
                    placeholder="billing@acme.com"
                    className={errors.billingEmail ? 'border-red-500' : ''}
                  />
                  {errors.billingEmail && (
                    <p className="text-sm text-red-500">{errors.billingEmail}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+84-xxx-xxx-xxx"
                  />
                </div>

                {/* Contact Person */}
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Người liên hệ</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                {/* Domain */}
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="acme.example.com"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Ngành nghề</Label>
                  <Input
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Technology, Retail, Healthcare..."
                  />
                </div>

                {/* Company Size */}
                <div className="space-y-2">
                  <Label htmlFor="companySize">Quy mô công ty</Label>
                  <Select value={companySize || 'none'} onValueChange={(v) => setCompanySize(v === 'none' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quy mô" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không xác định</SelectItem>
                      <SelectItem value="1-10">1-10 nhân viên</SelectItem>
                      <SelectItem value="10-50">10-50 nhân viên</SelectItem>
                      <SelectItem value="50-100">50-100 nhân viên</SelectItem>
                      <SelectItem value="100-500">100-500 nhân viên</SelectItem>
                      <SelectItem value="500+">500+ nhân viên</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country">Quốc gia</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Vietnam"
                  />
                </div>

                {/* Tax ID */}
                <div className="space-y-2">
                  <Label htmlFor="taxId">Mã số thuế</Label>
                  <Input
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="0123456789"
                  />
                </div>

                {/* Website */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.acme.com"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings & Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Cài đặt & Tính năng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Max Users */}
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">
                    Số lượng user tối đa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={maxUsers}
                    onChange={(e) => {
                      setMaxUsers(Number(e.target.value));
                      clearError('maxUsers');
                    }}
                    min={1}
                    className={errors.maxUsers ? 'border-red-500' : ''}
                  />
                  {errors.maxUsers && (
                    <p className="text-sm text-red-500">{errors.maxUsers}</p>
                  )}
                </div>

                {/* Max Storage */}
                <div className="space-y-2">
                  <Label htmlFor="maxStorage">
                    Dung lượng tối đa (GB) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="maxStorage"
                    type="number"
                    value={maxStorage}
                    onChange={(e) => {
                      setMaxStorage(Number(e.target.value));
                      clearError('maxStorage');
                    }}
                    min={1}
                    className={errors.maxStorage ? 'border-red-500' : ''}
                  />
                  {errors.maxStorage && (
                    <p className="text-sm text-red-500">{errors.maxStorage}</p>
                  )}
                </div>
              </div>

              {/* Feature Checkboxes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mfaEnforced"
                    checked={mfaEnforced}
                    onCheckedChange={(checked) => setMfaEnforced(checked as boolean)}
                  />
                  <Label htmlFor="mfaEnforced" className="cursor-pointer">
                    Bắt buộc xác thực 2 yếu tố (MFA)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ssoEnabled"
                    checked={ssoEnabled}
                    onCheckedChange={(checked) => setSsoEnabled(checked as boolean)}
                  />
                  <Label htmlFor="ssoEnabled" className="cursor-pointer">
                    Cho phép đăng nhập SSO
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customBranding"
                    checked={customBranding}
                    onCheckedChange={(checked) => setCustomBranding(checked as boolean)}
                  />
                  <Label htmlFor="customBranding" className="cursor-pointer">
                    Cho phép tùy chỉnh giao diện
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="apiAccess"
                    checked={apiAccess}
                    onCheckedChange={(checked) => setApiAccess(checked as boolean)}
                  />
                  <Label htmlFor="apiAccess" className="cursor-pointer">
                    Cho phép truy cập API
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Đang tạo...' : 'Tạo tenant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}