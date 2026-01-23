package contextutil

import (
	"context"

	"github.com/google/uuid"
)

// Context keys
type contextKey string

const (
	RequestIDKey  contextKey = "request_id"
	UserIDKey     contextKey = "user_id"
	TenantIDKey   contextKey = "tenant_id"
	RolesKey      contextKey = "roles"
	PermissionsKey contextKey = "permissions"
	IPAddressKey  contextKey = "ip_address"
	UserAgentKey  contextKey = "user_agent"
)

// WithRequestID adds request ID to context
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, RequestIDKey, requestID)
}

// GetRequestID gets request ID from context
func GetRequestID(ctx context.Context) string {
	if requestID, ok := ctx.Value(RequestIDKey).(string); ok {
		return requestID
	}
	return ""
}

// WithUserID adds user ID to context
func WithUserID(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}

// GetUserID gets user ID from context
func GetUserID(ctx context.Context) (uuid.UUID, bool) {
	if userID, ok := ctx.Value(UserIDKey).(uuid.UUID); ok {
		return userID, true
	}
	return uuid.Nil, false
}

// WithTenantID adds tenant ID to context
func WithTenantID(ctx context.Context, tenantID uuid.UUID) context.Context {
	return context.WithValue(ctx, TenantIDKey, tenantID)
}

// GetTenantID gets tenant ID from context
func GetTenantID(ctx context.Context) (uuid.UUID, bool) {
	if tenantID, ok := ctx.Value(TenantIDKey).(uuid.UUID); ok {
		return tenantID, true
	}
	return uuid.Nil, false
}

// WithRoles adds roles to context
func WithRoles(ctx context.Context, roles []string) context.Context {
	return context.WithValue(ctx, RolesKey, roles)
}

// GetRoles gets roles from context
func GetRoles(ctx context.Context) []string {
	if roles, ok := ctx.Value(RolesKey).([]string); ok {
		return roles
	}
	return nil
}

// WithPermissions adds permissions to context
func WithPermissions(ctx context.Context, permissions []string) context.Context {
	return context.WithValue(ctx, PermissionsKey, permissions)
}

// GetPermissions gets permissions from context
func GetPermissions(ctx context.Context) []string {
	if permissions, ok := ctx.Value(PermissionsKey).([]string); ok {
		return permissions
	}
	return nil
}

// WithIPAddress adds IP address to context
func WithIPAddress(ctx context.Context, ip string) context.Context {
	return context.WithValue(ctx, IPAddressKey, ip)
}

// GetIPAddress gets IP address from context
func GetIPAddress(ctx context.Context) string {
	if ip, ok := ctx.Value(IPAddressKey).(string); ok {
		return ip
	}
	return ""
}

// WithUserAgent adds user agent to context
func WithUserAgent(ctx context.Context, userAgent string) context.Context {
	return context.WithValue(ctx, UserAgentKey, userAgent)
}

// GetUserAgent gets user agent from context
func GetUserAgent(ctx context.Context) string {
	if userAgent, ok := ctx.Value(UserAgentKey).(string); ok {
		return userAgent
	}
	return ""
}

// HasPermission checks if context has a specific permission
func HasPermission(ctx context.Context, permission string) bool {
	permissions := GetPermissions(ctx)
	for _, p := range permissions {
		if p == permission {
			return true
		}
	}
	return false
}

// HasRole checks if context has a specific role
func HasRole(ctx context.Context, role string) bool {
	roles := GetRoles(ctx)
	for _, r := range roles {
		if r == role {
			return true
		}
	}
	return false
}

// HasAnyRole checks if context has any of the specified roles
func HasAnyRole(ctx context.Context, rolesList ...string) bool {
	roles := GetRoles(ctx)
	for _, r := range roles {
		for _, checkRole := range rolesList {
			if r == checkRole {
				return true
			}
		}
	}
	return false
}

// HasAllRoles checks if context has all of the specified roles
func HasAllRoles(ctx context.Context, rolesList ...string) bool {
	roles := GetRoles(ctx)
	rolesMap := make(map[string]bool)
	for _, r := range roles {
		rolesMap[r] = true
	}
	
	for _, checkRole := range rolesList {
		if !rolesMap[checkRole] {
			return false
		}
	}
	return true
}

// IsAuthenticated checks if context has user ID (user is authenticated)
func IsAuthenticated(ctx context.Context) bool {
	_, ok := GetUserID(ctx)
	return ok
}

// GetUserContext returns all user-related context values
func GetUserContext(ctx context.Context) map[string]interface{} {
	result := make(map[string]interface{})
	
	if userID, ok := GetUserID(ctx); ok {
		result["user_id"] = userID
	}
	
	if tenantID, ok := GetTenantID(ctx); ok {
		result["tenant_id"] = tenantID
	}
	
	if roles := GetRoles(ctx); roles != nil {
		result["roles"] = roles
	}
	
	if permissions := GetPermissions(ctx); permissions != nil {
		result["permissions"] = permissions
	}
	
	if requestID := GetRequestID(ctx); requestID != "" {
		result["request_id"] = requestID
	}
	
	if ip := GetIPAddress(ctx); ip != "" {
		result["ip_address"] = ip
	}
	
	if ua := GetUserAgent(ctx); ua != "" {
		result["user_agent"] = ua
	}
	
	return result
}
