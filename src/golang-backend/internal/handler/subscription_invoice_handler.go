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

type SubscriptionInvoiceHandler struct {
	invoiceService *service.SubscriptionInvoiceService
	authzService   *service.AuthorizationService
}

func NewSubscriptionInvoiceHandler(invoiceService *service.SubscriptionInvoiceService, authzService *service.AuthorizationService) *SubscriptionInvoiceHandler {
	return &SubscriptionInvoiceHandler{
		invoiceService: invoiceService,
		authzService:   authzService,
	}
}

// List lists subscription invoices
func (h *SubscriptionInvoiceHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	invoices, total, err := h.invoiceService.ListByTenant(ctx, tenantID, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, invoices, total, page, limit)
}

// GetByID gets invoice by ID
func (h *SubscriptionInvoiceHandler) GetByID(c *gin.Context) {
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

// GetByInvoiceNumber gets invoice by invoice number
func (h *SubscriptionInvoiceHandler) GetByInvoiceNumber(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceNumber := c.Param("number")
	if invoiceNumber == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invoice number required", nil)
		return
	}

	invoice, err := h.invoiceService.GetByInvoiceNumber(ctx, invoiceNumber)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "invoice not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invoice)
}

// Create creates an invoice
func (h *SubscriptionInvoiceHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateSubscriptionInvoiceRequest
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
func (h *SubscriptionInvoiceHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	var req service.UpdateSubscriptionInvoiceRequest
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

// Finalize finalizes an invoice (DRAFT -> OPEN)
func (h *SubscriptionInvoiceHandler) Finalize(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	invoice, err := h.invoiceService.FinalizeInvoice(ctx, invoiceID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invoice)
}

// MarkAsPaid marks invoice as paid
func (h *SubscriptionInvoiceHandler) MarkAsPaid(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	var req struct {
		AmountPaid    float64  `json:"amount_paid" binding:"required"`
		PaymentMethod *string  `json:"payment_method"`
		PaymentRefID  *string  `json:"payment_ref_id"`
		PaidAt        *string  `json:"paid_at"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	invoice, err := h.invoiceService.MarkAsPaid(ctx, invoiceID, req.AmountPaid, req.PaidAt)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invoice)
}

// Void voids an invoice
func (h *SubscriptionInvoiceHandler) Void(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	invoice, err := h.invoiceService.VoidInvoice(ctx, invoiceID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invoice)
}

// GeneratePDF generates invoice PDF
func (h *SubscriptionInvoiceHandler) GeneratePDF(c *gin.Context) {
	ctx := c.Request.Context()

	invoiceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invoice id", nil)
		return
	}

	pdfURL, err := h.invoiceService.GeneratePDF(ctx, invoiceID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"pdf_url": pdfURL})
}
