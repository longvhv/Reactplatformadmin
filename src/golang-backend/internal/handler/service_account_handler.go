package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/service"
)

// ServiceAccountHandler handles HTTP requests for service accounts
type ServiceAccountHandler struct {
	service service.ServiceAccountService
}

// NewServiceAccountHandler creates a new service account handler
func NewServiceAccountHandler(service service.ServiceAccountService) *ServiceAccountHandler {
	return &ServiceAccountHandler{service: service}
}

// CreateServiceAccount creates a new service account
// @Summary Create service account
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param request body models.CreateServiceAccountRequest true "Service account details"
// @Success 201 {object} models.ServiceAccountResponse
// @Router /api/v1/service-accounts [post]
func (h *ServiceAccountHandler) CreateServiceAccount(c *gin.Context) {
	var req models.CreateServiceAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account, err := h.service.CreateServiceAccount(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, account)
}

// ListServiceAccounts lists service accounts with pagination and filters
// @Summary List service accounts
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Param tenant_id query string false "Filter by tenant ID"
// @Param is_active query boolean false "Filter by active status"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/service-accounts [get]
func (h *ServiceAccountHandler) ListServiceAccounts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	var tenantID *uuid.UUID
	if tenantIDStr := c.Query("tenant_id"); tenantIDStr != "" {
		parsed, err := uuid.Parse(tenantIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant_id format"})
			return
		}
		tenantID = &parsed
	}

	var isActive *bool
	if isActiveStr := c.Query("is_active"); isActiveStr != "" {
		val, err := strconv.ParseBool(isActiveStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid is_active format"})
			return
		}
		isActive = &val
	}

	accounts, total, err := h.service.ListServiceAccounts(c.Request.Context(), page, pageSize, tenantID, isActive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      accounts,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetServiceAccount gets a service account by ID
// @Summary Get service account
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param id path string true "Service Account ID"
// @Success 200 {object} models.ServiceAccount
// @Router /api/v1/service-accounts/{id} [get]
func (h *ServiceAccountHandler) GetServiceAccount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service account ID"})
		return
	}

	account, err := h.service.GetServiceAccount(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// GetServiceAccountByClientID gets a service account by client ID
// @Summary Get service account by client ID
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param client_id path string true "Client ID"
// @Success 200 {object} models.ServiceAccount
// @Router /api/v1/service-accounts/by-client-id/{client_id} [get]
func (h *ServiceAccountHandler) GetServiceAccountByClientID(c *gin.Context) {
	clientID := c.Param("client_id")

	account, err := h.service.GetServiceAccountByClientID(c.Request.Context(), clientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// UpdateServiceAccount updates a service account
// @Summary Update service account
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param id path string true "Service Account ID"
// @Param request body models.UpdateServiceAccountRequest true "Update details"
// @Success 200 {object} models.ServiceAccount
// @Router /api/v1/service-accounts/{id} [put]
func (h *ServiceAccountHandler) UpdateServiceAccount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service account ID"})
		return
	}

	var req models.UpdateServiceAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account, err := h.service.UpdateServiceAccount(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// DeleteServiceAccount deletes a service account
// @Summary Delete service account
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param id path string true "Service Account ID"
// @Success 204
// @Router /api/v1/service-accounts/{id} [delete]
func (h *ServiceAccountHandler) DeleteServiceAccount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service account ID"})
		return
	}

	if err := h.service.DeleteServiceAccount(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// ActivateServiceAccount activates a service account
// @Summary Activate service account
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param id path string true "Service Account ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/service-accounts/{id}/activate [post]
func (h *ServiceAccountHandler) ActivateServiceAccount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service account ID"})
		return
	}

	if err := h.service.ActivateServiceAccount(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "service account activated successfully"})
}

// DeactivateServiceAccount deactivates a service account
// @Summary Deactivate service account
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param id path string true "Service Account ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/service-accounts/{id}/deactivate [post]
func (h *ServiceAccountHandler) DeactivateServiceAccount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service account ID"})
		return
	}

	if err := h.service.DeactivateServiceAccount(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "service account deactivated successfully"})
}

// ValidateCredentials validates service account credentials
// @Summary Validate credentials
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param request body map[string]string true "Credentials"
// @Success 200 {object} models.ServiceAccount
// @Router /api/v1/service-accounts/validate [post]
func (h *ServiceAccountHandler) ValidateCredentials(c *gin.Context) {
	var req struct {
		ClientID     string `json:"client_id" binding:"required"`
		ClientSecret string `json:"client_secret" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account, err := h.service.ValidateCredentials(c.Request.Context(), req.ClientID, req.ClientSecret)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, account)
}

// RegenerateClientSecret regenerates the client secret for a service account
// @Summary Regenerate client secret
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param id path string true "Service Account ID"
// @Success 200 {object} models.ServiceAccountResponse
// @Router /api/v1/service-accounts/{id}/regenerate-secret [post]
func (h *ServiceAccountHandler) RegenerateClientSecret(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service account ID"})
		return
	}

	account, err := h.service.RegenerateClientSecret(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

// ListServiceAccountsByTenant lists service accounts for a specific tenant
// @Summary List tenant service accounts
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param tenant_id path string true "Tenant ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/tenants/{tenant_id}/service-accounts [get]
func (h *ServiceAccountHandler) ListServiceAccountsByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	accounts, total, err := h.service.ListServiceAccountsByTenant(c.Request.Context(), tenantID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      accounts,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// ListServiceAccountsByMember lists service accounts for a specific member
// @Summary List member service accounts
// @Tags service-accounts
// @Accept json
// @Produce json
// @Param member_id path string true "Member ID"
// @Success 200 {object} map[string]interface{}
// @Router /api/v1/members/{member_id}/service-accounts [get]
func (h *ServiceAccountHandler) ListServiceAccountsByMember(c *gin.Context) {
	memberID, err := uuid.Parse(c.Param("member_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	accounts, err := h.service.ListServiceAccountsByMember(c.Request.Context(), memberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": accounts})
}

// RegisterServiceAccountRoutes registers service account routes
func RegisterServiceAccountRoutes(router *gin.Engine, handler *ServiceAccountHandler) {
	api := router.Group("/api/v1")
	{
		// Service account routes
		api.POST("/service-accounts", handler.CreateServiceAccount)
		api.GET("/service-accounts", handler.ListServiceAccounts)
		api.GET("/service-accounts/:id", handler.GetServiceAccount)
		api.GET("/service-accounts/by-client-id/:client_id", handler.GetServiceAccountByClientID)
		api.PUT("/service-accounts/:id", handler.UpdateServiceAccount)
		api.DELETE("/service-accounts/:id", handler.DeleteServiceAccount)
		api.POST("/service-accounts/:id/activate", handler.ActivateServiceAccount)
		api.POST("/service-accounts/:id/deactivate", handler.DeactivateServiceAccount)
		api.POST("/service-accounts/validate", handler.ValidateCredentials)
		api.POST("/service-accounts/:id/regenerate-secret", handler.RegenerateClientSecret)

		// Tenant-specific routes
		api.GET("/tenants/:tenant_id/service-accounts", handler.ListServiceAccountsByTenant)

		// Member-specific routes
		api.GET("/members/:member_id/service-accounts", handler.ListServiceAccountsByMember)
	}
}
