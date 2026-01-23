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

type ServiceAccountHandler struct {
	serviceAccountService *service.ServiceAccountService
	authzService          *service.AuthorizationService
}

func NewServiceAccountHandler(serviceAccountService *service.ServiceAccountService, authzService *service.AuthorizationService) *ServiceAccountHandler {
	return &ServiceAccountHandler{
		serviceAccountService: serviceAccountService,
		authzService:          authzService,
	}
}

// List lists service accounts
func (h *ServiceAccountHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	accounts, total, err := h.serviceAccountService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, accounts, total, page, limit)
}

// GetByID gets service account by ID
func (h *ServiceAccountHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid account id", nil)
		return
	}

	account, err := h.serviceAccountService.GetByID(ctx, accountID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "account not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, account)
}

// Create creates a service account
func (h *ServiceAccountHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateServiceAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	account, clientSecret, err := h.serviceAccountService.CreateAccount(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	// Return both account and secret (only shown once)
	httputil.SuccessResponse(c, http.StatusCreated, gin.H{
		"account":       account,
		"client_secret": clientSecret,
		"warning":       "Save the client secret securely. It will not be shown again.",
	})
}

// Update updates a service account
func (h *ServiceAccountHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid account id", nil)
		return
	}

	var req service.UpdateServiceAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	account, err := h.serviceAccountService.UpdateAccount(ctx, accountID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, account)
}

// Delete deletes a service account
func (h *ServiceAccountHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid account id", nil)
		return
	}

	if err := h.serviceAccountService.DeleteAccount(ctx, accountID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "account deleted successfully"})
}

// RegenerateSecret regenerates client secret
func (h *ServiceAccountHandler) RegenerateSecret(c *gin.Context) {
	ctx := c.Request.Context()

	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid account id", nil)
		return
	}

	account, newSecret, err := h.serviceAccountService.RegenerateSecret(ctx, accountID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"account":       account,
		"client_secret": newSecret,
		"warning":       "Save the new client secret securely. It will not be shown again.",
	})
}

// Toggle toggles service account active status
func (h *ServiceAccountHandler) Toggle(c *gin.Context) {
	ctx := c.Request.Context()

	accountID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid account id", nil)
		return
	}

	account, err := h.serviceAccountService.ToggleAccount(ctx, accountID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, account)
}
