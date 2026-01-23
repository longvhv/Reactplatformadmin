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

type ProductHandler struct {
	productService *service.ProductService
	authzService   *service.AuthorizationService
}

func NewProductHandler(productService *service.ProductService, authzService *service.AuthorizationService) *ProductHandler {
	return &ProductHandler{
		productService: productService,
		authzService:   authzService,
	}
}

// List lists products
func (h *ProductHandler) List(c *gin.Context) {
	ctx := c.Request.Context()
	
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}
	
	products, total, err := h.productService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.PaginatedResponse(c, http.StatusOK, products, total, page, limit)
}

// GetByID gets product by ID
func (h *ProductHandler) GetByID(c *gin.Context) {
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

// Create creates a product
func (h *ProductHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()
	
	var req service.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	product, err := h.productService.CreateProduct(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusCreated, product)
}

// Update updates a product
func (h *ProductHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()
	
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid product id", nil)
		return
	}
	
	var req service.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}
	
	product, err := h.productService.UpdateProduct(ctx, productID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}
	
	httputil.SuccessResponse(c, http.StatusOK, product)
}

// Delete deletes a product
func (h *ProductHandler) Delete(c *gin.Context) {
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