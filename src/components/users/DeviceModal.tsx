/**
 * DeviceModal Component
 * Modal for creating/editing user devices
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { UserDevice, CreateDeviceData, UpdateDeviceData, DeviceType, DeviceOS, DeviceBrowser } from '../../api/userDevicesApi';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateDeviceData | UpdateDeviceData) => Promise<void>;
  device?: UserDevice | null;
  userId?: string; // For create mode
}

export function DeviceModal({ isOpen, onClose, onSave, device, userId }: DeviceModalProps) {
  const [formData, setFormData] = useState<Partial<CreateDeviceData>>({
    user_id: userId || '',
    device_type: 'desktop',
    device_name: '',
    device_model: '',
    manufacturer: '',
    os: 'windows',
    os_version: '',
    browser: 'chrome',
    browser_version: '',
    app_name: '',
    app_version: '',
    ip_address: '',
    is_trusted: false,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (device) {
      setFormData({
        user_id: device.user_id,
        device_type: device.device_type,
        device_name: device.device_name,
        device_model: device.device_model,
        manufacturer: device.manufacturer,
        os: device.os,
        os_version: device.os_version,
        browser: device.browser,
        browser_version: device.browser_version,
        app_name: device.app_name,
        app_version: device.app_version,
        ip_address: device.ip_address,
        is_trusted: device.is_trusted,
      });
    } else {
      setFormData({
        user_id: userId || '',
        device_type: 'desktop',
        device_name: '',
        device_model: '',
        manufacturer: '',
        os: 'windows',
        os_version: '',
        browser: 'chrome',
        browser_version: '',
        app_name: '',
        app_version: '',
        ip_address: '',
        is_trusted: false,
      });
    }
  }, [device, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData as CreateDeviceData);
      onClose();
    } catch (err) {
      console.error('Error saving device:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const deviceTypes: { value: DeviceType; label: string }[] = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'watch', label: 'Watch' },
    { value: 'tv', label: 'TV' },
    { value: 'other', label: 'Other' },
  ];

  const osTypes: { value: DeviceOS; label: string }[] = [
    { value: 'windows', label: 'Windows' },
    { value: 'macos', label: 'macOS' },
    { value: 'linux', label: 'Linux' },
    { value: 'ios', label: 'iOS' },
    { value: 'android', label: 'Android' },
    { value: 'chromeos', label: 'Chrome OS' },
    { value: 'other', label: 'Other' },
  ];

  const browsers: { value: DeviceBrowser; label: string }[] = [
    { value: 'chrome', label: 'Chrome' },
    { value: 'firefox', label: 'Firefox' },
    { value: 'safari', label: 'Safari' },
    { value: 'edge', label: 'Edge' },
    { value: 'opera', label: 'Opera' },
    { value: 'brave', label: 'Brave' },
    { value: 'samsung', label: 'Samsung Internet' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {device ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Device Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại thiết bị *
              </label>
              <select
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value as DeviceType })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {deviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên thiết bị
              </label>
              <input
                type="text"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                placeholder="iPhone 15 Pro, MacBook Pro..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Device Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                value={formData.device_model}
                onChange={(e) => setFormData({ ...formData, device_model: e.target.value })}
                placeholder="iPhone15,2, MacBookPro18,1..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhà sản xuất
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                placeholder="Apple, Samsung, Dell..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* OS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hệ điều hành
              </label>
              <select
                value={formData.os}
                onChange={(e) => setFormData({ ...formData, os: e.target.value as DeviceOS })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {osTypes.map(os => (
                  <option key={os.value} value={os.value}>
                    {os.label}
                  </option>
                ))}
              </select>
            </div>

            {/* OS Version */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phiên bản OS
              </label>
              <input
                type="text"
                value={formData.os_version}
                onChange={(e) => setFormData({ ...formData, os_version: e.target.value })}
                placeholder="14.2, 17.0, 11.0..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Browser */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trình duyệt
              </label>
              <select
                value={formData.browser}
                onChange={(e) => setFormData({ ...formData, browser: e.target.value as DeviceBrowser })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {browsers.map(browser => (
                  <option key={browser.value} value={browser.value}>
                    {browser.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Browser Version */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phiên bản trình duyệt
              </label>
              <input
                type="text"
                value={formData.browser_version}
                onChange={(e) => setFormData({ ...formData, browser_version: e.target.value })}
                placeholder="120.0.6099.109..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Mobile App Info */}
          {(formData.device_type === 'mobile' || formData.device_type === 'tablet') && (
            <div className="grid grid-cols-2 gap-4">
              {/* App Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên ứng dụng
                </label>
                <input
                  type="text"
                  value={formData.app_name}
                  onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
                  placeholder="VHP Mobile App"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* App Version */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phiên bản ứng dụng
                </label>
                <input
                  type="text"
                  value={formData.app_version}
                  onChange={(e) => setFormData({ ...formData, app_version: e.target.value })}
                  placeholder="2.5.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* IP Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ IP
            </label>
            <input
              type="text"
              value={formData.ip_address}
              onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              placeholder="192.168.1.100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Is Trusted */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_trusted}
              onChange={(e) => setFormData({ ...formData, is_trusted: e.target.checked })}
              id="is_trusted"
              className="rounded"
            />
            <label htmlFor="is_trusted" className="text-sm text-gray-700">
              Thiết bị tin cậy
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : device ? 'Cập nhật' : 'Tạo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceModal;
