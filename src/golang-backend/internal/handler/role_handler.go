package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/internal/utils"
)

// RoleHandler handles HTTP requests for roles
type RoleHandler struct {
	service *service.RoleService
}

// NewRoleHandler creates a new role handler
func NewRoleHandler(service *service.RoleService) *RoleHandler {
	return &RoleHandler{service: service}
}

// GetAll handles GET /api/v1/roles
func (h *RoleHandler) GetAll(c *gin.Context) {
	// Parse filters from query params
	filters := models.RoleFilters{}

	if tenantID := c.Query("tenant_id"); tenantID != "" {
		filters.TenantID = &tenantID
	}

	if typeStr := c.Query("type"); typeStr != "" {
		roleType := models.RoleType(typeStr)
		filters.Type = &roleType
	}

	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	// Get roles
	roles, err := h.service.GetAll(c.Request.Context(), filters)
	if err != nil {
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, roles)
}

// GetByID handles GET /api/v1/roles/:id
func (h *RoleHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	role, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "role not found" || err.Error() == "invalid role ID format" {
			utils.NotFoundResponse(c, "Role")
			return
		}
		utils.InternalErrorResponse(c, err)
		return
	}

	utils.SuccessResponse(c, http.StatusOK, role)
}

// Create handles POST /api/v1/roles
func (h *RoleHandler) Create(c *gin.Context) {
	var req models.CreateRoleRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	role, err := h.service.Create(c.Request.Context(), req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "CREATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, role)
}

// Update handles PATCH /api/v1/roles/:id
func (h *RoleHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	role, err := h.service.Update(c.Request.Context(), id, req)
	if err != nil {
		if err.Error() == "role not found" || err.Error() == "invalid role ID format" {
			utils.NotFoundResponse(c, "Role")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "UPDATE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, role)
}

// Delete handles DELETE /api/v1/roles/:id
func (h *RoleHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(c.Request.Context(), id)
	if err != nil {
		if err.Error() == "role not found" || err.Error() == "invalid role ID format" {
			utils.NotFoundResponse(c, "Role")
			return
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "DELETE_ERROR", err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusNoContent, nil)
}
