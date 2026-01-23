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

type SystemCategoryHandler struct {
	categoryService *service.SystemCategoryService
	authzService    *service.AuthorizationService
}

func NewSystemCategoryHandler(categoryService *service.SystemCategoryService, authzService *service.AuthorizationService) *SystemCategoryHandler {
	return &SystemCategoryHandler{
		categoryService: categoryService,
		authzService:    authzService,
	}
}

// List lists system categories
func (h *SystemCategoryHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	categoryType := c.Query("type")
	status := c.Query("status")

	var statusInt *int
	if status != "" {
		s, _ := strconv.Atoi(status)
		statusInt = &s
	}

	categories, total, err := h.categoryService.ListByTenant(ctx, tenantID, categoryType, statusInt, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, categories, total, page, limit)
}

// GetByID gets category by ID
func (h *SystemCategoryHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	categoryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid category id", nil)
		return
	}

	category, err := h.categoryService.GetByID(ctx, categoryID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "category not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, category)
}

// GetByCode gets category by code
func (h *SystemCategoryHandler) GetByCode(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	code := c.Param("code")
	if code == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "code required", nil)
		return
	}

	category, err := h.categoryService.GetByCode(ctx, tenantID, code)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "category not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, category)
}

// Create creates a category
func (h *SystemCategoryHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateSystemCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	category, err := h.categoryService.CreateCategory(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, category)
}

// Update updates a category
func (h *SystemCategoryHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	categoryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid category id", nil)
		return
	}

	var req service.UpdateSystemCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	category, err := h.categoryService.UpdateCategory(ctx, categoryID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, category)
}

// Delete deletes a category
func (h *SystemCategoryHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	categoryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid category id", nil)
		return
	}

	if err := h.categoryService.DeleteCategory(ctx, categoryID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "category deleted successfully"})
}

// GetByType gets categories by type
func (h *SystemCategoryHandler) GetByType(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	categoryType := c.Param("type")
	if categoryType == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "type required", nil)
		return
	}

	categories, err := h.categoryService.GetByType(ctx, tenantID, categoryType)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, categories)
}
