#!/bin/bash

# Seed Permissions Script
# Tạo các permissions mẫu cho hệ thống

API_URL="${API_URL:-http://localhost:8080}"
API_BASE="$API_URL/api/v1/permissions"

echo "🌱 Seeding Permissions..."
echo "API URL: $API_BASE"
echo ""

# Function to create permission
create_permission() {
    local code=$1
    local name=$2
    local description=$3
    local category=$4
    local type=$5
    local sort_order=$6

    echo "Creating: $code"
    curl -s -X POST "$API_BASE" \
        -H "Content-Type: application/json" \
        -d "{
            \"code\": \"$code\",
            \"name\": \"$name\",
            \"description\": \"$description\",
            \"category\": \"$category\",
            \"type\": \"$type\",
            \"is_system\": true,
            \"sort_order\": $sort_order
        }" | jq -r '.success'
}

# USERS Permissions
echo "📋 Creating USERS permissions..."
create_permission "users.read" "Read Users" "View user information" "USERS" "READ" 10
create_permission "users.write" "Write Users" "Create and update users" "USERS" "WRITE" 20
create_permission "users.delete" "Delete Users" "Delete users" "USERS" "DELETE" 30
create_permission "users.manage" "Manage Users" "Full user management" "USERS" "MANAGE" 40

# ROLES Permissions
echo "📋 Creating ROLES permissions..."
create_permission "roles.read" "Read Roles" "View role information" "ROLES" "READ" 10
create_permission "roles.write" "Write Roles" "Create and update roles" "ROLES" "WRITE" 20
create_permission "roles.delete" "Delete Roles" "Delete roles" "ROLES" "DELETE" 30
create_permission "roles.manage" "Manage Roles" "Full role management" "ROLES" "MANAGE" 40

# TENANTS Permissions
echo "📋 Creating TENANTS permissions..."
create_permission "tenants.read" "Read Tenants" "View tenant information" "TENANTS" "READ" 10
create_permission "tenants.write" "Write Tenants" "Create and update tenants" "TENANTS" "WRITE" 20
create_permission "tenants.delete" "Delete Tenants" "Delete tenants" "TENANTS" "DELETE" 30
create_permission "tenants.manage" "Manage Tenants" "Full tenant management" "TENANTS" "MANAGE" 40

# APPLICATIONS Permissions
echo "📋 Creating APPLICATIONS permissions..."
create_permission "applications.read" "Read Applications" "View application information" "APPLICATIONS" "READ" 10
create_permission "applications.write" "Write Applications" "Create and update applications" "APPLICATIONS" "WRITE" 20
create_permission "applications.delete" "Delete Applications" "Delete applications" "APPLICATIONS" "DELETE" 30
create_permission "applications.manage" "Manage Applications" "Full application management" "APPLICATIONS" "MANAGE" 40

# PRODUCTS Permissions
echo "📋 Creating PRODUCTS permissions..."
create_permission "products.read" "Read Products" "View product information" "PRODUCTS" "READ" 10
create_permission "products.write" "Write Products" "Create and update products" "PRODUCTS" "WRITE" 20
create_permission "products.delete" "Delete Products" "Delete products" "PRODUCTS" "DELETE" 30
create_permission "products.manage" "Manage Products" "Full product management" "PRODUCTS" "MANAGE" 40

# PACKAGES Permissions
echo "📋 Creating PACKAGES permissions..."
create_permission "packages.read" "Read Packages" "View package information" "PACKAGES" "READ" 10
create_permission "packages.write" "Write Packages" "Create and update packages" "PACKAGES" "WRITE" 20
create_permission "packages.delete" "Delete Packages" "Delete packages" "PACKAGES" "DELETE" 30
create_permission "packages.manage" "Manage Packages" "Full package management" "PACKAGES" "MANAGE" 40

# ORDERS Permissions
echo "📋 Creating ORDERS permissions..."
create_permission "orders.read" "Read Orders" "View order information" "ORDERS" "READ" 10
create_permission "orders.write" "Write Orders" "Create and update orders" "ORDERS" "WRITE" 20
create_permission "orders.delete" "Delete Orders" "Delete orders" "ORDERS" "DELETE" 30
create_permission "orders.manage" "Manage Orders" "Full order management" "ORDERS" "MANAGE" 40

# INVOICES Permissions
echo "📋 Creating INVOICES permissions..."
create_permission "invoices.read" "Read Invoices" "View invoice information" "INVOICES" "READ" 10
create_permission "invoices.write" "Write Invoices" "Create and update invoices" "INVOICES" "WRITE" 20
create_permission "invoices.delete" "Delete Invoices" "Delete invoices" "INVOICES" "DELETE" 30
create_permission "invoices.manage" "Manage Invoices" "Full invoice management" "INVOICES" "MANAGE" 40

# SETTINGS Permissions
echo "📋 Creating SETTINGS permissions..."
create_permission "settings.read" "Read Settings" "View system settings" "SETTINGS" "READ" 10
create_permission "settings.write" "Write Settings" "Update system settings" "SETTINGS" "WRITE" 20
create_permission "settings.manage" "Manage Settings" "Full settings management" "SETTINGS" "MANAGE" 30

# SYSTEM Permissions
echo "📋 Creating SYSTEM permissions..."
create_permission "system.admin" "System Admin" "Full system administration" "SYSTEM" "MANAGE" 10
create_permission "system.logs" "View Logs" "View system logs" "SYSTEM" "READ" 20
create_permission "system.backup" "Backup" "Perform system backups" "SYSTEM" "MANAGE" 30

echo ""
echo "✅ Permission seeding complete!"
echo ""
echo "📊 Summary:"
curl -s "$API_BASE/grouped" | jq -r '.data | to_entries | .[] | "\(.key): \(.value | length) permissions"'
