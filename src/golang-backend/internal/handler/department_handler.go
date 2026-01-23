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

type DepartmentHandler struct {
	departmentService *service.DepartmentService
	authzService      *service.AuthorizationService
}

func NewDepartmentHandler(departmentService *service.DepartmentService, authzService *service.AuthorizationService) *DepartmentHandler {
	return &DepartmentHandler{
		departmentService: departmentService,
		authzService:      authzService,
	}
}

// List lists departments
func (h *DepartmentHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	departments, total, err := h.departmentService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, departments, total, page, limit)
}

// GetByID gets department by ID
func (h *DepartmentHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	deptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid department id", nil)
		return
	}

	department, err := h.departmentService.GetByID(ctx, deptID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "department not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, department)
}

// Create creates a department
func (h *DepartmentHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	department, err := h.departmentService.CreateDepartment(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, department)
}

// Update updates a department
func (h *DepartmentHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	deptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid department id", nil)
		return
	}

	var req service.UpdateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	department, err := h.departmentService.UpdateDepartment(ctx, deptID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, department)
}

// Delete deletes a department
func (h *DepartmentHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	deptID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid department id", nil)
		return
	}

	if err := h.departmentService.DeleteDepartment(ctx, deptID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "department deleted successfully"})
}

// GetTree gets department tree structure
func (h *DepartmentHandler) GetTree(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	tree, err := h.departmentService.GetTree(ctx, tenantID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, tree)
}
