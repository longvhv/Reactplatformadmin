#!/bin/bash

# Complete Setup Script for Tenant Data
# This script initializes all necessary data for the platform

echo "🚀 Starting tenant data initialization..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TENANT_ID="078e19ae-af67-4452-9ccd-10e27acb2dfe"
ADMIN_EMAIL="admin@saas.coquan.vn"
ADMIN_PASSWORD="Vhv@2026"

echo "📋 Configuration:"
echo "  Tenant ID: $TENANT_ID"
echo "  Admin Email: $ADMIN_EMAIL"
echo "  Domain: saas.coquan.vn"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Load environment variables
source .env.local

echo "1️⃣  Running SQL initialization script..."
echo "   Please run the SQL script in Supabase SQL Editor:"
echo "   scripts/init-tenant-data.sql"
echo ""
read -p "   Press Enter when SQL script is completed..."

echo ""
echo "2️⃣  Creating admin user in Supabase Auth..."
echo "   Please follow these steps in Supabase Dashboard:"
echo ""
echo "   a) Go to Authentication > Users"
echo "   b) Click 'Add User' > 'Create new user'"
echo "   c) Enter:"
echo "      Email: $ADMIN_EMAIL"
echo "      Password: $ADMIN_PASSWORD"
echo "      ✓ Auto Confirm Email"
echo ""
read -p "   Press Enter when user is created..."

echo ""
echo "3️⃣  Getting user ID from Supabase..."
echo "   Copy the user ID (UUID) from the dashboard"
read -p "   Paste User ID here: " USER_ID

if [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ Error: User ID is required${NC}"
    exit 1
fi

echo ""
echo "4️⃣  Creating database records for admin user..."

# Create temp SQL file
cat > /tmp/setup-admin-user.sql << EOF
-- Insert user record
INSERT INTO users (
  _id,
  email,
  name,
  status,
  is_verified,
  created_at,
  updated_at
) VALUES (
  '$USER_ID',
  '$ADMIN_EMAIL',
  'Administrator',
  'ACTIVE',
  true,
  NOW(),
  NOW()
) ON CONFLICT (_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  is_verified = EXCLUDED.is_verified;

-- Create tenant member
INSERT INTO tenant_members (
  _id,
  tenant_id,
  user_id,
  status,
  joined_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '$TENANT_ID',
  '$USER_ID',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Assign Administrator role
INSERT INTO user_roles (
  _id,
  user_id,
  role_id,
  tenant_id,
  assigned_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  '$USER_ID',
  r._id,
  '$TENANT_ID',
  NOW(),
  NOW(),
  NOW()
FROM roles r
WHERE r.code = 'ADMINISTRATOR'
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 
  'Users' as table_name,
  COUNT(*) as count
FROM users 
WHERE _id = '$USER_ID'
UNION ALL
SELECT 
  'Tenant Members',
  COUNT(*)
FROM tenant_members 
WHERE user_id = '$USER_ID'
UNION ALL
SELECT 
  'User Roles',
  COUNT(*)
FROM user_roles 
WHERE user_id = '$USER_ID';
EOF

echo "   Generated SQL file: /tmp/setup-admin-user.sql"
echo "   Please run this SQL in Supabase SQL Editor"
echo ""
read -p "   Press Enter when SQL is completed..."

echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo "📝 Login Information:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"
echo "   URL: http://localhost:3000/login"
echo ""
echo "🎉 You can now log in to the admin panel!"
