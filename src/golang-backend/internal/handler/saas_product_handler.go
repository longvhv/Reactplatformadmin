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

type SaaSProductHandler struct {
	productService *service.SaaSProductService
	authzService   *service.AuthorizationService
}

func NewSaaSProductHandler(productService *service.SaaSProductService, authzService *service.AuthorizationService) *SaaSProductHandler {
	return &SaaSProductHandler{
		productService: productService,
		authzService:   authzService,
	}
}

// List lists SaaS products
func (h *SaaSProductHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	isFeatured := c.Query("is_featured") == "true"

	products, total, err := h.productService.ListByTenant(ctx, tenantID, status, isFeatured, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, products, total, page, limit)
}

// GetPublic gets public products for catalog
func (h *SaaSProductHandler) GetPublic(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	products, err := h.productService.GetPublicProducts(ctx, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, products)
}

// GetByID gets product by ID
func (h *SaaSProductHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid product id", nil)
		return
	}

	product, err := h.productService.GetByID(ctx, productID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "product not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, product)
}

// GetByCode gets product by code
func (h *SaaSProductHandler) GetByCode(c *gin.Context) {
	ctx := c.Request.Context()

	code := c.Param("code")
	if code == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "code required", nil)
		return
	}

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	product, err := h.productService.GetByCode(ctx, tenantID, code)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "product not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, product)
}

// Create creates a SaaS product
func (h *SaaSProductHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateSaaSProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	product, err := h.productService.CreateProduct(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, product)
}

// Update updates a SaaS product
func (h *SaaSProductHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid product id", nil)
		return
	}

	var req service.UpdateSaaSProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	product, err := h.productService.UpdateProduct(ctx, productID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, product)
}

// Delete deletes a SaaS product
func (h *SaaSProductHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid product id", nil)
		return
	}

	if err := h.productService.DeleteProduct(ctx, productID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "product deleted successfully"})
}
