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

type TenantSubscriptionHandler struct {
	subscriptionService *service.TenantSubscriptionService
	authzService        *service.AuthorizationService
}

func NewTenantSubscriptionHandler(subscriptionService *service.TenantSubscriptionService, authzService *service.AuthorizationService) *TenantSubscriptionHandler {
	return &TenantSubscriptionHandler{
		subscriptionService: subscriptionService,
		authzService:        authzService,
	}
}

// List lists tenant subscriptions
func (h *TenantSubscriptionHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	subscriptions, total, err := h.subscriptionService.ListByTenant(ctx, tenantID, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, subscriptions, total, page, limit)
}

// GetActive gets active subscription
func (h *TenantSubscriptionHandler) GetActive(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	subscription, err := h.subscriptionService.GetActiveSubscription(ctx, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "no active subscription found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, subscription)
}

// GetByID gets subscription by ID
func (h *TenantSubscriptionHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid subscription id", nil)
		return
	}

	subscription, err := h.subscriptionService.GetByID(ctx, subscriptionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "subscription not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, subscription)
}

// Create creates a subscription
func (h *TenantSubscriptionHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTenantSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	subscription, err := h.subscriptionService.CreateSubscription(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, subscription)
}

// Update updates a subscription
func (h *TenantSubscriptionHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid subscription id", nil)
		return
	}

	var req service.UpdateTenantSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	subscription, err := h.subscriptionService.UpdateSubscription(ctx, subscriptionID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, subscription)
}

// Cancel cancels a subscription
func (h *TenantSubscriptionHandler) Cancel(c *gin.Context) {
	ctx := c.Request.Context()

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid subscription id", nil)
		return
	}

	subscription, err := h.subscriptionService.CancelSubscription(ctx, subscriptionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, subscription)
}

// Renew renews a subscription
func (h *TenantSubscriptionHandler) Renew(c *gin.Context) {
	ctx := c.Request.Context()

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid subscription id", nil)
		return
	}

	subscription, err := h.subscriptionService.RenewSubscription(ctx, subscriptionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, subscription)
}

// Suspend suspends a subscription
func (h *TenantSubscriptionHandler) Suspend(c *gin.Context) {
	ctx := c.Request.Context()

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid subscription id", nil)
		return
	}

	subscription, err := h.subscriptionService.SuspendSubscription(ctx, subscriptionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, subscription)
}

// Reactivate reactivates a subscription
func (h *TenantSubscriptionHandler) Reactivate(c *gin.Context) {
	ctx := c.Request.Context()

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid subscription id", nil)
		return
	}

	subscription, err := h.subscriptionService.ReactivateSubscription(ctx, subscriptionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, subscription)
}

// UpdateUsage updates subscription usage
func (h *TenantSubscriptionHandler) UpdateUsage(c *gin.Context) {
	ctx := c.Request.Context()

	subscriptionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid subscription id", nil)
		return
	}

	var req struct {
		CurrentUsers     *int     `json:"current_users"`
		CurrentStorageGB *float64 `json:"current_storage_gb"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	subscription, err := h.subscriptionService.UpdateUsage(ctx, subscriptionID, req.CurrentUsers, req.CurrentStorageGB)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, subscription)
}
