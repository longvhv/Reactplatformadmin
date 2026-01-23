package handler

import (
	"context"

	"github.com/google/uuid"
)

// Context keys
type contextKey string

const (
	userIDKey    contextKey = "user_id"
	userEmailKey contextKey = "user_email"
	tenantIDKey  contextKey = "tenant_id"
)

// SetUserIDInContext sets user ID in context
func SetUserIDInContext(ctx context.Context, userID uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// GetUserIDFromContext gets user ID from context
func GetUserIDFromContext(ctx context.Context) *uuid.UUID {
	if userID, ok := ctx.Value(userIDKey).(uuid.UUID); ok {
		return &userID
	}
	return nil
}

// SetUserEmailInContext sets user email in context
func SetUserEmailInContext(ctx context.Context, email string) context.Context {
	return context.WithValue(ctx, userEmailKey, email)
}

// GetUserEmailFromContext gets user email from context
func GetUserEmailFromContext(ctx context.Context) *string {
	if email, ok := ctx.Value(userEmailKey).(string); ok {
		return &email
	}
	return nil
}

// SetTenantIDInContext sets tenant ID in context
func SetTenantIDInContext(ctx context.Context, tenantID uuid.UUID) context.Context {
	return context.WithValue(ctx, tenantIDKey, tenantID)
}

// GetTenantIDFromContext gets tenant ID from context
func GetTenantIDFromContext(ctx context.Context) *uuid.UUID {
	if tenantID, ok := ctx.Value(tenantIDKey).(uuid.UUID); ok {
		return &tenantID
	}
	return nil
}
