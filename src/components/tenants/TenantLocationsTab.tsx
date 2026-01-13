/**
 * TenantLocationsTab Component
 * Displays and manages locations for a specific tenant
 * Used in TenantDetailPage
 */

import { useState, useEffect } from 'react';
import { Plus, MapPin, Building2, Warehouse, Store, Factory, Trash2, Edit, Loader2, X, Save, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Location, CreateLocationInput, UpdateLocationInput, LocationType, LocationStatus } from '@/data/locations';
import { LOCATION_TYPES, LOCATION_STATUSES } from '@/data/locations';
import { projectId, publicAnonKey } from '@/utils/supabase/info';

interface TenantLocationsTabProps {
  tenantId: string;
}

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7eedb4e0/api/core`;

export function TenantLocationsTab({ tenantId }: TenantLocationsTabProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<Partial<CreateLocationInput>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLocations();
  }, [tenantId]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/locations?tenant_id=${tenantId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setLocations(result.data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLocation(null);
    setFormData({ 
      tenant_id: tenantId,
      location_type: 'OFFICE',
      status: 'ACTIVE',
      is_primary: false,
      is_warehouse: false,
      is_retail: false,
    });
    setShowForm(true);
    setErrors({});
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData(location);
    setShowForm(true);
    setErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingLocation(null);
    setFormData({});
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code?.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[a-z0-9-]+$/i.test(formData.code)) {
      newErrors.code = 'Code must contain only letters, numbers, and hyphens';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const url = editingLocation
        ? `${API_BASE_URL}/locations/${editingLocation._id}`
        : `${API_BASE_URL}/locations`;

      const method = editingLocation ? 'PATCH' : 'POST';

      const body = editingLocation
        ? { ...formData, version: editingLocation.version } as UpdateLocationInput
        : { ...formData, tenant_id: tenantId } as CreateLocationInput;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save location');
      }

      await loadLocations();
      handleCancel();
    } catch (error) {
      console.error('Error saving location:', error);
      alert(error instanceof Error ? error.message : 'Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (location: Location) => {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/locations/${location._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }

      await loadLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location');
    }
  };

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'HEADQUARTERS': return Building2;
      case 'WAREHOUSE': return Warehouse;
      case 'RETAIL': return Store;
      case 'FACTORY': return Factory;
      default: return MapPin;
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Locations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage physical locations, branches, and offices
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Search */}
      {!showForm && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </h3>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="HQ-SV, NYC-01"
                className={errors.code ? 'border-red-500' : ''}
              />
              {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code}</p>}
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Silicon Valley Headquarters"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="location_type">Type</Label>
              <select
                id="location_type"
                value={formData.location_type || 'OFFICE'}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value as LocationType })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {LOCATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status || 'ACTIVE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LocationStatus })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {LOCATION_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                value={formData.address_line1 || ''}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            {/* Address Line 2 */}
            <div className="md:col-span-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2 || ''}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                placeholder="Suite 100"
              />
            </div>

            {/* City */}
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco"
              />
            </div>

            {/* State/Province */}
            <div>
              <Label htmlFor="state_province">State/Province</Label>
              <Input
                id="state_province"
                value={formData.state_province || ''}
                onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                placeholder="California"
              />
            </div>

            {/* Postal Code */}
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code || ''}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="94105"
              />
            </div>

            {/* Country */}
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="United States"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="office@company.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this location..."
                rows={3}
              />
            </div>

            {/* Checkboxes */}
            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_primary || false}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">Primary Location</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_warehouse || false}
                  onChange={(e) => setFormData({ ...formData, is_warehouse: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">Warehouse</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_retail || false}
                  onChange={(e) => setFormData({ ...formData, is_retail: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">Retail</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingLocation ? 'Update' : 'Create'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {!showForm && (
        <>
          {filteredLocations.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No locations found matching your search' : 'No locations yet. Add your first location to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map((location) => {
                const Icon = getLocationIcon(location.location_type);
                const statusConfig = LOCATION_STATUSES.find(s => s.value === location.status);

                return (
                  <div
                    key={location._id}
                    className="bg-card border border-border rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{location.name}</h3>
                          <p className="text-sm text-muted-foreground">{location.code}</p>
                        </div>
                      </div>
                      {location.is_primary && (
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded border border-indigo-200">
                          Primary
                        </span>
                      )}
                    </div>

                    {/* Type & Status */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                        {LOCATION_TYPES.find(t => t.value === location.location_type)?.label}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${statusConfig?.color}`}>
                        {statusConfig?.label}
                      </span>
                    </div>

                    {/* Address */}
                    {(location.city || location.country) && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {[location.city, location.state_province, location.country].filter(Boolean).join(', ')}
                      </p>
                    )}

                    {/* Contact */}
                    {location.phone && (
                      <p className="text-sm text-muted-foreground mb-1">{location.phone}</p>
                    )}
                    {location.email && (
                      <p className="text-sm text-muted-foreground mb-3">{location.email}</p>
                    )}

                    {/* Manager */}
                    {location.manager && (
                      <p className="text-sm text-muted-foreground mb-3">
                        Manager: {location.manager.user.name}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(location)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(location)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
