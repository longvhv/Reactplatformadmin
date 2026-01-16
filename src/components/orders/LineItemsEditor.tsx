/**
 * Line Items Editor Component
 * Supports dynamic metadata fields based on item_type and product_type
 * Compatible with new subscription_orders schema
 */

import React, { useState, useEffect } from 'react';
import { LineItem, LineItemType, ProductType, determineOrderType } from '../../api/ordersApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Package, ShoppingBag } from 'lucide-react';
import { servicePackages, type ServicePackage } from '../../api/servicePackages';
import { productsApi, type Product } from '../../api/productsApi';

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
}

export function LineItemsEditor({ items, onChange, disabled, onValidationChange }: LineItemsEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  
  // Fetch service packages and products
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    // Fetch service packages
    servicePackages.getAll()
      .then((data) => {
        setPackages(data);
        setLoadingPackages(false);
      })
      .catch((error) => {
        console.error('Error fetching service packages:', error);
        setLoadingPackages(false);
      });

    // Fetch products
    productsApi.getAll()
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        setLoadingProducts(false);
      });
  }, []);

  // Validate line items
  const validateLineItems = (items: LineItem[]): { isValid: boolean; errors: string[] } => {
    const allErrors: string[] = [];
    const itemErrors: Record<number, string[]> = {};

    items.forEach((item, index) => {
      const errors: string[] = [];

      // Basic validation
      if (!item.name.trim()) {
        errors.push(`Item ${index + 1}: Tên là bắt buộc`);
      }
      if (item.price <= 0) {
        errors.push(`Item ${index + 1}: Giá phải lớn hơn 0`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Số lượng phải lớn hơn 0`);
      }

      // PLAN specific validation
      if (item.item_type === 'PLAN') {
        if (!item.metadata?.cycle) {
          errors.push(`Item ${index + 1}: Chu kỳ là bắt buộc cho PLAN`);
        }
      }

      // PRODUCT specific validation
      if (item.item_type === 'PRODUCT') {
        if (!item.product_type) {
          errors.push(`Item ${index + 1}: Loại sản phẩm là bắt buộc`);
        }

        switch (item.product_type) {
          case 'SSL':
            if (!item.metadata?.domain?.trim()) {
              errors.push(`Item ${index + 1}: Domain là bắt buộc cho SSL`);
            }
            break;
          case 'DOMAIN':
            if (!item.metadata?.domain?.trim()) {
              errors.push(`Item ${index + 1}: Tên miền là bắt buộc`);
            }
            break;
          case 'CONSULTING':
          case 'TRAINING':
            if (!item.metadata?.hours || Number(item.metadata.hours) <= 0) {
              errors.push(`Item ${index + 1}: Số giờ là bắt buộc`);
            }
            break;
        }

        // Additional validation for TRAINING
        if (item.product_type === 'TRAINING') {
          if (!item.metadata?.course?.trim()) {
            errors.push(`Item ${index + 1}: Tên khóa học là bắt buộc`);
          }
        }
      }

      if (errors.length > 0) {
        itemErrors[index] = errors;
        allErrors.push(...errors);
      }
    });

    setValidationErrors(itemErrors);
    const isValid = allErrors.length === 0;
    
    // Notify parent component
    if (onValidationChange) {
      onValidationChange(isValid, allErrors);
    }

    return { isValid, errors: allErrors };
  };

  // Validate on items change
  React.useEffect(() => {
    validateLineItems(items);
  }, [items]);

  const addItem = (itemType: LineItemType) => {
    const newItem: LineItem = {
      item_type: itemType,
      id: '', // Will be filled by user or auto-generated
      name: '',
      price: 0,
      quantity: 1,
      ...(itemType === 'PRODUCT' ? { product_type: 'OTHER' } : {}),
      metadata: {},
    };
    onChange([...items, newItem]);
    setShowAddMenu(false);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'price' || field === 'quantity' ? Number(value) : value,
    };
    onChange(newItems);
  };

  // Helper function to update multiple fields at once
  const updateItemMultiple = (index: number, updates: Partial<LineItem>) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      ...updates,
      // Handle number conversions
      ...(updates.price !== undefined ? { price: Number(updates.price) } : {}),
      ...(updates.quantity !== undefined ? { quantity: Number(updates.quantity) } : {}),
    };
    onChange(newItems);
  };

  const updateMetadata = (index: number, key: string, value: string) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      metadata: {
        ...newItems[index].metadata,
        [key]: value,
      },
    };
    onChange(newItems);
  };

  const deleteMetadata = (index: number, key: string) => {
    const newItems = [...items];
    const { [key]: _, ...restMetadata } = newItems[index].metadata || {};
    newItems[index] = {
      ...newItems[index],
      metadata: restMetadata,
    };
    onChange(newItems);
  };

  const getItemTotal = (item: LineItem) => item.price * item.quantity;
  const getGrandTotal = () => items.reduce((sum, item) => sum + getItemTotal(item), 0);
  const orderType = determineOrderType(items);

  // Helper to render metadata fields based on item_type and product_type
  const renderMetadataFields = (item: LineItem, index: number) => {
    const fields: JSX.Element[] = [];

    // PLAN metadata fields
    if (item.item_type === 'PLAN') {
      fields.push(
        <div key="cycle">
          <Label className="text-xs">Chu kỳ *</Label>
          <select
            value={item.metadata?.cycle || ''}
            onChange={(e) => updateMetadata(index, 'cycle', e.target.value)}
            disabled={disabled}
            className="w-full mt-1 px-3 py-2 border border-input rounded-lg bg-background text-sm"
          >
            <option value="">-- Chọn --</option>
            <option value="MONTHLY">Tháng</option>
            <option value="QUARTERLY">Quý</option>
            <option value="YEARLY">Năm</option>
            <option value="LIFETIME">Trọn đời</option>
          </select>
        </div>
      );

      fields.push(
        <div key="duration">
          <Label className="text-xs">Thời gian (tháng)</Label>
          <Input
            type="number"
            value={item.metadata?.duration || ''}
            onChange={(e) => updateMetadata(index, 'duration', e.target.value)}
            placeholder="12"
            disabled={disabled}
            className="mt-1 text-sm"
          />
        </div>
      );
    }

    // PRODUCT metadata fields based on product_type
    if (item.item_type === 'PRODUCT') {
      switch (item.product_type) {
        case 'SSL':
          fields.push(
            <div key="domain">
              <Label className="text-xs">Domain áp dụng *</Label>
              <Input
                value={item.metadata?.domain || ''}
                onChange={(e) => updateMetadata(index, 'domain', e.target.value)}
                placeholder="*.example.com"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          fields.push(
            <div key="validity">
              <Label className="text-xs">Thời hạn (năm)</Label>
              <Input
                type="number"
                value={item.metadata?.validity || ''}
                onChange={(e) => updateMetadata(index, 'validity', e.target.value)}
                placeholder="1"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          break;

        case 'DOMAIN':
          fields.push(
            <div key="domain">
              <Label className="text-xs">Tên miền *</Label>
              <Input
                value={item.metadata?.domain || ''}
                onChange={(e) => updateMetadata(index, 'domain', e.target.value)}
                placeholder="example.com"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          fields.push(
            <div key="registrar">
              <Label className="text-xs">Nhà đăng ký</Label>
              <Input
                value={item.metadata?.registrar || ''}
                onChange={(e) => updateMetadata(index, 'registrar', e.target.value)}
                placeholder="GoDaddy, Namecheap, etc."
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          break;

        case 'LICENSE':
          fields.push(
            <div key="license_key">
              <Label className="text-xs">Mã license</Label>
              <Input
                value={item.metadata?.license_key || ''}
                onChange={(e) => updateMetadata(index, 'license_key', e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          fields.push(
            <div key="seats">
              <Label className="text-xs">Số lượng user</Label>
              <Input
                type="number"
                value={item.metadata?.seats || ''}
                onChange={(e) => updateMetadata(index, 'seats', e.target.value)}
                placeholder="10"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          break;

        case 'SERVICE':
          fields.push(
            <div key="service_type">
              <Label className="text-xs">Loại dịch vụ</Label>
              <Input
                value={item.metadata?.service_type || ''}
                onChange={(e) => updateMetadata(index, 'service_type', e.target.value)}
                placeholder="Triển khai, Bảo trì, Hỗ trợ..."
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          fields.push(
            <div key="hours">
              <Label className="text-xs">Số giờ</Label>
              <Input
                type="number"
                value={item.metadata?.hours || ''}
                onChange={(e) => updateMetadata(index, 'hours', e.target.value)}
                placeholder="40"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          break;

        case 'CONSULTING':
          fields.push(
            <div key="consultant">
              <Label className="text-xs">Chuyên gia</Label>
              <Input
                value={item.metadata?.consultant || ''}
                onChange={(e) => updateMetadata(index, 'consultant', e.target.value)}
                placeholder="Tên chuyên gia"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          fields.push(
            <div key="hours">
              <Label className="text-xs">Số giờ *</Label>
              <Input
                type="number"
                value={item.metadata?.hours || ''}
                onChange={(e) => updateMetadata(index, 'hours', e.target.value)}
                placeholder="10"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          break;

        case 'TRAINING':
          fields.push(
            <div key="course">
              <Label className="text-xs">Khóa học *</Label>
              <Input
                value={item.metadata?.course || ''}
                onChange={(e) => updateMetadata(index, 'course', e.target.value)}
                placeholder="Tên khóa học"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          fields.push(
            <div key="hours">
              <Label className="text-xs">Số giờ *</Label>
              <Input
                type="number"
                value={item.metadata?.hours || ''}
                onChange={(e) => updateMetadata(index, 'hours', e.target.value)}
                placeholder="20"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          fields.push(
            <div key="participants">
              <Label className="text-xs">Số học viên</Label>
              <Input
                type="number"
                value={item.metadata?.participants || ''}
                onChange={(e) => updateMetadata(index, 'participants', e.target.value)}
                placeholder="15"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          break;

        case 'OTHER':
        default:
          fields.push(
            <div key="description">
              <Label className="text-xs">Mô tả</Label>
              <Input
                value={item.metadata?.description || ''}
                onChange={(e) => updateMetadata(index, 'description', e.target.value)}
                placeholder="Mô tả chi tiết sản phẩm/dịch vụ"
                disabled={disabled}
                className="mt-1 text-sm"
              />
            </div>
          );
          break;
      }

      // Common fields for all PRODUCT types
      fields.push(
        <div key="notes">
          <Label className="text-xs">Ghi chú</Label>
          <Input
            value={item.metadata?.notes || ''}
            onChange={(e) => updateMetadata(index, 'notes', e.target.value)}
            placeholder="Ghi chú thêm"
            disabled={disabled}
            className="mt-1 text-sm"
          />
        </div>
      );
    }

    return fields;
  };

  return (
    <div className="space-y-4">
      {/* Header with Order Type Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Danh sách sản phẩm, dịch vụ</h3>
          {orderType && (
            <Badge 
              variant="outline" 
              className={
                orderType === 'SUBSCRIPTION' ? 'bg-blue-100 text-blue-800' :
                orderType === 'ONE_TIME' ? 'bg-purple-100 text-purple-800' :
                orderType === 'HYBRID' ? 'bg-indigo-100 text-indigo-800' :
                'bg-gray-100 text-gray-800'
              }
            >
              {orderType === 'SUBSCRIPTION' ? 'Gói cước' : 
               orderType === 'ONE_TIME' ? 'Mua lẻ' : 
               orderType === 'HYBRID' ? 'Hỗn hợp' :
               ''}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Tổng: {items.length} items, {items.reduce((sum, item) => sum + item.quantity, 0)} đơn vị
        </div>
      </div>

      {/* Line Items List */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {item.item_type === 'PLAN' ? (
                    <Package className="h-5 w-5 text-blue-600" />
                  ) : (
                    <ShoppingBag className="h-5 w-5 text-purple-600" />
                  )}
                  <CardTitle className="text-base">
                    {item.item_type === 'PLAN' ? 'Gói cước' : 'Sản phẩm'}
                  </CardTitle>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={disabled || items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Type selector (for PRODUCT items only) - MUST be first */}
              {item.item_type === 'PRODUCT' && (
                <div>
                  <Label>Loại sản phẩm *</Label>
                  <select
                    value={item.product_type || 'OTHER'}
                    onChange={(e) => {
                      console.log('🔍 DEBUG: Product type changed to:', e.target.value);
                      const newType = e.target.value as ProductType;
                      // Update all fields at once to avoid race condition
                      updateItemMultiple(index, {
                        product_type: newType,
                        name: '',
                        id: '',
                      });
                    }}
                    required
                    disabled={disabled}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                  >
                    <option value="SSL">Chứng chỉ SSL</option>
                    <option value="DOMAIN">Tên miền</option>
                    <option value="LICENSE">Giấy phép</option>
                    <option value="SERVICE">Dịch vụ</option>
                    <option value="CONSULTING">Tư vấn</option>
                    <option value="TRAINING">Đào tạo</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              )}

              {/* Item Name & ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tên {item.item_type === 'PLAN' ? 'gói' : 'sản phẩm'} *</Label>
                  
                  {item.item_type === 'PLAN' ? (
                    // PLAN: Combobox or readonly if package deleted
                    (() => {
                      const packageExists = packages.find(pkg => pkg._id === item.id || pkg.name === item.name);
                      const isDeleted = item.id && !packageExists;

                      if (isDeleted) {
                        // Package was deleted - show readonly
                        return (
                          <div className="mt-2">
                            <Input
                              value={item.name}
                              disabled
                              className="bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-red-600 mt-1">⚠️ Gói này đã bị xóa</p>
                          </div>
                        );
                      } else {
                        // Package exists or new item - show combobox
                        return (
                          <select
                            value={item.id || ''}
                            onChange={(e) => {
                              console.log('🔍 DEBUG: Package selected:', e.target.value);
                              const selectedPkg = packages.find(pkg => pkg._id === e.target.value);
                              console.log('🔍 DEBUG: Found package:', selectedPkg);
                              if (selectedPkg) {
                                // Update all fields at once to avoid race condition
                                updateItemMultiple(index, {
                                  id: selectedPkg._id,
                                  name: selectedPkg.name,
                                  price: selectedPkg.base_price || 0,
                                });
                              }
                            }}
                            disabled={disabled || loadingPackages}
                            className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                          >
                            <option value="">-- Chọn gói --</option>
                            {packages.map(pkg => (
                              <option key={pkg._id} value={pkg._id}>
                                {pkg.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(pkg.base_price || 0)}
                              </option>
                            ))}
                          </select>
                        );
                      }
                    })()
                  ) : (
                    // PRODUCT: Combobox or readonly if product deleted
                    (() => {
                      // Filter products by product_type
                      const filteredProducts = products.filter(p => p.product_type === item.product_type);
                      const productExists = filteredProducts.find(p => p._id === item.id || p.name === item.name);
                      const isDeleted = item.id && !productExists;

                      if (isDeleted) {
                        // Product was deleted - show readonly
                        return (
                          <div className="mt-2">
                            <Input
                              value={item.name}
                              disabled
                              className="bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-red-600 mt-1">⚠️ Sản phẩm này đã bị xóa</p>
                          </div>
                        );
                      } else {
                        // Product exists or new item - show combobox
                        return (
                          <select
                            value={item.id || ''}
                            onChange={(e) => {
                              console.log('🔍 DEBUG: Product selected:', e.target.value);
                              const selectedProduct = filteredProducts.find(p => p._id === e.target.value);
                              console.log('🔍 DEBUG: Found product:', selectedProduct);
                              console.log('🔍 DEBUG: Filtered products count:', filteredProducts.length);
                              if (selectedProduct) {
                                // Update all fields at once to avoid race condition
                                updateItemMultiple(index, {
                                  id: selectedProduct._id,
                                  name: selectedProduct.name,
                                  price: selectedProduct.base_price || 0,
                                });
                              }
                            }}
                            disabled={disabled || loadingProducts}
                            className="w-full mt-2 px-3 py-2 border border-input rounded-lg bg-background"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {filteredProducts.map(product => (
                              <option key={product._id} value={product._id}>
                                {product.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.base_price || 0)}
                              </option>
                            ))}
                          </select>
                        );
                      }
                    })()
                  )}
                </div>
                <div>
                  <Label>ID (UUID hoặc Code)</Label>
                  <Input
                    value={item.id}
                    onChange={(e) => updateItem(index, 'id', e.target.value)}
                    placeholder="uuid-hoac-code"
                    disabled
                    className="mt-2 bg-gray-50"
                  />
                </div>
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>Giá *</Label>
                  <Input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    min="0"
                    step="1000"
                    required
                    disabled={disabled}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Số lượng *</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    min="1"
                    required
                    disabled={disabled}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Thành tiền</Label>
                  <div className="mt-2 px-3 py-2 bg-muted rounded-lg font-semibold text-sm">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(getItemTotal(item))}
                  </div>
                </div>
              </div>

              {/* Metadata (conditional based on item type) */}
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Metadata (tùy chọn)
                  {item.item_type === 'PLAN' && ' - Chu kỳ bắt buộc'}
                  {item.item_type === 'PRODUCT' && item.product_type === 'SSL' && ' - Domain bắt buộc'}
                  {item.item_type === 'PRODUCT' && item.product_type === 'DOMAIN' && ' - Tên miền bắt buộc'}
                  {item.item_type === 'PRODUCT' && (item.product_type === 'CONSULTING' || item.product_type === 'TRAINING') && ' - Số giờ bắt buộc'}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderMetadataFields(item, index)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item Button */}
      {!disabled && (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm Line Item
          </Button>

          {showAddMenu && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-2 z-10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => addItem('PLAN')}
                className="w-full justify-start mb-1"
              >
                <Package className="h-4 w-4 mr-2 text-blue-600" />
                Thêm Gói cước (PLAN)
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => addItem('PRODUCT')}
                className="w-full justify-start"
              >
                <ShoppingBag className="h-4 w-4 mr-2 text-purple-600" />
                Thêm Sản phẩm (PRODUCT)
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Tổng cộng: {items.length} line items
              </div>
              <div className="text-sm text-muted-foreground">
                Tổng số lượng: {items.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground mb-1">Subtotal</div>
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(getGrandTotal())}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}