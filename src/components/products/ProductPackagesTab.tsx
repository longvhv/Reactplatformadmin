/**
 * ProductPackagesTab - List packages using this product
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductPackagesTabProps {
  productId: string;
}

interface ProductPackage {
  _id: string;
  tenant_id: string;
  package_code: string;
  package_name: string;
  billing_cycle: string;
  price: number;
  is_active: boolean;
  subscribers_count: number;
  created_at: string;
}

export function ProductPackagesTab({ productId }: ProductPackagesTabProps) {
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, [productId]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/products/${productId}/packages`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gói dịch vụ</h2>
          <p className="text-sm text-gray-600 mt-1">
            Các gói sử dụng sản phẩm này
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            {packages.length} gói
          </Badge>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gói dịch vụ</TableHead>
              <TableHead>Chu kỳ thanh toán</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                  Chưa có gói dịch vụ nào
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow key={pkg._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {pkg.package_name}
                        </p>
                        <p className="text-sm text-gray-600 font-mono">
                          {pkg.package_code}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">{pkg.billing_cycle}</Badge>
                  </TableCell>

                  <TableCell>
                    <span className="font-semibold text-gray-900">
                      {pkg.price.toLocaleString('vi-VN')} VND
                    </span>
                  </TableCell>

                  <TableCell>
                    {pkg.is_active ? (
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {pkg.subscribers_count}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(pkg.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <Link to={`/core/packages/${pkg._id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
