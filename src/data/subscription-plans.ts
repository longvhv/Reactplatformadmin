/**
 * Subscription Plans Data Layer
 * 
 * SaaS subscription tiers and pricing
 */

import { SubscriptionTier } from './tenants';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  limits: {
    maxUsers: number;
    maxStorage: number; // in GB
    maxAPICallsPerMonth: number;
    maxProjects: number;
  };
  features: {
    name: string;
    included: boolean;
    description?: string;
  }[];
  popular?: boolean;
  highlighted?: boolean;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    tier: 'free',
    name: 'Free',
    description: 'Cho cá nhân và dự án nhỏ',
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'USD',
    },
    limits: {
      maxUsers: 3,
      maxStorage: 10,
      maxAPICallsPerMonth: 1000,
      maxProjects: 5,
    },
    features: [
      { name: 'basic_support', included: true, description: 'Email support' },
      { name: 'basic_analytics', included: true, description: 'Basic analytics dashboard' },
      { name: 'api_access', included: false },
      { name: 'custom_branding', included: false },
      { name: 'sso', included: false },
      { name: 'priority_support', included: false },
      { name: 'advanced_analytics', included: false },
      { name: 'custom_domain', included: false },
    ],
  },
  {
    id: 'plan-starter',
    tier: 'starter',
    name: 'Starter',
    description: 'Cho startup và đội nhóm nhỏ',
    price: {
      monthly: 29,
      yearly: 290, // ~16% discount
      currency: 'USD',
    },
    limits: {
      maxUsers: 10,
      maxStorage: 50,
      maxAPICallsPerMonth: 10000,
      maxProjects: 20,
    },
    features: [
      { name: 'basic_support', included: true, description: 'Email support (24h response)' },
      { name: 'basic_analytics', included: true, description: 'Basic analytics dashboard' },
      { name: 'api_access', included: true, description: 'REST API access' },
      { name: 'custom_branding', included: false },
      { name: 'sso', included: false },
      { name: 'priority_support', included: false },
      { name: 'advanced_analytics', included: false },
      { name: 'custom_domain', included: false },
    ],
  },
  {
    id: 'plan-professional',
    tier: 'professional',
    name: 'Professional',
    description: 'Cho doanh nghiệp vừa và nhỏ',
    price: {
      monthly: 99,
      yearly: 990, // ~17% discount
      currency: 'USD',
    },
    limits: {
      maxUsers: 50,
      maxStorage: 200,
      maxAPICallsPerMonth: 100000,
      maxProjects: 100,
    },
    features: [
      { name: 'basic_support', included: true, description: 'Email & chat support' },
      { name: 'basic_analytics', included: true, description: 'Basic analytics dashboard' },
      { name: 'api_access', included: true, description: 'REST API + Webhooks' },
      { name: 'custom_branding', included: true, description: 'Custom logo & colors' },
      { name: 'advanced_analytics', included: true, description: 'Advanced reports & exports' },
      { name: 'sso', included: false },
      { name: 'priority_support', included: false },
      { name: 'custom_domain', included: false },
    ],
    popular: true,
  },
  {
    id: 'plan-enterprise',
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'Cho tổ chức lớn với nhu cầu cao',
    price: {
      monthly: 299,
      yearly: 2990, // ~17% discount
      currency: 'USD',
    },
    limits: {
      maxUsers: 200,
      maxStorage: 1000,
      maxAPICallsPerMonth: 1000000,
      maxProjects: -1, // unlimited
    },
    features: [
      { name: 'basic_support', included: true, description: '24/7 priority support' },
      { name: 'basic_analytics', included: true, description: 'Basic analytics dashboard' },
      { name: 'api_access', included: true, description: 'Full API + Webhooks + GraphQL' },
      { name: 'custom_branding', included: true, description: 'Full white-label' },
      { name: 'advanced_analytics', included: true, description: 'Custom reports & BI integration' },
      { name: 'sso', included: true, description: 'SAML/OAuth SSO' },
      { name: 'priority_support', included: true, description: 'Dedicated account manager' },
      { name: 'custom_domain', included: true, description: 'Custom domain & SSL' },
      { name: 'white_label', included: true, description: 'Complete white-labeling' },
      { name: 'sla', included: true, description: '99.9% uptime SLA' },
    ],
    highlighted: true,
  },
];

export const featureTranslations: Record<string, { vi: string; en: string }> = {
  basic_support: { vi: 'Hỗ trợ cơ bản', en: 'Basic Support' },
  basic_analytics: { vi: 'Phân tích cơ bản', en: 'Basic Analytics' },
  api_access: { vi: 'Truy cập API', en: 'API Access' },
  custom_branding: { vi: 'Tùy chỉnh thương hiệu', en: 'Custom Branding' },
  advanced_analytics: { vi: 'Phân tích nâng cao', en: 'Advanced Analytics' },
  sso: { vi: 'Đăng nhập SSO', en: 'SSO Login' },
  priority_support: { vi: 'Hỗ trợ ưu tiên', en: 'Priority Support' },
  custom_domain: { vi: 'Tên miền riêng', en: 'Custom Domain' },
  white_label: { vi: 'White Label', en: 'White Label' },
  sla: { vi: 'Cam kết SLA', en: 'SLA Guarantee' },
};
