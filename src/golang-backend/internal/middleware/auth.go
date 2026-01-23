package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/vhv-platform/backend/internal/handler"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/pkg/auth"
)

// AuthMiddleware validates JWT token
type AuthMiddleware struct {
	jwtManager *auth.JWTManager
}

// NewAuthMiddleware creates a new auth middleware
func NewAuthMiddleware(jwtManager *auth.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{
		jwtManager: jwtManager,
	}
}

// Authenticate validates JWT token and sets user info in context
func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondUnauthorized(w, "Missing authorization header")
			return
		}

		// Check Bearer scheme
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			respondUnauthorized(w, "Invalid authorization header format")
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := m.jwtManager.ValidateToken(tokenString)
		if err != nil {
			respondUnauthorized(w, "Invalid or expired token")
			return
		}

		// Set user info in context
		ctx := r.Context()
		ctx = handler.SetUserIDInContext(ctx, claims.UserID)
		ctx = handler.SetUserEmailInContext(ctx, claims.Email)
		
		if claims.TenantID != nil {
			ctx = handler.SetTenantIDInContext(ctx, *claims.TenantID)
		}

		// Continue with updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Optional validates JWT token if present, but doesn't require it
func (m *AuthMiddleware) Optional(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			next.ServeHTTP(w, r)
			return
		}

		claims, err := m.jwtManager.ValidateToken(parts[1])
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}

		ctx := r.Context()
		ctx = handler.SetUserIDInContext(ctx, claims.UserID)
		ctx = handler.SetUserEmailInContext(ctx, claims.Email)
		
		if claims.TenantID != nil {
			ctx = handler.SetTenantIDInContext(ctx, *claims.TenantID)
		}

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole checks if user has required role
func (m *AuthMiddleware) RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get user roles from context (you need to implement this)
			// For now, just pass through
			next.ServeHTTP(w, r)
		})
	}
}

func respondUnauthorized(w http.ResponseWriter, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	
	response := models.NewErrorResponse("UNAUTHORIZED", message)
	// Simple JSON encoding
	w.Write([]byte(`{"success":false,"error":{"code":"UNAUTHORIZED","message":"` + message + `"}}`))
}

// ContextKey type for context keys
type ContextKey string

const (
	UserIDKey    ContextKey = "user_id"
	UserEmailKey ContextKey = "user_email"
	TenantIDKey  ContextKey = "tenant_id"
)

// WithValue adds a value to context
func WithValue(ctx context.Context, key ContextKey, value interface{}) context.Context {
	return context.WithValue(ctx, key, value)
}
