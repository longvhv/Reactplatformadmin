/**
 * TenantLocationsTab Component
 * Tab cho tenant detail page - hiển thị location types và locations của tenant
 * 
 * ✅ REWRITTEN 2026-01-14: Use new interfaces with 11+18 fields, manage both types & locations
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  ChevronRight,
  ChevronDown,
  Star,
  Settings,
} from 'lucide-react';
import { useLocationTypes } from '../../hooks/useLocationTypes';
import { useLocations } from '../../hooks/useLocations';
import {
  LocationType,
  ExtraFieldDefinition,
  formatCode,
} from '../../api/locationTypesApi';
import {
  Location,
  LocationStatus,
  LocationWithRelations,
  getStatusColor,
  formatAddress,
  formatCoordinates,
} from '../../api/locationsApi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner@2.0.3';

interface TenantLocationsTabProps {
  tenantId: string;
}

export function TenantLocationsTab({ tenantId }: TenantLocationsTabProps) {
  const [activeTab, setActiveTab] = useState<'types' | 'locations'>('locations');
  
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('locations')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'locations'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
              }
            `}
          >
            <Building2 className="w-5 h-5 inline-block mr-2" />
            Địa điểm
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'types'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
              }
            `}
          >
            <Settings className="w-5 h-5 inline-block mr-2" />
            Loại địa điểm
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'locations' && <LocationsPanel tenantId={tenantId} />}
      {activeTab === 'types' && <LocationTypesPanel tenantId={tenantId} />}
    </div>
  );
}

// ==================== LOCATIONS PANEL ====================

function LocationsPanel({ tenantId }: { tenantId: string }) {
  const {
    locations,
    loading,
    createLocation,
    updateLocation,
    deleteLocation,
    activateLocation,
    deactivateLocation,
    closeLocation,
    setAsHeadquarters,
    buildTree,
    getStats,
  } = useLocations({ tenant_id: tenantId });

  const { locationTypes } = useLocationTypes({ tenant_id: tenantId });

  const [tree, setTree] = useState<LocationWithRelations[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    by_status: { ACTIVE: 0, INACTIVE: 0, CLOSED: 0 },
    headquarters: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const [treeData, statsData] = await Promise.all([
        buildTree(tenantId),
        getStats(),
      ]);
      setTree(treeData);
      setStats(statsData);
    };
    loadData();
  }, [locations]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa điểm này?')) return;
    try {
      await deleteLocation(id);
      toast.success('Đã xóa địa điểm');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleSetHQ = async (id: string) => {
    try {
      await setAsHeadquarters(id);
      toast.success('Đã đặt làm trụ sở chính');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const renderLocationNode = (loc: LocationWithRelations, level: number = 0) => {
    const hasChildren = loc.children && loc.children.length > 0;
    const isExpanded = expandedIds.has(loc._id);
    const type = locationTypes.find(t => t._id === loc.type_id);

    return (
      <div key={loc._id}>
        <div
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          style={{ marginLeft: level > 0 ? `${level * 24}px` : '0' }}
        >
          <div className="w-6 flex-shrink-0">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(loc._id)}
                className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}
          </div>

          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white">{loc.name}</p>
              {loc.code && (
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  ({loc.code})
                </span>
              )}
              {loc.is_headquarter && (
                <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Star className="w-3 h-3 mr-1" />
                  HQ
                </Badge>
              )}
              {type && (
                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {type.name}
                </Badge>
              )}
              <Badge className={getStatusColor(loc.status)}>
                {loc.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
              {loc.address && Object.keys(loc.address).length > 0 && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-xs">{formatAddress(loc.address)}</span>
                </div>
              )}
              {loc.coordinates && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{formatCoordinates(loc.coordinates)}</span>
                </div>
              )}
              {loc.timezone && (
                <div>
                  <span>🌍 {loc.timezone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!loc.is_headquarter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetHQ(loc._id)}
                title="Đặt làm trụ sở chính"
              >
                <Star className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(loc._id)}
              className="text-red-600 hover:text-red-700"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {loc.children!.map((child) => renderLocationNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.by_status.ACTIVE}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {stats.by_status.INACTIVE}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
              <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">HQ</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.headquarters}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Locations Tree */}
      <Card className="p-6">
        {tree.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Chưa có địa điểm nào</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Tạo loại địa điểm trước, sau đó tạo địa điểm
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tree.map((loc) => renderLocationNode(loc))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ==================== LOCATION TYPES PANEL ====================

function LocationTypesPanel({ tenantId }: { tenantId: string }) {
  const {
    locationTypes,
    loading,
    createLocationType,
    updateLocationType,
    deleteLocationType,
    activateLocationType,
    deactivateLocationType,
    getStats,
  } = useLocationTypes({ tenant_id: tenantId });

  const [stats, setStats] = useState({
    total: 0,
    system_types: 0,
    custom_types: 0,
    active: 0,
    with_extra_fields: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const s = await getStats();
      setStats(s);
    };
    loadStats();
  }, [locationTypes]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa loại địa điểm này?')) return;
    try {
      await deleteLocationType(id);
      toast.success('Đã xóa loại địa điểm');
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  const handleToggleActive = async (type: LocationType) => {
    try {
      if (type.is_active) {
        await deactivateLocationType(type._id);
        toast.success('Đã vô hiệu hóa');
      } else {
        await activateLocationType(type._id);
        toast.success('Đã kích hoạt');
      }
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const systemTypes = locationTypes.filter(t => t.is_system);
  const customTypes = locationTypes.filter(t => !t.is_system);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng số</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hệ thống</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.system_types}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tùy chỉnh</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.custom_types}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.active}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Với fields</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.with_extra_fields}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* System Types */}
      {systemTypes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Loại hệ thống
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemTypes.map((type) => (
              <Card key={type._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {type.name}
                      </h4>
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        System
                      </Badge>
                      {!type.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">
                      {type.code}
                    </p>
                    {type.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {type.description}
                      </p>
                    )}
                    {type.extra_fields.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {type.extra_fields.length} trường bổ sung
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Custom Types */}
      {customTypes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Loại tùy chỉnh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTypes.map((type) => (
              <Card key={type._id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {type.name}
                      </h4>
                      {!type.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">
                      {type.code}
                    </p>
                    {type.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {type.description}
                      </p>
                    )}
                    {type.extra_fields.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {type.extra_fields.length} trường bổ sung
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(type)}
                      title={type.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(type._id)}
                      className="text-red-600 hover:text-red-700"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {locationTypes.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">Chưa có loại địa điểm nào</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Loại địa điểm định nghĩa schema cho các địa điểm
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default TenantLocationsTab;