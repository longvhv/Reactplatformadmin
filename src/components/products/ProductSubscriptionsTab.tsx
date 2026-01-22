/**
 * ProductSubscriptionsTab - List of subscriptions using this product
 * ✅ Professional UI with dark mode support
 */

import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CreditCard, ExternalLink, Search } from 'lucide-react';
import { useRouter } from '../../components/shim/next-navigation';

interface ProductSubscriptionsTabProps {
  productId: string;
}