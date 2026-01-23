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

type APIKeyHandler struct {
	apiKeyService *service.APIKeyService
	authzService  *service.AuthorizationService
}

func NewAPIKeyHandler(apiKeyService *service.APIKeyService, authzService *service.AuthorizationService) *APIKeyHandler {
	return &APIKeyHandler{
		apiKeyService: apiKeyService,
		authzService:  authzService,
	}
}

// List lists API keys
func (h *APIKeyHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	keys, total, err := h.apiKeyService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, keys, total, page, limit)
}

// GetByID gets API key by ID
func (h *APIKeyHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid key id", nil)
		return
	}

	key, err := h.apiKeyService.GetByID(ctx, keyID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "API key not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, key)
}

// Create creates an API key
func (h *APIKeyHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	key, plainKey, err := h.apiKeyService.CreateAPIKey(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, gin.H{
		"api_key":   key,
		"plain_key": plainKey,
		"warning":   "Please save this key, it will not be shown again",
	})
}

// Update updates an API key
func (h *APIKeyHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid key id", nil)
		return
	}

	var req service.UpdateAPIKeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	key, err := h.apiKeyService.UpdateAPIKey(ctx, keyID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, key)
}

// Delete deletes an API key
func (h *APIKeyHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid key id", nil)
		return
	}

	if err := h.apiKeyService.DeleteAPIKey(ctx, keyID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "API key deleted successfully"})
}

// Revoke revokes an API key
func (h *APIKeyHandler) Revoke(c *gin.Context) {
	ctx := c.Request.Context()

	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid key id", nil)
		return
	}

	key, err := h.apiKeyService.RevokeAPIKey(ctx, keyID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, key)
}

// Rotate rotates an API key
func (h *APIKeyHandler) Rotate(c *gin.Context) {
	ctx := c.Request.Context()

	keyID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid key id", nil)
		return
	}

	key, plainKey, err := h.apiKeyService.RotateAPIKey(ctx, keyID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"api_key":   key,
		"plain_key": plainKey,
		"warning":   "Please save this new key, it will not be shown again",
	})
}
