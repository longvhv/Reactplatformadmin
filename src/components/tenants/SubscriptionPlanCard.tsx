/**
 * Subscription Plan Card Component
 * 
 * Displays subscription plan details with pricing
 */

import { Check, X, Zap } from 'lucide-react';
import { SubscriptionPlan, featureTranslations } from '../../data/subscription-plans';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useLanguage } from '../../providers/LanguageProvider';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  onSelect?: (plan: SubscriptionPlan) => void;
  currentPlan?: boolean;
}

export function SubscriptionPlanCard({ 
  plan, 
  billingCycle, 
  onSelect, 
  currentPlan = false 
}: SubscriptionPlanCardProps) {
  const { t, language } = useLanguage();

  const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly / 12;
  const totalPrice = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
  const savings = billingCycle === 'yearly' 
    ? Math.round((1 - plan.price.yearly / (plan.price.monthly * 12)) * 100)
    : 0;

  return (
    <div 
      className={`relative bg-card rounded-xl border ${
        plan.highlighted 
          ? 'border-primary shadow-lg shadow-primary/20 scale-105' 
          : 'border-border/40'
      } p-6 transition-all duration-200 hover:shadow-lg ${
        currentPlan ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white gap-1">
            <Zap className="w-3 h-3" />
            {t('tenants.popular')}
          </Badge>
        </div>
      )}

      {/* Current Plan Badge */}
      {currentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-emerald-500 text-white">
            {t('tenants.currentPlan')}
          </Badge>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              ${price.toFixed(0)}
            </span>
            <span className="text-muted-foreground">/{t('tenants.month')}</span>
          </div>
          {billingCycle === 'yearly' && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {t('tenants.billedYearly')}: ${totalPrice}
              </p>
              {savings > 0 && (
                <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                  {t('tenants.save')} {savings}%
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Limits */}
        <div className="space-y-2 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tenants.maxUsers')}</span>
            <span className="font-semibold">{plan.limits.maxUsers}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tenants.storage')}</span>
            <span className="font-semibold">{plan.limits.maxStorage} GB</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tenants.apiCalls')}</span>
            <span className="font-semibold">
              {plan.limits.maxAPICallsPerMonth.toLocaleString()}/{t('tenants.month')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('tenants.projects')}</span>
            <span className="font-semibold">
              {plan.limits.maxProjects === -1 ? t('common.unlimited') : plan.limits.maxProjects}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 pt-4 border-t border-border/40">
          <p className="font-semibold text-sm">{t('tenants.features')}</p>
          <div className="space-y-2">
            {plan.features.map((feature) => (
              <div key={feature.name} className="flex items-start gap-2">
                {feature.included ? (
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${!feature.included && 'text-muted-foreground line-through'}`}>
                    {featureTranslations[feature.name]?.[language as 'vi' | 'en'] || feature.name}
                  </span>
                  {feature.description && feature.included && (
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        {onSelect && (
          <Button
            className="w-full"
            variant={plan.highlighted ? 'default' : 'outline'}
            onClick={() => onSelect(plan)}
            disabled={currentPlan}
          >
            {currentPlan ? t('tenants.currentPlan') : t('tenants.selectPlan')}
          </Button>
        )}
      </div>
    </div>
  );
}
