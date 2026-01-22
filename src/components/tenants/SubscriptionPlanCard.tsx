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