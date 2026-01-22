/**
 * ProductPricingPlansTab - Detailed pricing plans and tiers
 * ✅ Professional UI with dark mode support
 */

import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tag, Plus, Edit, Check } from 'lucide-react';

interface ProductPricingPlansTabProps {
  productId: string;
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: string;
  features: string[];
  is_popular?: boolean;
}

export function ProductPricingPlansTab({ productId }: ProductPricingPlansTabProps) {
  // Mock data - replace with real API call
  const pricingTiers: PricingTier[] = [
    {
      id: '1',
      name: 'Starter',
      price: 49,
      currency: 'USD',
      billing_cycle: 'MONTHLY',
      features: [
        'Up to 10 users',
        '5 GB storage',
        'Email support',
        'Basic analytics',
      ],
    },
    {
      id: '2',
      name: 'Professional',
      price: 149,
      currency: 'USD',
      billing_cycle: 'MONTHLY',
      features: [
        'Up to 50 users',
        '50 GB storage',
        'Priority support',
        'Advanced analytics',
        'API access',
        'Custom integrations',
      ],
      is_popular: true,
    },
    {
      id: '3',
      name: 'Enterprise',
      price: 499,
      currency: 'USD',
      billing_cycle: 'MONTHLY',
      features: [
        'Unlimited users',
        'Unlimited storage',
        '24/7 phone support',
        'Advanced analytics',
        'API access',
        'Custom integrations',
        'SLA guarantee',
        'Dedicated account manager',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pricing Plans
            </h3>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Tier
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-lg border-2 p-6 ${
                tier.is_popular
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {tier.is_popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white">Most Popular</Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {tier.name}
                </h4>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${tier.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{tier.billing_cycle.toLowerCase()}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.is_popular ? 'default' : 'outline'}
                className="w-full"
                size="sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Plan
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Discount Rules */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Discount Rules
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Annual Billing Discount
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Save 20% with annual subscription
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              20% OFF
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Volume Discount
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                10% off for 100+ users
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              10% OFF
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
