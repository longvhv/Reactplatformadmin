/**
 * Location Modal Component
 * Modal for creating/editing locations
 * Supports all fields including address, coordinates, and metadata
 * Dynamically renders extra fields based on Location Type
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  MapPin,
  Building2,
  Globe,
  Database,
  Info,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';
import {
  Location,
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationStatus,
  LocationAddress,
  locationsApi
} from '../../api/locationsApi';
import { LocationType, ExtraFieldDefinition } from '../../api/locationTypesApi';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLocationRequest | UpdateLocationRequest, id?: string) => Promise<void>;
  editData?: Location;
  tenantId: string;
  locationTypes: LocationType[];
  parentOptions: Location[]; // Flat list of potential parents
}

const TABS = [
  { id: 'general', label: 'Thông tin chung', icon: Building2 },
  { id: 'address', label: 'Địa chỉ', icon: MapPin },
  { id: 'coordinates', label: 'Tọa độ & Geofence', icon: Globe },
  { id: 'extended', label: 'Thông tin mở rộng', icon: Database },
];

export function LocationModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  tenantId,
  locationTypes,
  parentOptions
}: LocationModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState<Partial<CreateLocationRequest>>({
    name: '',
    code: '',
    type_id: '',
    parent_id: '',
    status: 'ACTIVE',
    is_headquarter: false,
    timezone: 'UTC',
    radius_meters: 100,
    address: {},
    coordinates: { latitude: 0, longitude: 0 },
    metadata: {},
  });

  // Load data for edit
  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        code: editData.code || '',
        type_id: editData.type_id,
        parent_id: editData.parent_id || '',
        status: editData.status,
        is_headquarter: editData.is_headquarter,
        timezone: editData.timezone,
        radius_meters: editData.radius_meters || 100,
        address: editData.address || {},
        coordinates: editData.coordinates || { latitude: 0, longitude: 0 },
        metadata: editData.metadata || {},
      });
    } else {
      resetForm();
    }
  }, [editData, isOpen]);

  // Reset form when opening for create or switching types
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type_id: locationTypes.length > 0 ? locationTypes[0]._id : '',
      parent_id: '',
      status: 'ACTIVE',
      is_headquarter: false,
      timezone: 'UTC',
      radius_meters: 100,
      address: {},
      coordinates: { latitude: 0, longitude: 0 },
      metadata: {},
    });
    setErrors({});
    setActiveTab('general');
  };

  // Get selected location type for dynamic fields
  const selectedType = locationTypes.find(t => t._id === formData.type_id);

  // Validation
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tên địa điểm là bắt buộc';
    }

    if (!formData.type_id) {
      newErrors.type_id = 'Loại địa điểm là bắt buộc';
    }

    // Coordinates validation
    if (formData.coordinates) {
      const { latitude, longitude } = formData.coordinates;
      if (latitude < -90 || latitude > 90) {
        newErrors.latitude = 'Vĩ độ phải từ -90 đến 90';
      }
      if (longitude < -180 || longitude > 180) {
        newErrors.longitude = 'Kinh độ phải từ -180 đến 180';
      }
    }

    // Radius validation
    if (formData.radius_meters !== undefined && formData.radius_meters <= 0) {
      newErrors.radius_meters = 'Bán kính phải lớn hơn 0';
    }

    // Extra Fields Validation
    if (selectedType?.extra_fields) {
      selectedType.extra_fields.forEach(field => {
        if (field.required) {
          const value = formData.metadata?.[field.code];
          if (value === undefined || value === null || value === '') {
            newErrors[`field_${field.code}`] = `${field.name} là bắt buộc`;
          }
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        tenant_id: tenantId,
        // Remove empty strings for optional fields
        parent_id: formData.parent_id || undefined,
        code: formData.code || undefined,
        // Only send coordinates if they are valid/set (not 0,0 unless explicitly intended, but typically 0,0 is default/unset)
        // Here we assume if both are 0, it's unset. 
        coordinates: (formData.coordinates?.latitude !== 0 || formData.coordinates?.longitude !== 0) 
          ? formData.coordinates 
          : undefined,
      };

      if (editData) {
        await onSubmit(submitData as UpdateLocationRequest, editData._id);
      } else {
        await onSubmit(submitData as CreateLocationRequest);
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving location:', error);
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // Address Handlers
  const handleAddressChange = (field: keyof LocationAddress, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  // Metadata/Extra Fields Handler
  const handleMetadataChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value }
    }));
  };

  // Arbitrary Metadata Handlers
  const [metaKey, setMetaKey] = useState('');
  const [metaValue, setMetaValue] = useState('');

  const addArbitraryMetadata = () => {
    if (!metaKey.trim()) return;
    handleMetadataChange(metaKey.trim(), metaValue);
    setMetaKey('');
    setMetaValue('');
  };

  const removeMetadata = (key: string) => {
    const newMeta = { ...formData.metadata };
    delete newMeta[key];
    setFormData(prev => ({ ...prev, metadata: newMeta }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editData ? 'Cập nhật Địa điểm' : 'Thêm Địa điểm mới'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 border-t-2 border-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên địa điểm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Văn phòng chính..."
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mã địa điểm
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                    placeholder="OFFICE-001"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại địa điểm <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type_id}
                    onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 ${errors.type_id ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">-- Chọn loại --</option>
                    {locationTypes.map(type => (
                      <option key={type._id} value={type._id}>{type.name}</option>
                    ))}
                  </select>
                  {errors.type_id && <p className="text-red-500 text-xs mt-1">{errors.type_id}</p>}
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Địa điểm cha
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                  >
                    <option value="">-- Không có (Địa điểm gốc) --</option>
                    {parentOptions
                      .filter(p => p._id !== editData?._id) // Prevent self-selection
                      .map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LocationStatus })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                  >
                    <option value="ACTIVE">Hoạt động (Active)</option>
                    <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
                    <option value="CLOSED">Đã đóng cửa (Closed)</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Múi giờ
                  </label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                    placeholder="UTC"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      id="is_headquarter"
                      checked={formData.is_headquarter}
                      onChange={(e) => setFormData({ ...formData, is_headquarter: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="is_headquarter" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Đặt làm Trụ sở chính (Headquarter)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ADDRESS TAB */}
            {activeTab === 'address' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Địa chỉ dòng 1
                  </label>
                  <input
                    type="text"
                    value={formData.address?.line1 || ''}
                    onChange={(e) => handleAddressChange('line1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                    placeholder="Số nhà, tên đường..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Địa chỉ dòng 2
                  </label>
                  <input
                    type="text"
                    value={formData.address?.line2 || ''}
                    onChange={(e) => handleAddressChange('line2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                    placeholder="Tòa nhà, tầng, phòng..."
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thành phố / Tỉnh
                  </label>
                  <input
                    type="text"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quận / Huyện / Bang
                  </label>
                  <input
                    type="text"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mã bưu chính (Postal Code)
                  </label>
                  <input
                    type="text"
                    value={formData.address?.postal_code || ''}
                    onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quốc gia
                  </label>
                  <input
                    type="text"
                    value={formData.address?.country || ''}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900"
                  />
                </div>
              </div>
            )}

            {/* COORDINATES TAB */}
            {activeTab === 'coordinates' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vĩ độ (Latitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={formData.coordinates?.latitude || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        coordinates: { ...formData.coordinates!, latitude: parseFloat(e.target.value) }
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 ${errors.latitude ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kinh độ (Longitude)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={formData.coordinates?.longitude || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        coordinates: { ...formData.coordinates!, longitude: parseFloat(e.target.value) }
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 ${errors.longitude ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
                  </div>

                   <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bán kính Geofence (Mét)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="1"
                        value={formData.radius_meters}
                        onChange={(e) => setFormData({ ...formData, radius_meters: parseInt(e.target.value) })}
                        className={`w-full max-w-[200px] px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 ${errors.radius_meters ? 'border-red-500' : 'border-gray-300'}`}
                      />
                      <span className="text-sm text-gray-500">mét</span>
                    </div>
                    {errors.radius_meters && <p className="text-red-500 text-xs mt-1">{errors.radius_meters}</p>}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm flex gap-2">
                  <Info className="w-5 h-5 flex-shrink-0" />
                  <p>
                    Tọa độ và bán kính được sử dụng cho tính năng Geofencing và tìm kiếm địa điểm gần nhất.
                    Nếu không sử dụng, hãy để tọa độ là (0, 0).
                  </p>
                </div>
              </div>
            )}

            {/* EXTENDED INFO TAB (Dynamic Fields & Metadata) */}
            {activeTab === 'extended' && (
              <div className="space-y-6">
                
                {/* Dynamic Fields from Location Type */}
                {selectedType?.extra_fields && selectedType.extra_fields.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700">
                      Thuộc tính mở rộng ({selectedType.name})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedType.extra_fields.map((field) => (
                        <div key={field.code} className="col-span-2 md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {field.name} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {/* Render input based on field type */}
                          {field.type === 'select' ? (
                            <select
                              value={formData.metadata?.[field.code] || ''}
                              onChange={(e) => handleMetadataChange(field.code, e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 ${errors[`field_${field.code}`] ? 'border-red-500' : 'border-gray-300'}`}
                            >
                              <option value="">-- Chọn --</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : field.type === 'boolean' ? (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="checkbox"
                                checked={!!formData.metadata?.[field.code]}
                                onChange={(e) => handleMetadataChange(field.code, e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Yes / No</span>
                            </div>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              value={formData.metadata?.[field.code] || ''}
                              onChange={(e) => handleMetadataChange(field.code, e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:border-gray-700 ${errors[`field_${field.code}`] ? 'border-red-500' : 'border-gray-300'}`}
                              placeholder={field.type === 'text' ? 'Nhập nội dung...' : ''}
                            />
                          )}
                          
                          {errors[`field_${field.code}`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`field_${field.code}`]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Arbitrary Metadata Section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span>Metadata bổ sung</span>
                    <span className="text-xs font-normal text-gray-500">Key-Value Pairs</span>
                  </h3>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Key (e.g. custom_tag)"
                        value={metaKey}
                        onChange={(e) => setMetaKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Value"
                        value={metaValue}
                        onChange={(e) => setMetaValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 text-sm"
                      />
                    </div>
                    <Button type="button" onClick={addArbitraryMetadata} disabled={!metaKey.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Key</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Value</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {Object.entries(formData.metadata || {})
                          // Filter out keys that match defined extra fields to avoid duplication in list if needed
                          // For now, we show everything to be transparent
                          .filter(([key]) => !selectedType?.extra_fields?.some(f => f.code === key))
                          .length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-center text-gray-500">
                              Chưa có metadata bổ sung
                            </td>
                          </tr>
                        ) : (
                          Object.entries(formData.metadata || {})
                             // Filter out keys that match defined extra fields to keep the view clean
                            .filter(([key]) => !selectedType?.extra_fields?.some(f => f.code === key))
                            .map(([key, value]) => (
                            <tr key={key} className="bg-white dark:bg-gray-800">
                              <td className="px-4 py-2 font-mono text-xs">{key}</td>
                              <td className="px-4 py-2">{String(value)}</td>
                              <td className="px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => removeMetadata(key)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Hủy
              </Button>
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Đang lưu...' : (editData ? 'Cập nhật' : 'Thêm mới')}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default LocationModal;
