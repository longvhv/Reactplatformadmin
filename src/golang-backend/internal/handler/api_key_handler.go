package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type APIKeyHandler struct {
	service *service.APIKeyService
}

func NewAPIKeyHandler(service *service.APIKeyService) *APIKeyHandler {
	return &APIKeyHandler{service: service}
}

// CreateAPIKey creates a new API key
// @Router /api/v1/api-keys [post]
func (h *APIKeyHandler) CreateAPIKey(c *gin.Context) {
	var req models.CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKeyResponse, err := h.service.CreateAPIKey(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, apiKeyResponse)
}

// GetAPIKey retrieves an API key by ID
// @Router /api/v1/api-keys/:id [get]
func (h *APIKeyHandler) GetAPIKey(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid API key ID"})
		return
	}

	apiKey, err := h.service.GetAPIKey(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, apiKey)
}

// ListAPIKeys retrieves API keys with pagination and filters
// @Router /api/v1/api-keys [get]
func (h *APIKeyHandler) ListAPIKeys(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	filters := make(map[string]interface{})
	if tenantID := c.Query("tenant_id"); tenantID != "" {
		filters["tenant_id"] = tenantID
	}
	if name := c.Query("name"); name != "" {
		filters["name"] = name
	}
	if isExpired := c.Query("is_expired"); isExpired == "true" {
		filters["is_expired"] = true
	} else if isExpired == "false" {
		filters["is_expired"] = false
	}

	apiKeys, total, err := h.service.ListAPIKeys(page, pageSize, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      apiKeys,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// UpdateAPIKey updates an API key
// @Router /api/v1/api-keys/:id [put]
func (h *APIKeyHandler) UpdateAPIKey(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid API key ID"})
		return
	}

	var req models.UpdateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey, err := h.service.UpdateAPIKey(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, apiKey)
}

// DeleteAPIKey deletes an API key
// @Router /api/v1/api-keys/:id [delete]
func (h *APIKeyHandler) DeleteAPIKey(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid API key ID"})
		return
	}

	if err := h.service.DeleteAPIKey(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key deleted successfully"})
}

// RevokeAPIKey revokes an API key
// @Router /api/v1/api-keys/:id/revoke [post]
func (h *APIKeyHandler) RevokeAPIKey(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid API key ID"})
		return
	}

	if err := h.service.RevokeAPIKey(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "API key revoked successfully"})
}

// ValidateAPIKey validates an API key
// @Router /api/v1/api-keys/validate [post]
func (h *APIKeyHandler) ValidateAPIKey(c *gin.Context) {
	var req struct {
		APIKey string `json:"api_key" validate:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	apiKey, err := h.service.ValidateAPIKey(req.APIKey, ipAddress)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":     true,
		"tenant_id": apiKey.TenantID,
		"scopes":    apiKey.Scopes,
	})
}

// ListAPIKeysByTenant retrieves all API keys for a specific tenant
// @Router /api/v1/tenants/:tenant_id/api-keys [get]
func (h *APIKeyHandler) ListAPIKeysByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	apiKeys, total, err := h.service.ListAPIKeysByTenant(tenantID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      apiKeys,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// RegisterRoutes registers all API key routes
func (h *APIKeyHandler) RegisterRoutes(router *gin.RouterGroup) {
	apiKeys := router.Group("/api-keys")
	{
		apiKeys.POST("", h.CreateAPIKey)
		apiKeys.GET("", h.ListAPIKeys)
		apiKeys.GET("/:id", h.GetAPIKey)
		apiKeys.PUT("/:id", h.UpdateAPIKey)
		apiKeys.DELETE("/:id", h.DeleteAPIKey)
		apiKeys.POST("/:id/revoke", h.RevokeAPIKey)
		apiKeys.POST("/validate", h.ValidateAPIKey)
	}

	tenants := router.Group("/tenants/:tenant_id")
	{
		tenants.GET("/api-keys", h.ListAPIKeysByTenant)
	}
}
