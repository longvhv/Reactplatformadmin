package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/contextutil"
	"github.com/vhv-platform/backend/pkg/httputil"
)

type IntegrationHandler struct {
	integrationService *service.IntegrationService
	authzService       *service.AuthorizationService
}

func NewIntegrationHandler(integrationService *service.IntegrationService, authzService *service.AuthorizationService) *IntegrationHandler {
	return &IntegrationHandler{
		integrationService: integrationService,
		authzService:       authzService,
	}
}

// List lists integrations
func (h *IntegrationHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	provider := c.Query("provider")
	status := c.Query("status")

	integrations, total, err := h.integrationService.ListByTenant(ctx, tenantID, provider, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, integrations, total, page, limit)
}

// GetByID gets integration by ID
func (h *IntegrationHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	integration, err := h.integrationService.GetByID(ctx, integrationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "integration not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, integration)
}

// Create creates an integration
func (h *IntegrationHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateIntegrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	integration, err := h.integrationService.CreateIntegration(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, integration)
}

// Update updates an integration
func (h *IntegrationHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	var req service.UpdateIntegrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	integration, err := h.integrationService.UpdateIntegration(ctx, integrationID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, integration)
}

// Delete deletes an integration
func (h *IntegrationHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	if err := h.integrationService.DeleteIntegration(ctx, integrationID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "integration deleted successfully"})
}

// Enable enables an integration
func (h *IntegrationHandler) Enable(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	integration, err := h.integrationService.EnableIntegration(ctx, integrationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, integration)
}

// Disable disables an integration
func (h *IntegrationHandler) Disable(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	integration, err := h.integrationService.DisableIntegration(ctx, integrationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, integration)
}

// TestConnection tests integration connection
func (h *IntegrationHandler) TestConnection(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	result, err := h.integrationService.TestConnection(ctx, integrationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, result)
}

// Sync syncs integration data
func (h *IntegrationHandler) Sync(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	result, err := h.integrationService.SyncData(ctx, integrationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, result)
}

// RefreshToken refreshes OAuth token
func (h *IntegrationHandler) RefreshToken(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	integration, err := h.integrationService.RefreshToken(ctx, integrationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, integration)
}

// GetLogs gets integration logs
func (h *IntegrationHandler) GetLogs(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	logs, total, err := h.integrationService.GetLogs(ctx, integrationID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, logs, total, page, limit)
}

// GetStats gets integration statistics
func (h *IntegrationHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	integrationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid integration id", nil)
		return
	}

	stats, err := h.integrationService.GetStats(ctx, integrationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, stats)
}
