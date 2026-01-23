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

type SubscriptionOrderHandler struct {
	orderService *service.SubscriptionOrderService
	authzService *service.AuthorizationService
}

func NewSubscriptionOrderHandler(orderService *service.SubscriptionOrderService, authzService *service.AuthorizationService) *SubscriptionOrderHandler {
	return &SubscriptionOrderHandler{
		orderService: orderService,
		authzService: authzService,
	}
}

// List lists subscription orders
func (h *SubscriptionOrderHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	orderType := c.Query("type")

	orders, total, err := h.orderService.ListByTenant(ctx, tenantID, status, orderType, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, orders, total, page, limit)
}

// GetByID gets order by ID
func (h *SubscriptionOrderHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}

	order, err := h.orderService.GetByID(ctx, orderID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "order not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, order)
}

// GetByOrderNumber gets order by order number
func (h *SubscriptionOrderHandler) GetByOrderNumber(c *gin.Context) {
	ctx := c.Request.Context()

	orderNumber := c.Param("number")
	if orderNumber == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "order number required", nil)
		return
	}

	order, err := h.orderService.GetByOrderNumber(ctx, orderNumber)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "order not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, order)
}

// Create creates an order
func (h *SubscriptionOrderHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateSubscriptionOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	order, err := h.orderService.CreateOrder(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, order)
}

// Update updates an order
func (h *SubscriptionOrderHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}

	var req service.UpdateSubscriptionOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	order, err := h.orderService.UpdateOrder(ctx, orderID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, order)
}

// MarkAsPaid marks order as paid
func (h *SubscriptionOrderHandler) MarkAsPaid(c *gin.Context) {
	ctx := c.Request.Context()

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}

	var req struct {
		PaymentMethod string  `json:"payment_method" binding:"required"`
		PaymentRefID  *string `json:"payment_ref_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	order, err := h.orderService.MarkAsPaid(ctx, orderID, req.PaymentMethod, req.PaymentRefID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, order)
}

// Cancel cancels an order
func (h *SubscriptionOrderHandler) Cancel(c *gin.Context) {
	ctx := c.Request.Context()

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}

	order, err := h.orderService.CancelOrder(ctx, orderID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, order)
}

// Refund refunds an order
func (h *SubscriptionOrderHandler) Refund(c *gin.Context) {
	ctx := c.Request.Context()

	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}

	var req struct {
		RefundAmount *float64 `json:"refund_amount"`
		Reason       *string  `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	order, err := h.orderService.RefundOrder(ctx, orderID, req.RefundAmount, req.Reason)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, order)
}
