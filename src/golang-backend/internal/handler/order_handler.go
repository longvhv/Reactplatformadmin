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

type OrderHandler struct {
	orderService *service.OrderService
	authzService *service.AuthorizationService
}

func NewOrderHandler(orderService *service.OrderService, authzService *service.AuthorizationService) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
		authzService: authzService,
	}
}

// List lists orders
func (h *OrderHandler) List(c *gin.Context) {
	ctx := c.Request.Context()
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}
	
	orders, total, err := h.orderService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.PaginatedResponse(c, http.StatusOK, orders, total, page, limit)
}

// GetByID gets order by ID
func (h *OrderHandler) GetByID(c *gin.Context) {
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

// Create creates an order
func (h *OrderHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()
	
	var req service.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	order, err := h.orderService.CreateOrder(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusCreated, order)
}

// Update updates an order
func (h *OrderHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()
	
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}
	
	var req service.UpdateOrderRequest
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

// Delete deletes an order
func (h *OrderHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()
	
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}
	
	if err := h.orderService.DeleteOrder(ctx, orderID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "order deleted successfully"})
}

// Cancel cancels an order
func (h *OrderHandler) Cancel(c *gin.Context) {
	ctx := c.Request.Context()
	
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}
	
	var req struct {
		Reason string `json:"reason"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	order, err := h.orderService.CancelOrder(ctx, orderID, req.Reason)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, order)
}

// Complete completes an order
func (h *OrderHandler) Complete(c *gin.Context) {
	ctx := c.Request.Context()
	
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid order id", nil)
		return
	}
	
	order, err := h.orderService.CompleteOrder(ctx, orderID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, order)
}
