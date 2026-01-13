#!/bin/bash

# Script to fix navigation paths for invoices and subscriptions modules
# Author: AI Assistant
# Date: 2026-01-12

echo "🔧 Fixing navigation paths for invoices and subscriptions..."

# Fix Invoice Paths: /core/invoices -> /core/subscription-invoices
echo "📝 Updating invoice paths..."

# Invoice component files
sed -i "s|'/core/invoices/add'|'/core/subscription-invoices/add'|g" components/invoices/InvoiceCard.tsx
sed -i "s|'/core/invoices/edit/|'/core/subscription-invoices/edit/|g" components/invoices/InvoiceCard.tsx
sed -i "s|'/core/invoices/\${invoice._id}|'/core/subscription-invoices/\${invoice._id}|g" components/invoices/InvoiceCard.tsx
sed -i "s|\`/core/invoices/\${invoice._id}\`|\`/core/subscription-invoices/\${invoice._id}\`|g" components/invoices/InvoiceCard.tsx
sed -i "s|\`/core/invoices/edit/\${invoice._id}\`|\`/core/subscription-invoices/edit/\${invoice._id}\`|g" components/invoices/InvoiceCard.tsx

# Invoice page files
sed -i "s|'/core/invoices'|'/core/subscription-invoices'|g" pages/InvoiceDetailPage.tsx
sed -i "s|\`/core/invoices/edit/\${invoice._id}\`|\`/core/subscription-invoices/edit/\${invoice._id}\`|g" pages/InvoiceDetailPage.tsx
sed -i "s|\`/core/invoices/\${invoice._id}\`|\`/core/subscription-invoices/\${invoice._id}\`|g" pages/InvoiceDetailPage.tsx

sed -i "s|'/core/invoices'|'/core/subscription-invoices'|g" pages/AddInvoicePage.tsx

sed -i "s|'/core/invoices'|'/core/subscription-invoices'|g" pages/EditInvoicePage.tsx
sed -i "s|\`/core/invoices/\${id}\`|\`/core/subscription-invoices/\${id}\`|g" pages/EditInvoicePage.tsx

# Fix Subscription Paths: /core/subscriptions -> /core/tenant-subscriptions
echo "📝 Updating subscription paths..."

# Subscription component files
sed -i "s|'/core/subscriptions/add'|'/core/tenant-subscriptions/add'|g" components/subscriptions/SubscriptionTable.tsx
sed -i "s|'/core/subscriptions/edit/|'/core/tenant-subscriptions/edit/|g" components/subscriptions/SubscriptionTable.tsx
sed -i "s|\`/core/subscriptions/\${subscription._id}\`|\`/core/tenant-subscriptions/\${subscription._id}\`|g" components/subscriptions/SubscriptionTable.tsx
sed -i "s|\`/core/subscriptions/edit/\${subscription._id}\`|\`/core/tenant-subscriptions/edit/\${subscription._id}\`|g" components/subscriptions/SubscriptionTable.tsx

sed -i "s|'/core/subscriptions/add'|'/core/tenant-subscriptions/add'|g" components/subscriptions/SubscriptionCard.tsx
sed -i "s|'/core/subscriptions/edit/|'/core/tenant-subscriptions/edit/|g" components/subscriptions/SubscriptionCard.tsx
sed -i "s|\`/core/subscriptions/\${subscription._id}\`|\`/core/tenant-subscriptions/\${subscription._id}\`|g" components/subscriptions/SubscriptionCard.tsx
sed -i "s|\`/core/subscriptions/edit/\${subscription._id}\`|\`/core/tenant-subscriptions/edit/\${subscription._id}\`|g" components/subscriptions/SubscriptionCard.tsx

# Subscription page files
sed -i "s|'/core/subscriptions/add'|'/core/tenant-subscriptions/add'|g" pages/TenantSubscriptionsPage.tsx

sed -i "s|'/core/subscriptions'|'/core/tenant-subscriptions'|g" pages/AddSubscriptionPage.tsx

sed -i "s|'/core/subscriptions'|'/core/tenant-subscriptions'|g" pages/EditSubscriptionPage.tsx

sed -i "s|'/core/subscriptions'|'/core/tenant-subscriptions'|g" pages/SubscriptionDetailPage.tsx
sed -i "s|\`/core/subscriptions/edit/\${subscription._id}\`|\`/core/tenant-subscriptions/edit/\${subscription._id}\`|g" pages/SubscriptionDetailPage.tsx

echo "✅ All navigation paths have been updated!"
echo ""
echo "Summary:"
echo "  - Invoice paths: /core/invoices → /core/subscription-invoices"
echo "  - Subscription paths: /core/subscriptions → /core/tenant-subscriptions"
echo ""
echo "🎉 Done! Please test the navigation in the app."
