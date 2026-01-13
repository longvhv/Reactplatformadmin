/**
 * Demo Data for Initial Setup
 * Comprehensive seed data for tenants, users, and tenant_members
 */

import type { CreateUserInput } from './users';

// ============================================
// DEMO TENANTS - Hierarchical Structure
// ============================================

export const DEMO_TENANTS = [
  // ROOT: Platform Tenant
  {
    code: 'vhv-platform',
    name: 'VHV Platform',
    type: 'PLATFORM',
    status: 'ACTIVE',
    description: 'Main platform tenant - root of all organizations',
    contact_email: 'admin@vhvplatform.com',
    contact_phone: '+84-28-1234-5678',
    address: 'Ho Chi Minh City, Vietnam',
    website: 'https://vhvplatform.com',
    logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
    settings: {
      timezone: 'Asia/Ho_Chi_Minh',
      currency: 'VND',
      language: 'vi',
    },
    parent_code: null,
  },

  // LEVEL 1: Enterprise Organizations
  {
    code: 'tech-corp',
    name: 'Tech Corporation',
    type: 'ENTERPRISE',
    status: 'ACTIVE',
    description: 'Large technology corporation with multiple divisions',
    contact_email: 'contact@techcorp.com',
    contact_phone: '+1-415-555-0100',
    address: 'San Francisco, CA, USA',
    website: 'https://techcorp.example.com',
    logo_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200',
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en',
      max_users: 500,
    },
    parent_code: 'vhv-platform',
  },
  {
    code: 'edu-institute',
    name: 'Education Institute',
    type: 'EDUCATION',
    status: 'ACTIVE',
    description: 'Educational institution with multiple campuses',
    contact_email: 'admin@eduinstitute.edu',
    contact_phone: '+44-20-7946-0958',
    address: 'London, UK',
    website: 'https://eduinstitute.example.com',
    logo_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200',
    settings: {
      timezone: 'Europe/London',
      currency: 'GBP',
      language: 'en',
      max_users: 1000,
    },
    parent_code: 'vhv-platform',
  },
  {
    code: 'health-care',
    name: 'HealthCare Plus',
    type: 'HEALTHCARE',
    status: 'ACTIVE',
    description: 'Healthcare provider network',
    contact_email: 'info@healthcareplus.com',
    contact_phone: '+1-212-555-0150',
    address: 'New York, NY, USA',
    website: 'https://healthcareplus.example.com',
    logo_url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200',
    settings: {
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
      max_users: 300,
    },
    parent_code: 'vhv-platform',
  },

  // LEVEL 2: Divisions under Tech Corp
  {
    code: 'tech-corp-engineering',
    name: 'Engineering Division',
    type: 'DIVISION',
    status: 'ACTIVE',
    description: 'Software engineering and development',
    contact_email: 'engineering@techcorp.com',
    contact_phone: '+1-415-555-0101',
    address: 'San Francisco, CA, USA',
    logo_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200',
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en',
    },
    parent_code: 'tech-corp',
  },
  {
    code: 'tech-corp-sales',
    name: 'Sales & Marketing Division',
    type: 'DIVISION',
    status: 'ACTIVE',
    description: 'Sales and marketing operations',
    contact_email: 'sales@techcorp.com',
    contact_phone: '+1-415-555-0102',
    address: 'San Francisco, CA, USA',
    logo_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=200',
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en',
    },
    parent_code: 'tech-corp',
  },

  // LEVEL 2: Campuses under Education Institute
  {
    code: 'edu-campus-london',
    name: 'London Campus',
    type: 'BRANCH',
    status: 'ACTIVE',
    description: 'Main campus in London',
    contact_email: 'london@eduinstitute.edu',
    contact_phone: '+44-20-7946-0959',
    address: 'Central London, UK',
    logo_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200',
    settings: {
      timezone: 'Europe/London',
      currency: 'GBP',
      language: 'en',
    },
    parent_code: 'edu-institute',
  },
  {
    code: 'edu-campus-manchester',
    name: 'Manchester Campus',
    type: 'BRANCH',
    status: 'ACTIVE',
    description: 'Branch campus in Manchester',
    contact_email: 'manchester@eduinstitute.edu',
    contact_phone: '+44-161-555-0100',
    address: 'Manchester, UK',
    logo_url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=200',
    settings: {
      timezone: 'Europe/London',
      currency: 'GBP',
      language: 'en',
    },
    parent_code: 'edu-institute',
  },

  // LEVEL 3: Teams under Engineering Division
  {
    code: 'tech-corp-eng-frontend',
    name: 'Frontend Team',
    type: 'TEAM',
    status: 'ACTIVE',
    description: 'Frontend development team',
    contact_email: 'frontend@techcorp.com',
    logo_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200',
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en',
    },
    parent_code: 'tech-corp-engineering',
  },
  {
    code: 'tech-corp-eng-backend',
    name: 'Backend Team',
    type: 'TEAM',
    status: 'ACTIVE',
    description: 'Backend development team',
    contact_email: 'backend@techcorp.com',
    logo_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200',
    settings: {
      timezone: 'America/Los_Angeles',
      currency: 'USD',
      language: 'en',
    },
    parent_code: 'tech-corp-engineering',
  },

  // Test/Demo tenant
  {
    code: 'demo-tenant',
    name: 'Demo Tenant',
    type: 'TRIAL',
    status: 'ACTIVE',
    description: 'Demo tenant for testing purposes',
    contact_email: 'demo@example.com',
    contact_phone: '+1-555-0199',
    logo_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200',
    settings: {
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      is_demo: true,
    },
    parent_code: 'vhv-platform',
  },
];

// ============================================
// DEMO USERS
// ============================================

export const DEMO_USERS: CreateUserInput[] = [
  // Super Admins
  {
    email: 'admin@vhvplatform.com',
    password: 'Admin@123456',
    name: 'Platform Administrator',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    department: 'Platform Operations',
    position: 'Chief Technology Officer',
    phone: '+84-28-1234-5678',
    location: 'Ho Chi Minh City, Vietnam',
    bio: 'Platform administrator with full system access',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  },
  {
    email: 'sarah.admin@vhvplatform.com',
    password: 'Admin@123456',
    name: 'Sarah Johnson',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    department: 'Platform Operations',
    position: 'Platform Director',
    phone: '+1-415-555-0200',
    location: 'San Francisco, CA',
    bio: 'Platform operations director',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
  },

  // Tech Corp - Admins
  {
    email: 'john.doe@techcorp.com',
    password: 'User@123456',
    name: 'John Doe',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Engineering',
    position: 'Engineering Manager',
    phone: '+1-415-555-0101',
    location: 'San Francisco, CA',
    bio: 'Engineering manager with 10+ years of experience',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  },
  {
    email: 'lisa.chen@techcorp.com',
    password: 'User@123456',
    name: 'Lisa Chen',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Sales & Marketing',
    position: 'Sales Director',
    phone: '+1-415-555-0102',
    location: 'San Francisco, CA',
    bio: 'Driving sales growth and customer success',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  },

  // Tech Corp - Users (Engineering)
  {
    email: 'mike.wilson@techcorp.com',
    password: 'User@123456',
    name: 'Mike Wilson',
    role: 'USER',
    status: 'ACTIVE',
    department: 'Engineering',
    position: 'Senior Frontend Developer',
    phone: '+1-415-555-0110',
    location: 'San Francisco, CA',
    bio: 'React and TypeScript specialist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  },
  {
    email: 'emma.brown@techcorp.com',
    password: 'User@123456',
    name: 'Emma Brown',
    role: 'USER',
    status: 'ACTIVE',
    department: 'Engineering',
    position: 'Senior Backend Developer',
    phone: '+1-415-555-0111',
    location: 'San Francisco, CA',
    bio: 'Node.js and database expert',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  },
  {
    email: 'alex.kim@techcorp.com',
    password: 'User@123456',
    name: 'Alex Kim',
    role: 'USER',
    status: 'ACTIVE',
    department: 'Engineering',
    position: 'DevOps Engineer',
    phone: '+1-415-555-0112',
    location: 'San Francisco, CA',
    bio: 'Cloud infrastructure and CI/CD specialist',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
  },

  // Education Institute - Admins
  {
    email: 'david.smith@eduinstitute.edu',
    password: 'User@123456',
    name: 'Dr. David Smith',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Administration',
    position: 'Academic Director',
    phone: '+44-20-7946-0960',
    location: 'London, UK',
    bio: 'Leading academic excellence and innovation',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200',
  },

  // Education Institute - Users
  {
    email: 'sophia.white@eduinstitute.edu',
    password: 'User@123456',
    name: 'Prof. Sophia White',
    role: 'USER',
    status: 'ACTIVE',
    department: 'Computer Science',
    position: 'Professor',
    phone: '+44-20-7946-0961',
    location: 'London, UK',
    bio: 'Teaching AI and machine learning',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200',
  },
  {
    email: 'james.taylor@eduinstitute.edu',
    password: 'User@123456',
    name: 'James Taylor',
    role: 'USER',
    status: 'ACTIVE',
    department: 'Student Services',
    position: 'Student Advisor',
    phone: '+44-161-555-0101',
    location: 'Manchester, UK',
    bio: 'Supporting student success and wellbeing',
    avatar: 'https://images.unsplash.com/photo-1502767089025-6572583495f9?w=200',
  },

  // Healthcare - Admin
  {
    email: 'dr.maria.garcia@healthcareplus.com',
    password: 'User@123456',
    name: 'Dr. Maria Garcia',
    role: 'ADMIN',
    status: 'ACTIVE',
    department: 'Medical Services',
    position: 'Chief Medical Officer',
    phone: '+1-212-555-0151',
    location: 'New York, NY',
    bio: 'Leading medical excellence and patient care',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
  },

  // Healthcare - Users
  {
    email: 'robert.johnson@healthcareplus.com',
    password: 'User@123456',
    name: 'Robert Johnson',
    role: 'USER',
    status: 'ACTIVE',
    department: 'Cardiology',
    position: 'Cardiologist',
    phone: '+1-212-555-0152',
    location: 'New York, NY',
    bio: 'Specialized in cardiovascular health',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200',
  },

  // Moderators
  {
    email: 'support@vhvplatform.com',
    password: 'User@123456',
    name: 'Support Team',
    role: 'MODERATOR',
    status: 'ACTIVE',
    department: 'Customer Support',
    position: 'Support Lead',
    phone: '+84-28-1234-5679',
    location: 'Ho Chi Minh City, Vietnam',
    bio: 'Providing excellent customer support',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
  },

  // Viewers
  {
    email: 'guest@vhvplatform.com',
    password: 'User@123456',
    name: 'Guest User',
    role: 'VIEWER',
    status: 'ACTIVE',
    department: 'Guest Access',
    position: 'Guest',
    phone: '',
    location: 'Global',
    bio: 'Read-only access for demonstration',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200',
  },

  // Inactive/Suspended Users
  {
    email: 'inactive@example.com',
    password: 'User@123456',
    name: 'Inactive User',
    role: 'USER',
    status: 'INACTIVE',
    department: 'Various',
    position: 'Former Employee',
    bio: 'This account is inactive',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200',
  },
];

// ============================================
// TENANT MEMBERS MAPPING
// ============================================

export const DEMO_TENANT_MEMBERS = [
  // Platform admins
  { user_email: 'admin@vhvplatform.com', tenant_code: 'vhv-platform', role: 'OWNER' },
  { user_email: 'sarah.admin@vhvplatform.com', tenant_code: 'vhv-platform', role: 'ADMIN' },

  // Tech Corp
  { user_email: 'john.doe@techcorp.com', tenant_code: 'tech-corp', role: 'OWNER' },
  { user_email: 'lisa.chen@techcorp.com', tenant_code: 'tech-corp', role: 'ADMIN' },
  { user_email: 'john.doe@techcorp.com', tenant_code: 'tech-corp-engineering', role: 'ADMIN' },
  { user_email: 'lisa.chen@techcorp.com', tenant_code: 'tech-corp-sales', role: 'ADMIN' },
  
  // Engineering teams
  { user_email: 'mike.wilson@techcorp.com', tenant_code: 'tech-corp-engineering', role: 'MEMBER' },
  { user_email: 'mike.wilson@techcorp.com', tenant_code: 'tech-corp-eng-frontend', role: 'ADMIN' },
  { user_email: 'emma.brown@techcorp.com', tenant_code: 'tech-corp-engineering', role: 'MEMBER' },
  { user_email: 'emma.brown@techcorp.com', tenant_code: 'tech-corp-eng-backend', role: 'ADMIN' },
  { user_email: 'alex.kim@techcorp.com', tenant_code: 'tech-corp-engineering', role: 'MEMBER' },
  { user_email: 'alex.kim@techcorp.com', tenant_code: 'tech-corp-eng-backend', role: 'MEMBER' },

  // Education Institute
  { user_email: 'david.smith@eduinstitute.edu', tenant_code: 'edu-institute', role: 'OWNER' },
  { user_email: 'david.smith@eduinstitute.edu', tenant_code: 'edu-campus-london', role: 'ADMIN' },
  { user_email: 'sophia.white@eduinstitute.edu', tenant_code: 'edu-campus-london', role: 'MEMBER' },
  { user_email: 'james.taylor@eduinstitute.edu', tenant_code: 'edu-campus-manchester', role: 'MEMBER' },

  // Healthcare
  { user_email: 'dr.maria.garcia@healthcareplus.com', tenant_code: 'health-care', role: 'OWNER' },
  { user_email: 'robert.johnson@healthcareplus.com', tenant_code: 'health-care', role: 'MEMBER' },

  // Moderators have access to platform
  { user_email: 'support@vhvplatform.com', tenant_code: 'vhv-platform', role: 'MEMBER' },
  
  // Guest viewer
  { user_email: 'guest@vhvplatform.com', tenant_code: 'demo-tenant', role: 'VIEWER' },
];

// Summary
export const DEMO_DATA_SUMMARY = {
  tenants: DEMO_TENANTS.length,
  users: DEMO_USERS.length,
  tenant_members: DEMO_TENANT_MEMBERS.length,
  hierarchy_levels: 3,
  organizations: {
    platform: 1,
    enterprise: 3,
    divisions: 2,
    branches: 2,
    teams: 2,
    trial: 1,
  },
  user_roles: {
    super_admin: 2,
    admin: 5,
    user: 7,
    moderator: 1,
    viewer: 1,
  },
};
