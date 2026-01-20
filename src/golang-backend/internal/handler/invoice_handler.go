package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

type InvoiceHandler struct {
	service *service.InvoiceService
}

func NewInvoiceHandler(service *service.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{service: service}
}

func (h *InvoiceHandler) GetAll(c *gin.Context) {
	filters := models.InvoiceFilters{}

	if tenantID := c.Query("tenant_id"); tenantID != "" {
		filters.TenantID = &tenantID
	}

	if subID := c.Query("subscription_id"); subID != "" {
		filters.SubscriptionID = &subID
	}

	if orderID := c.Query("order_id"); orderID != "" {
		filters.OrderID = &orderID
	}

	if statusStr := c.Query("status"); statusStr != "" {
		status := models.InvoiceStatus(statusStr)
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

	if overdueStr := c.Query("overdue"); overdueStr != "" {
		overdue := overdueStr == "true"
		filters.Overdue = &overdue
	}

	invoices, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, invoices)
}

func (h *InvoiceHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	invoice, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "invoice not found" || err.Error() == "invalid invoice ID format" {
			utils.NotFoundResponse(c, "Invoice")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, invoice)
}

func (h *InvoiceHandler) GetByInvoiceNumber(c *gin.Context) {
	invoiceNumber := c.Param("number")

	invoice, err := h.service.GetByInvoiceNumber(c.Request.Context(), invoiceNumber)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	if invoice == nil {
		utils.NotFoundResponse(c, "Invoice")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, invoice)
}

func (h *InvoiceHandler) Create(c *gin.Context) {
	var req models.CreateInvoiceRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	invoice, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "invoice number already exists" {
			utils.ErrorResponse(c, http.StatusConflict, "INVOICE_EXISTS", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, invoice)
}

func (h *InvoiceHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	invoice, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "invoice not found" || err.Error() == "invalid invoice ID format" {
			utils.NotFoundResponse(c, "Invoice")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, invoice)
}

func (h *InvoiceHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "invoice not found" || err.Error() == "invalid invoice ID format" {
			utils.NotFoundResponse(c, "Invoice")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}
