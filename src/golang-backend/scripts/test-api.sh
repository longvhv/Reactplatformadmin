#!/bin/bash

# VHV Platform API Test Script
# Tests all major API endpoints

set -e

BASE_URL="${API_BASE_URL:-http://localhost:8080}"
EMAIL="${TEST_EMAIL:-admin@saas.coquan.vn}"
PASSWORD="${TEST_PASSWORD:-Admin@2026}"

ACCESS_TOKEN=""
TENANT_ID=""
USER_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test health endpoint
test_health() {
    print_info "Testing health endpoint..."
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Health check passed"
        echo "$body" | jq '.'
    else
        print_error "Health check failed (HTTP $http_code)"
        exit 1
    fi
}

# Test login
test_login() {
    print_info "Testing login..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        ACCESS_TOKEN=$(echo "$body" | jq -r '.data.access_token')
        USER_ID=$(echo "$body" | jq -r '.data.user.id')
        print_success "Login successful"
        echo "Access Token: ${ACCESS_TOKEN:0:20}..."
        echo "User ID: $USER_ID"
    else
        print_error "Login failed (HTTP $http_code)"
        echo "$body" | jq '.'
        exit 1
    fi
}

# Test get current user
test_get_me() {
    print_info "Testing get current user..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X GET "$BASE_URL/api/v1/users/me" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Get current user successful"
        echo "$body" | jq '.data'
    else
        print_error "Get current user failed (HTTP $http_code)"
        echo "$body" | jq '.'
    fi
}

# Test list users
test_list_users() {
    print_info "Testing list users..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X GET "$BASE_URL/api/v1/users?page=1&limit=10" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "List users successful"
        echo "$body" | jq '.data'
    else
        print_error "List users failed (HTTP $http_code)"
        echo "$body" | jq '.'
    fi
}

# Test list tenants
test_list_tenants() {
    print_info "Testing list tenants..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X GET "$BASE_URL/api/v1/tenants?page=1&limit=10" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        TENANT_ID=$(echo "$body" | jq -r '.data.data[0].id')
        print_success "List tenants successful"
        echo "First Tenant ID: $TENANT_ID"
        echo "$body" | jq '.data'
    else
        print_error "List tenants failed (HTTP $http_code)"
        echo "$body" | jq '.'
    fi
}

# Test list roles
test_list_roles() {
    print_info "Testing list roles..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X GET "$BASE_URL/api/v1/roles?page=1&limit=20" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "List roles successful"
        echo "$body" | jq '.data'
    else
        print_error "List roles failed (HTTP $http_code)"
        echo "$body" | jq '.'
    fi
}

# Test list applications
test_list_applications() {
    print_info "Testing list applications..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X GET "$BASE_URL/api/v1/applications" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "List applications successful"
        echo "$body" | jq '.data'
    else
        print_error "List applications failed (HTTP $http_code)"
        echo "$body" | jq '.'
    fi
}

# Test logout
test_logout() {
    print_info "Testing logout..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$BASE_URL/api/v1/auth/logout" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        print_success "Logout successful"
    else
        print_error "Logout failed (HTTP $http_code)"
        echo "$body" | jq '.'
    fi
}

# Main test flow
main() {
    echo "=========================================="
    echo "VHV Platform API Test"
    echo "=========================================="
    echo "Base URL: $BASE_URL"
    echo "Test Email: $EMAIL"
    echo "=========================================="
    echo ""
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed. Please install jq to run this script."
        exit 1
    fi
    
    test_health
    echo ""
    
    test_login
    echo ""
    
    test_get_me
    echo ""
    
    test_list_users
    echo ""
    
    test_list_tenants
    echo ""
    
    test_list_roles
    echo ""
    
    test_list_applications
    echo ""
    
    test_logout
    echo ""
    
    print_success "All tests completed!"
}

main
