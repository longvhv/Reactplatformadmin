package cache

import (
	"fmt"
	"time"
)

// Cache key prefixes
const (
	UserPrefix       = "user"
	TenantPrefix     = "tenant"
	ProductPrefix    = "product"
	OrderPrefix      = "order"
	PermissionPrefix = "permission"
	RolePrefix       = "role"
	SessionPrefix    = "session"
)

// Cache TTLs
const (
	UserTTL       = 30 * time.Minute
	TenantTTL     = 1 * time.Hour
	ProductTTL    = 15 * time.Minute
	OrderTTL      = 10 * time.Minute
	PermissionTTL = 15 * time.Minute
	RoleTTL       = 30 * time.Minute
	SessionTTL    = 24 * time.Hour
)

// UserCacheKey returns cache key for user
func UserCacheKey(userID string) string {
	return fmt.Sprintf("%s:%s", UserPrefix, userID)
}

// TenantCacheKey returns cache key for tenant
func TenantCacheKey(tenantID string) string {
	return fmt.Sprintf("%s:%s", TenantPrefix, tenantID)
}

// ProductCacheKey returns cache key for product
func ProductCacheKey(productID string) string {
	return fmt.Sprintf("%s:%s", ProductPrefix, productID)
}

// OrderCacheKey returns cache key for order
func OrderCacheKey(orderID string) string {
	return fmt.Sprintf("%s:%s", OrderPrefix, orderID)
}

// PermissionCacheKey returns cache key for user permissions
func PermissionCacheKey(userID, tenantID string) string {
	return fmt.Sprintf("%s:%s:%s", PermissionPrefix, tenantID, userID)
}

// RoleCacheKey returns cache key for role
func RoleCacheKey(roleID string) string {
	return fmt.Sprintf("%s:%s", RolePrefix, roleID)
}

// SessionCacheKey returns cache key for session
func SessionCacheKey(sessionToken string) string {
	return fmt.Sprintf("%s:%s", SessionPrefix, sessionToken)
}

// UserSessionsKey returns cache key for user's sessions list
func UserSessionsKey(userID string) string {
	return fmt.Sprintf("%s:user:%s:sessions", SessionPrefix, userID)
}

// UserTenantsKey returns cache key for user's tenants list
func UserTenantsKey(userID string) string {
	return fmt.Sprintf("%s:%s:tenants", UserPrefix, userID)
}

// TenantMembersKey returns cache key for tenant's members list
func TenantMembersKey(tenantID string) string {
	return fmt.Sprintf("%s:%s:members", TenantPrefix, tenantID)
}
