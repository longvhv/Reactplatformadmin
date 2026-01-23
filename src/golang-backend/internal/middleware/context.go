package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/pkg/contextutil"
)

// ExtractTenantID extracts tenant_id from request and adds to context
func ExtractTenantID() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to get tenant_id from header
		tenantIDStr := c.GetHeader("X-Tenant-ID")
		
		// If not in header, try query param
		if tenantIDStr == "" {
			tenantIDStr = c.Query("tenant_id")
		}
		
		// If not in query, try path param
		if tenantIDStr == "" {
			tenantIDStr = c.Param("tenant_id")
		}
		
		// Parse and add to context if valid
		if tenantIDStr != "" {
			tenantID, err := uuid.Parse(tenantIDStr)
			if err == nil {
				ctx := contextutil.WithTenantID(c.Request.Context(), tenantID)
				c.Request = c.Request.WithContext(ctx)
			}
		}
		
		c.Next()
	}
}

// ExtractRequestID extracts or generates request ID
func ExtractRequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to get from header
		requestID := c.GetHeader("X-Request-ID")
		
		// Generate if not present
		if requestID == "" {
			requestID = uuid.New().String()
		}
		
		// Add to context
		ctx := contextutil.WithRequestID(c.Request.Context(), requestID)
		c.Request = c.Request.WithContext(ctx)
		
		// Also set in response header
		c.Header("X-Request-ID", requestID)
		
		c.Next()
	}
}

// ExtractIPAddress extracts IP address from request
func ExtractIPAddress() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		ctx := contextutil.WithIPAddress(c.Request.Context(), ip)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// ExtractUserAgent extracts user agent from request
func ExtractUserAgent() gin.HandlerFunc {
	return func(c *gin.Context) {
		userAgent := c.GetHeader("User-Agent")
		ctx := contextutil.WithUserAgent(c.Request.Context(), userAgent)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}

// ContextMiddleware combines all context extraction middleware
func ContextMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		
		// Request ID
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		ctx = contextutil.WithRequestID(ctx, requestID)
		c.Header("X-Request-ID", requestID)
		
		// Tenant ID
		tenantIDStr := c.GetHeader("X-Tenant-ID")
		if tenantIDStr == "" {
			tenantIDStr = c.Query("tenant_id")
		}
		if tenantIDStr != "" {
			if tenantID, err := uuid.Parse(tenantIDStr); err == nil {
				ctx = contextutil.WithTenantID(ctx, tenantID)
			}
		}
		
		// IP Address
		ip := c.ClientIP()
		ctx = contextutil.WithIPAddress(ctx, ip)
		
		// User Agent
		userAgent := c.GetHeader("User-Agent")
		ctx = contextutil.WithUserAgent(ctx, userAgent)
		
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
