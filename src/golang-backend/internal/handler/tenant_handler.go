package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

// TenantHandler handles HTTP requests for tenants
type TenantHandler struct {
	service *service.TenantService
}

// NewTenantHandler creates a new tenant handler
func NewTenantHandler(service *service.TenantService) *TenantHandler {
	return &TenantHandler{service: service}
}

// GetAll handles GET /api/v1/tenants
func (h *TenantHandler) GetAll(c *gin.Context) {
	filters := models.TenantFilters{}

	if tierStr := c.Query("tier"); tierStr != "" {
		tier := models.TenantTier(tierStr)
		filters.Tier = &tier
	}

	if statusStr := c.Query("status"); statusStr != "" {
		status := models.TenantStatus(statusStr)
		filters.Status = &status
	}

	if parentID := c.Query("parent_tenant_id"); parentID != "" {
		filters.ParentTenantID = &parentID
	}

	if region := c.Query("data_region"); region != "" {
		filters.DataRegion = &region
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	tenants, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tenants)
}

// GetByID handles GET /api/v1/tenants/:id
func (h *TenantHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	tenant, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "tenant not found" || err.Error() == "invalid tenant ID format" {
			utils.NotFoundResponse(c, "Tenant")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tenant)
}

// GetByCode handles GET /api/v1/tenants/code/:code
func (h *TenantHandler) GetByCode(c *gin.Context) {
	code := c.Param("code")

	tenant, err := h.service.GetByCode(c.Request.Context(), code)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	if tenant == nil {
		utils.NotFoundResponse(c, "Tenant")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tenant)
}

// Create handles POST /api/v1/tenants
func (h *TenantHandler) Create(c *gin.Context) {
	var req models.CreateTenantRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	tenant, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		if err.Error() == "tenant code already exists" {
			utils.ErrorResponse(c, http.StatusConflict, "CODE_EXISTS", err.Error())
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, tenant)
}

// Update handles PATCH /api/v1/tenants/:id
func (h *TenantHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	tenant, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "tenant not found" || err.Error() == "invalid tenant ID format" {
			utils.NotFoundResponse(c, "Tenant")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, tenant)
}

// Delete handles DELETE /api/v1/tenants/:id
func (h *TenantHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "tenant not found" || err.Error() == "invalid tenant ID format" {
			utils.NotFoundResponse(c, "Tenant")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}
