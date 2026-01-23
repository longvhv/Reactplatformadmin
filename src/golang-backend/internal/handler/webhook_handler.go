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

type WebhookHandler struct {
	webhookService *service.WebhookService
	authzService   *service.AuthorizationService
}

func NewWebhookHandler(webhookService *service.WebhookService, authzService *service.AuthorizationService) *WebhookHandler {
	return &WebhookHandler{
		webhookService: webhookService,
		authzService:   authzService,
	}
}

// List lists webhooks
func (h *WebhookHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	eventType := c.Query("event_type")

	webhooks, total, err := h.webhookService.ListByTenant(ctx, tenantID, eventType, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, webhooks, total, page, limit)
}

// GetByID gets webhook by ID
func (h *WebhookHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid webhook id", nil)
		return
	}

	webhook, err := h.webhookService.GetByID(ctx, webhookID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "webhook not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, webhook)
}

// Create creates a webhook
func (h *WebhookHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	webhook, err := h.webhookService.CreateWebhook(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, webhook)
}

// Update updates a webhook
func (h *WebhookHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid webhook id", nil)
		return
	}

	var req service.UpdateWebhookRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	webhook, err := h.webhookService.UpdateWebhook(ctx, webhookID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, webhook)
}

// Delete deletes a webhook
func (h *WebhookHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid webhook id", nil)
		return
	}

	if err := h.webhookService.DeleteWebhook(ctx, webhookID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "webhook deleted successfully"})
}

// Test tests a webhook
func (h *WebhookHandler) Test(c *gin.Context) {
	ctx := c.Request.Context()

	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid webhook id", nil)
		return
	}

	var req struct {
		Payload map[string]interface{} `json:"payload"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	result, err := h.webhookService.TestWebhook(ctx, webhookID, req.Payload)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, result)
}

// Verify verifies a webhook
func (h *WebhookHandler) Verify(c *gin.Context) {
	ctx := c.Request.Context()

	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid webhook id", nil)
		return
	}

	webhook, err := h.webhookService.VerifyWebhook(ctx, webhookID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, webhook)
}

// Enable enables a webhook
func (h *WebhookHandler) Enable(c *gin.Context) {
	ctx := c.Request.Context()

	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid webhook id", nil)
		return
	}

	webhook, err := h.webhookService.EnableWebhook(ctx, webhookID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, webhook)
}

// Disable disables a webhook
func (h *WebhookHandler) Disable(c *gin.Context) {
	ctx := c.Request.Context()

	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid webhook id", nil)
		return
	}

	webhook, err := h.webhookService.DisableWebhook(ctx, webhookID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, webhook)
}

// GetDeliveries gets webhook deliveries
func (h *WebhookHandler) GetDeliveries(c *gin.Context) {
	ctx := c.Request.Context()

	webhookID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid webhook id", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	deliveries, total, err := h.webhookService.GetDeliveries(ctx, webhookID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, deliveries, total, page, limit)
}
