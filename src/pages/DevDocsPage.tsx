/**
 * Developer Documentation Page
 * 
 * Unified documentation for API and Database
 * Features:
 * - 4 tabs: API, Bảng dữ liệu, Sơ đồ ERD, Usecases
 * - Search and filter functionality
 * - i18n support
 * - Download usecase documents
 */

import { useState, useMemo } from 'react';
import { Search, BookOpen, Database, GitBranch, Filter, FileText, Download, Code, ExternalLink, FolderOpen } from 'lucide-react';
import { useLanguage } from '../providers/LanguageProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ApiEndpoint } from '../components/api/ApiEndpoint';
import { DatabaseTable } from '../components/database/DatabaseTable';
import { ERDiagram } from '../components/database/ERDiagram';
import { UsecaseCard } from '../components/usecases/UsecaseCard';
import { SeedDataButton } from '../components/SeedDataButton';
import { openApiSpec } from '../data/openapi';
import { databaseSchema, erdDiagram } from '../data/database-schema';
import { usecases, usecaseCategories, Usecase } from '../data/usecases';
import { generateAllUsecasesDocx } from '../utils/usecaseDocGenerator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export function DevDocsPage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedApiCategory, setSelectedApiCategory] = useState<string | null>(null);
  const [selectedTableType, setSelectedTableType] = useState<string | null>(null); // New state for table type filter

  // === API DOCS DATA ===
  const apiDocs = [
    // Core APIs
    { 
      category: 'Core',
      title: 'Tenants API',
      description: 'Complete API documentation for tenant management',
      path: '/docs/api/tenants-api.md',
      tags: ['Tenants', 'Multi-tenancy']
    },
    { 
      category: 'Core',
      title: 'Tenant Details API',
      description: 'Detailed API for tenant operations and management',
      path: '/docs/api/tenant-details-api.md',
      tags: ['Tenants', 'Details']
    },
    { 
      category: 'Core',
      title: 'Tenant App Routes API',
      description: 'Tenant application routing configuration',
      path: '/docs/TENANT_APP_ROUTES_IMPLEMENTATION.md',
      tags: ['Tenants', 'Routing']
    },
    { 
      category: 'Core',
      title: 'Users API',
      description: 'Complete user management API documentation',
      path: '/docs/api/users-api-complete.md',
      tags: ['Users', 'Authentication']
    },
    { 
      category: 'Core',
      title: 'Users Module API',
      description: 'Complete users module with full CRUD operations',
      path: '/docs/USERS_MODULE_FINAL_DELIVERY.md',
      tags: ['Users', 'Module']
    },
    { 
      category: 'Core',
      title: 'Applications API',
      description: 'Application management and configuration API',
      path: '/docs/api/APPLICATIONS_API.md',
      tags: ['Applications', 'Configuration']
    },
    { 
      category: 'Core',
      title: 'Applications Module',
      description: 'Complete applications module documentation',
      path: '/docs/APPLICATIONS_COMPLETE_PACKAGE.md',
      tags: ['Applications', 'Module']
    },
    { 
      category: 'Core',
      title: 'Announcements API',
      description: 'System announcements and notifications API',
      path: '/docs/api/ANNOUNCEMENTS_API.md',
      tags: ['Announcements', 'Notifications']
    },
    { 
      category: 'Core',
      title: 'Announcements Module',
      description: 'Complete announcements module with delivery tracking',
      path: '/docs/ANNOUNCEMENTS_MODULE_COMPLETE_DELIVERY.md',
      tags: ['Announcements', 'Module']
    },
    { 
      category: 'Core',
      title: 'Roles Module API',
      description: 'Role-based access control and permissions',
      path: '/docs/ROLES_MODULE_COMPLETE_DELIVERY.md',
      tags: ['Roles', 'RBAC']
    },
    { 
      category: 'Core',
      title: 'Dashboard API',
      description: 'Dashboard data and analytics API',
      path: '/api/dashboardApi.ts',
      tags: ['Dashboard', 'Analytics']
    },
    { 
      category: 'Core',
      title: 'Departments API',
      description: 'Department management and organization structure',
      path: '/api/departmentsApi.ts',
      tags: ['Departments', 'Organization']
    },
    { 
      category: 'Core',
      title: 'User Groups API',
      description: 'User group management and permissions',
      path: '/api/userGroupsApi.ts',
      tags: ['Groups', 'Users']
    },
    { 
      category: 'Core',
      title: 'App Capability API',
      description: 'Application capability and feature flags management',
      path: '/api/appCapabilityApi.ts',
      tags: ['Capabilities', 'Features']
    },
    { 
      category: 'Core',
      title: 'SaaS Product API',
      description: 'SaaS product catalog and management',
      path: '/api/saasProductApi.ts',
      tags: ['Products', 'SaaS']
    },
    { 
      category: 'Core',
      title: 'System Categories API',
      description: 'Hierarchical system categories management',
      path: '/api/systemCategoryApi.ts',
      tags: ['Categories', 'Taxonomy']
    },
    { 
      category: 'Core',
      title: 'Notification Templates API',
      description: 'Notification template management and customization',
      path: '/api/notificationTemplateApi.ts',
      tags: ['Notifications', 'Templates']
    },
    
    // Platform APIs
    { 
      category: 'Platform',
      title: 'Tenant Rate Limits API',
      description: 'API rate limiting configuration and management',
      path: '/docs/api/TENANT_RATE_LIMITS_API.md',
      tags: ['Rate Limits', 'Platform']
    },
    { 
      category: 'Platform',
      title: 'Tenant Rate Limits Implementation',
      description: 'Complete implementation guide for rate limiting',
      path: '/docs/TENANT_RATE_LIMITS_IMPLEMENTATION.md',
      tags: ['Rate Limits', 'Implementation']
    },
    { 
      category: 'Platform',
      title: 'Tenant Members API',
      description: 'Tenant membership and access management',
      path: '/docs/TENANT_MEMBERS_API.md',
      tags: ['Members', 'Access Control']
    },
    { 
      category: 'Platform',
      title: 'Webhooks API',
      description: 'Webhook integration and event management',
      path: '/docs/WEBHOOKS_API.md',
      tags: ['Webhooks', 'Integration']
    },
    { 
      category: 'Platform',
      title: 'Webhooks Implementation',
      description: 'Complete webhooks implementation guide',
      path: '/docs/WEBHOOKS_IMPLEMENTATION.md',
      tags: ['Webhooks', 'Events']
    },
    { 
      category: 'Platform',
      title: 'User Roles API',
      description: 'User role assignment and permission management',
      path: '/docs/USER_ROLES_IMPLEMENTATION.md',
      tags: ['Roles', 'Permissions']
    },
    { 
      category: 'Platform',
      title: 'User Sessions API',
      description: 'User session tracking and management',
      path: '/docs/USER_SESSIONS_IMPLEMENTATION.md',
      tags: ['Sessions', 'Security']
    },
    { 
      category: 'Platform',
      title: 'User Devices API',
      description: 'User device registration and management',
      path: '/docs/USER_DEVICES_IMPLEMENTATION.md',
      tags: ['Devices', 'Security']
    },
    { 
      category: 'Platform',
      title: 'User Delegations API',
      description: 'User delegation and proxy access management',
      path: '/docs/USER_DELEGATIONS_IMPLEMENTATION.md',
      tags: ['Delegations', 'Access Control']
    },
    { 
      category: 'Platform',
      title: 'User Consents API',
      description: 'User consent and privacy preference management',
      path: '/docs/USER_CONSENTS_IMPLEMENTATION.md',
      tags: ['Consents', 'Privacy']
    },
    { 
      category: 'Platform',
      title: 'Auth Logs API',
      description: 'Authentication event logging and monitoring',
      path: '/docs/AUTH_LOGS_IMPLEMENTATION.md',
      tags: ['Auth', 'Logging']
    },
    { 
      category: 'Platform',
      title: 'Legal Documents API',
      description: 'Legal document management and versioning',
      path: '/docs/LEGAL_DOCUMENTS_IMPLEMENTATION.md',
      tags: ['Legal', 'Compliance']
    },
    { 
      category: 'Platform',
      title: 'Tenant SSO Configs API',
      description: 'Single sign-on configuration management',
      path: '/api/tenantSSOConfigsApi.ts',
      tags: ['SSO', 'Authentication']
    },
    { 
      category: 'Platform',
      title: 'Tenant App Routes Resolver API',
      description: 'Dynamic route resolution for tenant applications',
      path: '/api/tenantAppRoutesResolverApi.ts',
      tags: ['Routing', 'Tenants']
    },
    { 
      category: 'Platform',
      title: 'Locations API',
      description: 'Location and address management',
      path: '/api/locationsApi.ts',
      tags: ['Locations', 'Geography']
    },
    { 
      category: 'Platform',
      title: 'Location Types API',
      description: 'Location type categorization and management',
      path: '/api/locationTypesApi.ts',
      tags: ['Locations', 'Types']
    },
    { 
      category: 'Platform',
      title: 'Regions API',
      description: 'Geographic regions and data center management',
      path: '/api/regionsApi.ts',
      tags: ['Regions', 'Geography']
    },
    
    // Commerce APIs
    { 
      category: 'Commerce',
      title: 'Products API',
      description: 'Product catalog and management API',
      path: '/docs/PRODUCTS_API.md',
      tags: ['Products', 'Commerce']
    },
    { 
      category: 'Commerce',
      title: 'Products Module',
      description: 'Complete products module with variants and pricing',
      path: '/docs/PRODUCTS_MODULE_FINAL_DELIVERY.md',
      tags: ['Products', 'Module']
    },
    { 
      category: 'Commerce',
      title: 'Packages API',
      description: 'Service packages and offerings API',
      path: '/docs/PACKAGES_API.md',
      tags: ['Packages', 'Services']
    },
    { 
      category: 'Commerce',
      title: 'Packages Module',
      description: 'Complete packages module with pricing tiers',
      path: '/docs/PACKAGES_MODULE_FINAL_DELIVERY.md',
      tags: ['Packages', 'Module']
    },
    { 
      category: 'Commerce',
      title: 'Orders API',
      description: 'Order processing and management API',
      path: '/docs/ORDERS_API.md',
      tags: ['Orders', 'Commerce']
    },
    { 
      category: 'Commerce',
      title: 'Orders Module',
      description: 'Complete orders module with order lifecycle',
      path: '/docs/ORDERS_MODULE_FINAL_DELIVERY.md',
      tags: ['Orders', 'Module']
    },
    { 
      category: 'Commerce',
      title: 'Invoices API',
      description: 'Invoice generation and billing API',
      path: '/docs/INVOICES_API.md',
      tags: ['Invoices', 'Billing']
    },
    { 
      category: 'Commerce',
      title: 'Invoices Module',
      description: 'Complete invoices module with payment tracking',
      path: '/docs/INVOICES_MODULE_100_COMPLETE.md',
      tags: ['Invoices', 'Module']
    },
    { 
      category: 'Commerce',
      title: 'Subscriptions API',
      description: 'Subscription management and billing cycles',
      path: '/docs/SUBSCRIPTIONS_COMPLETE_DELIVERY.md',
      tags: ['Subscriptions', 'Recurring Billing']
    },
    { 
      category: 'Commerce',
      title: 'Subscriptions Module',
      description: 'Complete subscriptions module with auto-renewal',
      path: '/docs/SUBSCRIPTIONS_MODULE_FINAL_DELIVERY.md',
      tags: ['Subscriptions', 'Module']
    },
    { 
      category: 'Commerce',
      title: 'Subscription Orders API',
      description: 'Subscription order processing and tracking',
      path: '/docs/SUBSCRIPTION_ORDERS_MODULE_100_COMPLETE.md',
      tags: ['Subscriptions', 'Orders']
    },
    { 
      category: 'Commerce',
      title: 'Subscription Orders Module',
      description: 'Complete subscription orders module',
      path: '/docs/SUBSCRIPTION_ORDERS_MODULE_FINAL_DELIVERY.md',
      tags: ['Subscriptions', 'Module']
    },
    { 
      category: 'Commerce',
      title: 'Subscription Invoices API',
      description: 'Subscription invoice generation and management',
      path: '/docs/SUBSCRIPTION_INVOICES_MODULE_FINAL_DELIVERY.md',
      tags: ['Subscriptions', 'Invoices']
    },
    
    // Monitoring & Security APIs
    { 
      category: 'Monitoring',
      title: 'Audit Logs API',
      description: 'Security audit trail and logging API',
      path: '/docs/AUDIT_LOGS_API.md',
      tags: ['Audit', 'Security']
    },
    { 
      category: 'Monitoring',
      title: 'Audit Logs Schema',
      description: 'Database schema for audit logging',
      path: '/docs/AUDIT_LOGS_SCHEMA.md',
      tags: ['Audit', 'Database']
    },
    { 
      category: 'Monitoring',
      title: 'Audit Logs Use Cases',
      description: 'Use cases and examples for audit logging',
      path: '/docs/AUDIT_LOGS_USECASES.md',
      tags: ['Audit', 'Use Cases']
    },
    
    // Database & Architecture
    { 
      category: 'Database',
      title: 'Database Schema Complete',
      description: 'Complete database schema documentation',
      path: '/docs/DATABASE_SCHEMA_COMPLETE.md',
      tags: ['Database', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Database Documentation API',
      description: 'API for accessing database documentation',
      path: '/docs/DATABASE_DOCS_API.md',
      tags: ['Database', 'API']
    },
    { 
      category: 'Database',
      title: 'System Categories Schema',
      description: 'Hierarchical category system schema',
      path: '/docs/SYSTEM_CATEGORIES_SCHEMA.md',
      tags: ['Database', 'Categories']
    },
    { 
      category: 'Database',
      title: 'Regions Table Guide',
      description: 'Geographic regions configuration',
      path: '/docs/REGIONS_TABLE_GUIDE.md',
      tags: ['Database', 'Regions']
    },
    
    // Golang Integration
    { 
      category: 'Integration',
      title: 'Golang Endpoints',
      description: 'Golang backend API endpoints documentation',
      path: '/docs/GOLANG_ENDPOINTS.md',
      tags: ['Golang', 'Backend']
    },
    { 
      category: 'Integration',
      title: 'Golang Migration Guide',
      description: 'Guide for migrating to Golang backend',
      path: '/docs/GOLANG_MIGRATION_READY.md',
      tags: ['Golang', 'Migration']
    },
    { 
      category: 'Integration',
      title: 'Golang Implementation Checklist',
      description: 'Implementation checklist for Golang services',
      path: '/docs/GOLANG_IMPLEMENTATION_CHECKLIST.md',
      tags: ['Golang', 'Checklist']
    },
    { 
      category: 'Integration',
      title: 'Golang User Management',
      description: 'User management in Golang backend',
      path: '/docs/GOLANG_USER_MANAGEMENT.md',
      tags: ['Golang', 'Users']
    },
    
    // Developer Guides
    { 
      category: 'Developer Guides',
      title: 'Tenant Management Developer Guide',
      description: 'Complete guide for tenant management development',
      path: '/docs/DEVELOPER_GUIDE_TENANTS.md',
      tags: ['Tenants', 'Guide']
    },
    { 
      category: 'Developer Guides',
      title: 'Announcements Developer Guide',
      description: 'Complete developer guide for announcements system',
      path: '/docs/ANNOUNCEMENTS_DEVELOPER_GUIDE.md',
      tags: ['Announcements', 'Guide']
    },
    { 
      category: 'Developer Guides',
      title: 'Applications Developer Guide',
      description: 'Developer guide for applications module',
      path: '/docs/APPLICATIONS_DEVELOPER_GUIDE.md',
      tags: ['Applications', 'Guide']
    },
    { 
      category: 'Developer Guides',
      title: 'Subscriptions Developer Documentation',
      description: 'Complete developer documentation for subscriptions',
      path: '/docs/developer/SUBSCRIPTIONS_DEVELOPER_DOCUMENTATION.md',
      tags: ['Subscriptions', 'Documentation']
    },
    { 
      category: 'Developer Guides',
      title: 'Products Detail Complete Guide',
      description: 'Complete implementation guide for product details',
      path: '/docs/developer/products-detail-complete.md',
      tags: ['Products', 'Guide']
    },
    { 
      category: 'Developer Guides',
      title: 'Service Packages Popup Complete',
      description: 'Complete guide for service packages popup implementation',
      path: '/docs/developer/SERVICE_PACKAGES_POPUP_COMPLETE.md',
      tags: ['Packages', 'UI']
    },
    
    // README & Package Documentation
    { 
      category: 'Developer Guides',
      title: 'Products README',
      description: 'Products module overview and quick start',
      path: '/docs/PRODUCTS_README.md',
      tags: ['Products', 'README']
    },
    { 
      category: 'Developer Guides',
      title: 'Packages README',
      description: 'Packages module overview and quick start',
      path: '/docs/PACKAGES_README.md',
      tags: ['Packages', 'README']
    },
    { 
      category: 'Developer Guides',
      title: 'Orders README',
      description: 'Orders module overview and quick start',
      path: '/docs/ORDERS_README.md',
      tags: ['Orders', 'README']
    },
    { 
      category: 'Developer Guides',
      title: 'Invoices README',
      description: 'Invoices module overview and quick start',
      path: '/docs/INVOICES_README.md',
      tags: ['Invoices', 'README']
    },
    { 
      category: 'Developer Guides',
      title: 'Webhooks README',
      description: 'Webhooks module overview and quick start',
      path: '/docs/WEBHOOKS_README.md',
      tags: ['Webhooks', 'README']
    },
    { 
      category: 'Developer Guides',
      title: 'Subscription Orders README',
      description: 'Subscription orders module overview',
      path: '/docs/developer/README_SUBSCRIPTION_ORDERS.md',
      tags: ['Subscriptions', 'README']
    },
    { 
      category: 'Developer Guides',
      title: 'Subscription Invoices README',
      description: 'Subscription invoices module overview',
      path: '/docs/developer/README_SUBSCRIPTION_INVOICES.md',
      tags: ['Subscriptions', 'README']
    },
    
    // Complete Packages & Deliverables
    { 
      category: 'Developer Guides',
      title: 'Announcements Complete Package',
      description: 'Complete delivery package for announcements module',
      path: '/docs/ANNOUNCEMENTS_COMPLETE_PACKAGE.md',
      tags: ['Announcements', 'Package']
    },
    { 
      category: 'Developer Guides',
      title: 'Applications Complete Package',
      description: 'Complete delivery package for applications module',
      path: '/docs/APPLICATIONS_COMPLETE_PACKAGE.md',
      tags: ['Applications', 'Package']
    },
    { 
      category: 'Developer Guides',
      title: 'Products Complete Package',
      description: 'Complete delivery package for products module',
      path: '/docs/PRODUCTS_MODULE_COMPLETE_PACKAGE.md',
      tags: ['Products', 'Package']
    },
    { 
      category: 'Developer Guides',
      title: 'Orders Deliverables',
      description: 'Complete deliverables documentation for orders',
      path: '/docs/ORDERS_DELIVERABLES.md',
      tags: ['Orders', 'Deliverables']
    },
    { 
      category: 'Developer Guides',
      title: 'Orders Module Complete Delivery',
      description: 'Complete delivery report for orders module',
      path: '/docs/ORDERS_MODULE_COMPLETE_DELIVERY.md',
      tags: ['Orders', 'Delivery']
    },
    { 
      category: 'Developer Guides',
      title: 'Subscription Orders Complete Package',
      description: 'Complete package for subscription orders',
      path: '/docs/developer/SUBSCRIPTION_ORDERS_COMPLETE_PACKAGE.md',
      tags: ['Subscriptions', 'Package']
    },
    { 
      category: 'Developer Guides',
      title: 'Subscription Invoices Complete Package',
      description: 'Complete package for subscription invoices',
      path: '/docs/developer/SUBSCRIPTION_INVOICES_COMPLETE_PACKAGE.md',
      tags: ['Subscriptions', 'Package']
    },
    
    // Use Cases Documentation
    { 
      category: 'Use Cases',
      title: 'Tenants Use Cases',
      description: 'Real-world use cases for tenant management',
      path: '/docs/UseCases_Tenants.md',
      tags: ['Tenants', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Tenant Detail Use Cases',
      description: 'Use cases for tenant detail operations',
      path: '/docs/UseCases_Tenant_Detail.md',
      tags: ['Tenants', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Users Use Cases',
      description: 'Real-world use cases for user management',
      path: '/docs/UseCases_Users.md',
      tags: ['Users', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Products Use Cases',
      description: 'Real-world use cases for products module',
      path: '/docs/PRODUCTS_USECASES.md',
      tags: ['Products', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Products Use Cases (Developer)',
      description: 'Developer-focused product use cases',
      path: '/docs/developer/products-use-cases.md',
      tags: ['Products', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Packages Use Cases',
      description: 'Real-world use cases for packages module',
      path: '/docs/PACKAGES_USECASES.md',
      tags: ['Packages', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Service Packages Use Cases (Developer)',
      description: 'Developer-focused service package use cases',
      path: '/docs/developer/service-packages-use-cases.md',
      tags: ['Packages', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Orders Use Cases',
      description: 'Real-world use cases for orders module',
      path: '/docs/ORDERS_USECASES.md',
      tags: ['Orders', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Subscriptions Use Cases',
      description: 'Real-world use cases for subscriptions',
      path: '/docs/developer/subscriptions-use-cases.md',
      tags: ['Subscriptions', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Subscription Orders Use Cases',
      description: 'Real-world use cases for subscription orders',
      path: '/docs/developer/subscription-orders-use-cases.md',
      tags: ['Subscriptions', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Subscription Invoices Use Cases',
      description: 'Real-world use cases for subscription invoices',
      path: '/docs/developer/subscription-invoices-use-cases.md',
      tags: ['Subscriptions', 'Use Cases']
    },
    { 
      category: 'Use Cases',
      title: 'Webhooks Use Cases',
      description: 'Real-world use cases for webhooks',
      path: '/docs/developer/webhooks-use-cases.md',
      tags: ['Webhooks', 'Use Cases']
    },
    
    // Database Schemas (Developer)
    { 
      category: 'Database',
      title: 'Products Database Schema (Developer)',
      description: 'Detailed products database schema',
      path: '/docs/developer/products-database-schema.md',
      tags: ['Products', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Service Packages Database Schema',
      description: 'Detailed service packages database schema',
      path: '/docs/developer/service-packages-database-schema.md',
      tags: ['Packages', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Subscriptions Database Schema',
      description: 'Detailed subscriptions database schema',
      path: '/docs/developer/subscriptions-database-schema.md',
      tags: ['Subscriptions', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Subscription Orders Database Schema',
      description: 'Detailed subscription orders database schema',
      path: '/docs/developer/subscription-orders-database-schema.md',
      tags: ['Subscriptions', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Subscription Invoices Database Schema',
      description: 'Detailed subscription invoices database schema',
      path: '/docs/developer/subscription-invoices-database-schema.md',
      tags: ['Subscriptions', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Webhooks Database Schema',
      description: 'Detailed webhooks database schema',
      path: '/docs/developer/webhooks-database-schema.md',
      tags: ['Webhooks', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Products Schema',
      description: 'Products database schema documentation',
      path: '/docs/PRODUCTS_SCHEMA.md',
      tags: ['Products', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Packages Schema',
      description: 'Packages database schema documentation',
      path: '/docs/PACKAGES_SCHEMA.md',
      tags: ['Packages', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Orders Schema',
      description: 'Orders database schema documentation',
      path: '/docs/ORDERS_SCHEMA.md',
      tags: ['Orders', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Invoices Schema',
      description: 'Invoices database schema documentation',
      path: '/docs/INVOICES_SCHEMA.md',
      tags: ['Invoices', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Webhooks Schema',
      description: 'Webhooks database schema documentation',
      path: '/docs/WEBHOOKS_SCHEMA.md',
      tags: ['Webhooks', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Tenants Database Schema',
      description: 'Tenants database schema documentation',
      path: '/docs/Database_Tenants_Schema.md',
      tags: ['Tenants', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Tenant Detail Database Schema',
      description: 'Tenant detail database schema documentation',
      path: '/docs/Database_Tenant_Detail_Schema.md',
      tags: ['Tenants', 'Schema']
    },
    { 
      category: 'Database',
      title: 'Users Database Schema',
      description: 'Users database schema documentation',
      path: '/docs/Database_Users_Schema.md',
      tags: ['Users', 'Schema']
    },
    
    // ERD Diagrams
    { 
      category: 'Database',
      title: 'Products ERD Diagram',
      description: 'Entity relationship diagram for products',
      path: '/docs/PRODUCTS_ERD.md',
      tags: ['Products', 'ERD']
    },
    { 
      category: 'Database',
      title: 'Products ERD (Developer)',
      description: 'Developer-focused products ERD',
      path: '/docs/developer/products-erd-diagram.md',
      tags: ['Products', 'ERD']
    },
    { 
      category: 'Database',
      title: 'Packages ERD Diagram',
      description: 'Entity relationship diagram for packages',
      path: '/docs/PACKAGES_ERD.md',
      tags: ['Packages', 'ERD']
    },
    { 
      category: 'Database',
      title: 'Service Packages ERD',
      description: 'Developer-focused service packages ERD',
      path: '/docs/developer/service-packages-erd-diagram.md',
      tags: ['Packages', 'ERD']
    },
    { 
      category: 'Database',
      title: 'Orders ERD Diagram',
      description: 'Entity relationship diagram for orders',
      path: '/docs/ORDERS_ERD.md',
      tags: ['Orders', 'ERD']
    },
    { 
      category: 'Database',
      title: 'Subscriptions ERD',
      description: 'Entity relationship diagram for subscriptions',
      path: '/docs/developer/subscriptions-erd-diagram.md',
      tags: ['Subscriptions', 'ERD']
    },
    { 
      category: 'Database',
      title: 'Subscription Orders ERD',
      description: 'Entity relationship diagram for subscription orders',
      path: '/docs/developer/subscription-orders-erd-diagram.md',
      tags: ['Subscriptions', 'ERD']
    },
    { 
      category: 'Database',
      title: 'Subscription Invoices ERD',
      description: 'Entity relationship diagram for subscription invoices',
      path: '/docs/developer/subscription-invoices-erd-diagram.md',
      tags: ['Subscriptions', 'ERD']
    },
    { 
      category: 'Database',
      title: 'Webhooks ERD',
      description: 'Entity relationship diagram for webhooks',
      path: '/docs/developer/webhooks-erd-diagram.md',
      tags: ['Webhooks', 'ERD']
    },
    
    // API References (Developer)
    { 
      category: 'Core',
      title: 'Products API Reference (Developer)',
      description: 'Detailed API reference for products',
      path: '/docs/developer/products-api-reference.md',
      tags: ['Products', 'API Reference']
    },
    { 
      category: 'Commerce',
      title: 'Service Packages API Reference',
      description: 'Detailed API reference for service packages',
      path: '/docs/developer/service-packages-api-reference.md',
      tags: ['Packages', 'API Reference']
    },
    { 
      category: 'Commerce',
      title: 'Subscriptions API Reference',
      description: 'Detailed API reference for subscriptions',
      path: '/docs/developer/subscriptions-api-reference.md',
      tags: ['Subscriptions', 'API Reference']
    },
    { 
      category: 'Commerce',
      title: 'Subscription Orders API Reference',
      description: 'Detailed API reference for subscription orders',
      path: '/docs/developer/subscription-orders-api-reference.md',
      tags: ['Subscriptions', 'API Reference']
    },
    { 
      category: 'Commerce',
      title: 'Subscription Invoices API Reference',
      description: 'Detailed API reference for subscription invoices',
      path: '/docs/developer/subscription-invoices-api-reference.md',
      tags: ['Subscriptions', 'API Reference']
    },
    { 
      category: 'Platform',
      title: 'Webhooks API Reference',
      description: 'Detailed API reference for webhooks',
      path: '/docs/developer/webhooks-api-reference.md',
      tags: ['Webhooks', 'API Reference']
    },
  ];

  // Filter API docs
  const filteredApiDocs = useMemo(() => {
    let filtered = apiDocs;

    if (selectedApiCategory) {
      filtered = filtered.filter((doc) => doc.category === selectedApiCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  }, [selectedApiCategory, searchQuery]);

  const apiCategories = ['Core', 'Platform', 'Commerce', 'Monitoring', 'Database', 'Integration', 'Developer Guides', 'Use Cases'];

  // === API TAB DATA ===
  const { info, servers, tags, paths } = openApiSpec;

  // Convert paths to array of endpoints
  const endpoints = useMemo(() => {
    const result: any[] = [];
    
    Object.entries(paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, details]: [string, any]) => {
        result.push({
          method,
          path,
          ...details,
        });
      });
    });

    return result;
  }, [paths]);

  // Filter endpoints for API tab
  const filteredEndpoints = useMemo(() => {
    let filtered = endpoints;

    if (selectedTag) {
      filtered = filtered.filter((endpoint) =>
        endpoint.tags?.includes(selectedTag)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (endpoint) =>
          endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          endpoint.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [endpoints, selectedTag, searchQuery]);

  // === DATABASE TAB DATA ===
  // Filter tables for Database tab
  const filteredTables = useMemo(() => {
    let filtered = databaseSchema;

    // Filter by table type
    if (selectedTableType) {
      filtered = filtered.filter(table => table.tableType === selectedTableType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (table) =>
          table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          table.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          table.columns.some((col) =>
            col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            col.description.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    return filtered;
  }, [searchQuery, selectedTableType]);

  // === USECASES TAB DATA ===
  // Filter usecases for Usecases tab
  const filteredUsecases = useMemo(() => {
    let filtered = usecases;

    if (selectedCategory) {
      filtered = filtered.filter((usecase) =>
        usecase.category === selectedCategory
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (usecase) =>
          usecase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          usecase.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [usecases, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{t('devDocs.title')}</h1>
              <p className="text-muted-foreground">{t('devDocs.subtitle')}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('devDocs.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="api-docs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="api-docs" className="gap-2">
              <Code className="w-4 h-4" />
              API Docs
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <BookOpen className="w-4 h-4" />
              {t('devDocs.apiTab')}
            </TabsTrigger>
            <TabsTrigger value="tables" className="gap-2">
              <Database className="w-4 h-4" />
              {t('devDocs.tablesTab')}
            </TabsTrigger>
            <TabsTrigger value="erd" className="gap-2">
              <GitBranch className="w-4 h-4" />
              {t('devDocs.erdTab')}
            </TabsTrigger>
            <TabsTrigger value="usecases" className="gap-2">
              <FileText className="w-4 h-4" />
              {t('devDocs.usecasesTab')}
            </TabsTrigger>
          </TabsList>

          {/* API Docs Tab */}
          <TabsContent value="api-docs" className="space-y-6">
            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Code className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total APIs</p>
                    <p className="text-2xl font-bold">{apiDocs.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <FolderOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Core APIs</p>
                    <p className="text-2xl font-bold">
                      {apiDocs.filter(d => d.category === 'Core').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commerce APIs</p>
                    <p className="text-2xl font-bold">
                      {apiDocs.filter(d => d.category === 'Commerce').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <FolderOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Platform APIs</p>
                    <p className="text-2xl font-bold">
                      {apiDocs.filter(d => d.category === 'Platform').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Button
                variant={selectedApiCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedApiCategory(null)}
              >
                All Categories
              </Button>
              {apiCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedApiCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedApiCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* API Docs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredApiDocs.length > 0 ? (
                filteredApiDocs.map((doc, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-xl border border-border/40 p-6 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-500/10">
                            <Code className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{doc.title}</h3>
                            <Badge variant="outline" className="mt-1">
                              {doc.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <a
                          href={doc.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View Documentation
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-card rounded-xl border border-border/40 p-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No API documentation found</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            {/* API Info Card */}
            <div className="bg-card rounded-xl border border-border/40 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{info.title}</h2>
                  <p className="text-muted-foreground">{info.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{info.version}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Filter */}
            {tags && tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant={selectedTag === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                >
                  {t('api.allTags')}
                </Button>
                {tags.map((tag) => (
                  <Button
                    key={tag.name}
                    variant={selectedTag === tag.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTag(tag.name)}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Endpoints List */}
            <div className="space-y-4">
              {filteredEndpoints.length > 0 ? (
                filteredEndpoints.map((endpoint, index) => (
                  <ApiEndpoint key={`${endpoint.method}-${endpoint.path}-${index}`} endpoint={endpoint} />
                ))
              ) : (
                <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('api.noResults')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-6">
            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('database.totalTables')}</p>
                    <p className="text-2xl font-bold">{databaseSchema.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">GLOBAL Tables</p>
                    <p className="text-2xl font-bold">
                      {databaseSchema.filter(t => t.tableType === 'GLOBAL').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <GitBranch className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">TENANT-SPECIFIC</p>
                    <p className="text-2xl font-bold">
                      {databaseSchema.filter(t => t.tableType === 'TENANT-SPECIFIC').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('database.totalColumns')}</p>
                    <p className="text-2xl font-bold">
                      {databaseSchema.reduce((sum, table) => sum + table.columns.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Type Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Button
                variant={selectedTableType === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTableType(null)}
              >
                All Table Types
              </Button>
              <Button
                variant={selectedTableType === 'GLOBAL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTableType('GLOBAL')}
              >
                GLOBAL
              </Button>
              <Button
                variant={selectedTableType === 'TENANT-SPECIFIC' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTableType('TENANT-SPECIFIC')}
              >
                TENANT-SPECIFIC
              </Button>
            </div>

            {/* Tables List with Accordion */}
            <div className="space-y-6">
              {filteredTables.length > 0 ? (
                <Accordion type="multiple" className="space-y-4">
                  {filteredTables.map((table) => (
                    <AccordionItem 
                      key={table.name} 
                      value={table.name}
                      className="bg-card rounded-xl border border-border/40 px-6 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Database className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-lg">{table.name}</h3>
                            <p className="text-sm text-muted-foreground">{table.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <DatabaseTable table={table} compact />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('database.noResults')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ERD Tab */}
          <TabsContent value="erd" className="space-y-6">
            <div className="bg-card rounded-xl border border-border/40 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <GitBranch className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{t('database.erdTitle')}</h2>
                    <p className="text-sm text-muted-foreground">{t('database.erdSubtitle')}</p>
                  </div>
                </div>
                <ERDiagram diagram={erdDiagram} />
              </div>
            </div>
          </TabsContent>

          {/* Usecases Tab */}
          <TabsContent value="usecases" className="space-y-6">
            {/* Header with Download Button */}
            <div className="flex items-center justify-between gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  {t('usecases.allCategories')}
                </Button>
                {usecaseCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Download Button */}
              <Button
                size="default"
                onClick={() => generateAllUsecasesDocx(usecases)}
                className="gap-2 shrink-0"
              >
                <Download className="w-4 h-4" />
                {t('usecases.download')}
              </Button>
            </div>

            {/* Usecases List */}
            <div className="space-y-4">
              {filteredUsecases.length > 0 ? (
                filteredUsecases.map((usecase) => (
                  <UsecaseCard 
                    key={usecase.id} 
                    usecase={usecase}
                  />
                ))
              ) : (
                <div className="bg-card rounded-xl border border-border/40 p-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('usecases.noResults')}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DevDocsPage;