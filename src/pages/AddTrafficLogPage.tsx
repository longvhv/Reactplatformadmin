/**
 * Add Traffic Log Page
 * Create a new traffic log entry (typically for testing/debugging)
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createTrafficLog, TrafficLogCreateData } from '../api/trafficLogsApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner@2.0.3';

export default function AddTrafficLogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TrafficLogCreateData>({
    method: 'GET',
    status_code: 200,
    latency_ms: 0,
    request_size: 0,
    response_size: 0,
    data_region: 'ap-southeast-1',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      await createTrafficLog(formData);
      toast.success(t('trafficLogs.createSuccess'));
      navigate('/core/traffic-logs');
    } catch (error) {
      console.error('Error creating traffic log:', error);
      toast.error(t('trafficLogs.createError'));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof TrafficLogCreateData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/core/traffic-logs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('trafficLogs.addLog')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('trafficLogs.addLogDescription')}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              {t('trafficLogs.requestInfo')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.method')} *
                </label>
                <Select
                  value={formData.method || 'GET'}
                  onValueChange={(value) => handleInputChange('method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="HEAD">HEAD</SelectItem>
                    <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.status')} *
                </label>
                <Input
                  type="number"
                  value={formData.status_code || ''}
                  onChange={(e) => handleInputChange('status_code', parseInt(e.target.value))}
                  placeholder="200"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.path')}
                </label>
                <Input
                  value={formData.path || ''}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  placeholder="/api/v1/users"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.domain')}
                </label>
                <Input
                  value={formData.domain || ''}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="api.example.com"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              {t('trafficLogs.performance')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.latency')} (ms)
                </label>
                <Input
                  type="number"
                  value={formData.latency_ms || ''}
                  onChange={(e) => handleInputChange('latency_ms', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.requestSize')} (bytes)
                </label>
                <Input
                  type="number"
                  value={formData.request_size || ''}
                  onChange={(e) => handleInputChange('request_size', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.responseSize')} (bytes)
                </label>
                <Input
                  type="number"
                  value={formData.response_size || ''}
                  onChange={(e) => handleInputChange('response_size', parseInt(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
              {t('trafficLogs.metadata')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.appCode')}
                </label>
                <Input
                  value={formData.app_code || ''}
                  onChange={(e) => handleInputChange('app_code', e.target.value)}
                  placeholder="web-app"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.dataRegion')}
                </label>
                <Input
                  value={formData.data_region || ''}
                  onChange={(e) => handleInputChange('data_region', e.target.value)}
                  placeholder="ap-southeast-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.ipAddress')}
                </label>
                <Input
                  value={formData.ip_address || ''}
                  onChange={(e) => handleInputChange('ip_address', e.target.value)}
                  placeholder="192.168.1.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.userId')}
                </label>
                <Input
                  value={formData.user_id || ''}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  placeholder="UUID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.tenantId')}
                </label>
                <Input
                  value={formData.tenant_id || ''}
                  onChange={(e) => handleInputChange('tenant_id', e.target.value)}
                  placeholder="UUID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {t('trafficLogs.userAgent')}
                </label>
                <Input
                  value={formData.user_agent || ''}
                  onChange={(e) => handleInputChange('user_agent', e.target.value)}
                  placeholder="Mozilla/5.0..."
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/core/traffic-logs')}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
