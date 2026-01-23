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

type TenantDomainHandler struct {
	domainService *service.TenantDomainService
	authzService  *service.AuthorizationService
}

func NewTenantDomainHandler(domainService *service.TenantDomainService, authzService *service.AuthorizationService) *TenantDomainHandler {
	return &TenantDomainHandler{
		domainService: domainService,
		authzService:  authzService,
	}
}

// List lists tenant domains
func (h *TenantDomainHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	domains, total, err := h.domainService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, domains, total, page, limit)
}

// GetByID gets domain by ID
func (h *TenantDomainHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	domainID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid domain id", nil)
		return
	}

	domain, err := h.domainService.GetByID(ctx, domainID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "domain not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, domain)
}

// Create creates a tenant domain
func (h *TenantDomainHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTenantDomainRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	domain, err := h.domainService.CreateDomain(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, domain)
}

// Update updates a tenant domain
func (h *TenantDomainHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	domainID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid domain id", nil)
		return
	}

	var req service.UpdateTenantDomainRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	domain, err := h.domainService.UpdateDomain(ctx, domainID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, domain)
}

// Delete deletes a tenant domain
func (h *TenantDomainHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	domainID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid domain id", nil)
		return
	}

	if err := h.domainService.DeleteDomain(ctx, domainID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "domain deleted successfully"})
}

// Verify verifies domain ownership
func (h *TenantDomainHandler) Verify(c *gin.Context) {
	ctx := c.Request.Context()

	domainID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid domain id", nil)
		return
	}

	domain, err := h.domainService.VerifyDomain(ctx, domainID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, domain)
}

// GetVerificationInfo gets verification instructions
func (h *TenantDomainHandler) GetVerificationInfo(c *gin.Context) {
	ctx := c.Request.Context()

	domainID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid domain id", nil)
		return
	}

	info, err := h.domainService.GetVerificationInfo(ctx, domainID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, info)
}
