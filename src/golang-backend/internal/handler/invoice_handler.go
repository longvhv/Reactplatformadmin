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

type InvoiceHandler struct {
	invoiceService *service.InvoiceService
	authzService   *service.AuthorizationService
}

func NewInvoiceHandler(invoiceService *service.InvoiceService, authzService *service.AuthorizationService) *InvoiceHandler {
	return &InvoiceHandler{
		invoiceService: invoiceService,
		authzService:   authzService,
	}
}

// List lists invoices
func (h *InvoiceHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	invoices, total, err := h.invoiceService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, invoices, total, page, limit)
}

// GetByID gets invoice by ID
func (h *InvoiceHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	invoice, err := h.invoiceService.GetByID(ctx, invoiceID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "invoice not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invoice)
}

// Create creates an invoice
func (h *InvoiceHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	invoice, err := h.invoiceService.CreateInvoice(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, invoice)
}

// Update updates an invoice
func (h *InvoiceHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	var req service.UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	invoice, err := h.invoiceService.UpdateInvoice(ctx, invoiceID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invoice)
}

// Delete deletes an invoice
func (h *InvoiceHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	if err := h.invoiceService.DeleteInvoice(ctx, invoiceID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "invoice deleted successfully"})
}

// Pay marks invoice as paid
func (h *InvoiceHandler) Pay(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	var req struct {
		PaymentMethod string `json:"payment_method"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	invoice, err := h.invoiceService.PayInvoice(ctx, invoiceID, req.PaymentMethod)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invoice)
}
