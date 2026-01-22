/**
 * ProductMarketingTab - Marketing materials and promotional content
 * ✅ Professional UI with dark mode support
 */

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Megaphone, Upload, Image as ImageIcon, FileText } from 'lucide-react';

interface ProductMarketingTabProps {
  productId: string;
}

export function ProductMarketingTab({ productId }: ProductMarketingTabProps) {
  return (
    <div className="space-y-6">
      {/* Marketing Images */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Marketing Images
            </h3>
          </div>
          <Button size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center"
            >
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          ))}
        </div>
      </Card>

      {/* Product Description */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Marketing Copy
          </h3>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Tagline
            </label>
            <p className="text-base text-gray-900 dark:text-white p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              The best solution for your business needs
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Short Description
            </label>
            <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              A comprehensive platform designed to streamline your workflow and boost productivity.
              Perfect for teams of all sizes.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Full Description
            </label>
            <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg min-h-[120px]">
              Discover the power of our platform with advanced features including real-time collaboration,
              intelligent automation, and comprehensive analytics. Built for modern teams who demand
              excellence and reliability.
            </p>
          </div>
        </div>
      </Card>

      {/* SEO Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          SEO Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Meta Title
            </label>
            <input
              type="text"
              defaultValue="Professional Business Solution"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Meta Description
            </label>
            <textarea
              rows={3}
              defaultValue="Boost your team's productivity with our comprehensive platform"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Keywords
            </label>
            <input
              type="text"
              defaultValue="productivity, collaboration, business, saas"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
