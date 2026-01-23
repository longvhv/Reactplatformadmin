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

type TenantRateLimitHandler struct {
	rateLimitService *service.TenantRateLimitService
	authzService     *service.AuthorizationService
}

func NewTenantRateLimitHandler(rateLimitService *service.TenantRateLimitService, authzService *service.AuthorizationService) *TenantRateLimitHandler {
	return &TenantRateLimitHandler{
		rateLimitService: rateLimitService,
		authzService:     authzService,
	}
}

// List lists rate limits
func (h *TenantRateLimitHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	resourceType := c.Query("resource_type")

	rateLimits, total, err := h.rateLimitService.ListByTenant(ctx, tenantID, resourceType, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, rateLimits, total, page, limit)
}

// GetByID gets rate limit by ID
func (h *TenantRateLimitHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	rateLimitID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid rate limit id", nil)
		return
	}

	rateLimit, err := h.rateLimitService.GetByID(ctx, rateLimitID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "rate limit not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, rateLimit)
}

// GetByKey gets rate limit by key
func (h *TenantRateLimitHandler) GetByKey(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	limitKey := c.Param("key")
	if limitKey == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "key required", nil)
		return
	}

	rateLimit, err := h.rateLimitService.GetByKey(ctx, tenantID, limitKey)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "rate limit not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, rateLimit)
}

// Create creates a rate limit
func (h *TenantRateLimitHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTenantRateLimitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	rateLimit, err := h.rateLimitService.CreateRateLimit(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, rateLimit)
}

// Update updates a rate limit
func (h *TenantRateLimitHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	rateLimitID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid rate limit id", nil)
		return
	}

	var req service.UpdateTenantRateLimitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	rateLimit, err := h.rateLimitService.UpdateRateLimit(ctx, rateLimitID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, rateLimit)
}

// Delete deletes a rate limit
func (h *TenantRateLimitHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	rateLimitID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid rate limit id", nil)
		return
	}

	if err := h.rateLimitService.DeleteRateLimit(ctx, rateLimitID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "rate limit deleted successfully"})
}

// CheckLimit checks if request is within rate limit
func (h *TenantRateLimitHandler) CheckLimit(c *gin.Context) {
	ctx := c.Request.Context()

	var req struct {
		TenantID uuid.UUID `json:"tenant_id" binding:"required"`
		LimitKey string    `json:"limit_key" binding:"required"`
		UserID   *uuid.UUID `json:"user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	allowed, remaining, resetAt, err := h.rateLimitService.CheckLimit(ctx, req.TenantID, req.LimitKey, req.UserID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	result := gin.H{
		"allowed":   allowed,
		"remaining": remaining,
		"reset_at":  resetAt,
	}

	if !allowed {
		httputil.ErrorResponse(c, http.StatusTooManyRequests, "rate limit exceeded", result)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, result)
}

// ResetUsage resets rate limit usage
func (h *TenantRateLimitHandler) ResetUsage(c *gin.Context) {
	ctx := c.Request.Context()

	rateLimitID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid rate limit id", nil)
		return
	}

	if err := h.rateLimitService.ResetUsage(ctx, rateLimitID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "usage reset successfully"})
}

// GetStats gets rate limit statistics
func (h *TenantRateLimitHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	rateLimitID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid rate limit id", nil)
		return
	}

	stats, err := h.rateLimitService.GetStats(ctx, rateLimitID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, stats)
}
