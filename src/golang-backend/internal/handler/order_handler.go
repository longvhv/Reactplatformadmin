package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

type OrderHandler struct {
	service *service.OrderService
}

func NewOrderHandler(service *service.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

func (h *OrderHandler) GetAll(c *gin.Context) {
	filters := models.OrderFilters{}

	if tenantID := c.Query("tenant_id"); tenantID != "" {
		filters.TenantID = &tenantID
	}

	if createdBy := c.Query("created_by"); createdBy != "" {
		filters.CreatedBy = &createdBy
	}

	if typeStr := c.Query("type"); typeStr != "" {
		orderType := models.OrderType(typeStr)
		filters.Type = &orderType
	}

	if statusStr := c.Query("status"); statusStr != "" {
		status := models.OrderStatus(statusStr)
		filters.Status = &status
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	if startDate := c.Query("start_date"); startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			filters.StartDate = &t
		}
	}

	if endDate := c.Query("end_date"); endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			filters.EndDate = &t
		}
	}

	orders, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, orders)
}

func (h *OrderHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	order, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "order not found" || err.Error() == "invalid order ID format" {
			utils.NotFoundResponse(c, "Order")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, order)
}

func (h *OrderHandler) GetByOrderNumber(c *gin.Context) {
	orderNumber := c.Param("number")

	order, err := h.service.GetByOrderNumber(c.Request.Context(), orderNumber)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	if order == nil {
		utils.NotFoundResponse(c, "Order")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, order)
}

func (h *OrderHandler) Create(c *gin.Context) {
	var req models.CreateOrderRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	order, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "order number already exists" {
			utils.ErrorResponse(c, http.StatusConflict, "ORDER_EXISTS", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, order)
}

func (h *OrderHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	order, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "order not found" || err.Error() == "invalid order ID format" {
			utils.NotFoundResponse(c, "Order")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, order)
}

func (h *OrderHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "order not found" || err.Error() == "invalid order ID format" {
			utils.NotFoundResponse(c, "Order")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}
