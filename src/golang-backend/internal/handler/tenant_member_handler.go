package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type TenantMemberHandler struct {
	service *service.TenantMemberService
}

func NewTenantMemberHandler(service *service.TenantMemberService) *TenantMemberHandler {
	return &TenantMemberHandler{service: service}
}

// CreateMember creates a new tenant member
// @Router /api/v1/tenant-members [post]
func (h *TenantMemberHandler) CreateMember(c *gin.Context) {
	var req models.CreateTenantMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member, err := h.service.CreateMember(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, member)
}

// GetMember retrieves a tenant member by ID
// @Router /api/v1/tenant-members/:id [get]
func (h *TenantMemberHandler) GetMember(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	member, err := h.service.GetMember(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, member)
}

// ListMembers retrieves tenant members with pagination and filters
// @Router /api/v1/tenant-members [get]
func (h *TenantMemberHandler) ListMembers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	filters := make(map[string]interface{})
	if tenantID := c.Query("tenant_id"); tenantID != "" {
		filters["tenant_id"] = tenantID
	}
	if role := c.Query("role"); role != "" {
		filters["role"] = role
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if managerID := c.Query("manager_id"); managerID != "" {
		filters["manager_id"] = managerID
	}

	members, total, err := h.service.ListMembers(page, pageSize, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      members,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// UpdateMember updates a tenant member
// @Router /api/v1/tenant-members/:id [put]
func (h *TenantMemberHandler) UpdateMember(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	var req models.UpdateTenantMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	member, err := h.service.UpdateMember(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, member)
}

// DeleteMember soft deletes a tenant member
// @Router /api/v1/tenant-members/:id [delete]
func (h *TenantMemberHandler) DeleteMember(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	if err := h.service.DeleteMember(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "tenant member deleted successfully"})
}

// ListMembersByTenant retrieves all members of a specific tenant
// @Router /api/v1/tenants/:tenant_id/members [get]
func (h *TenantMemberHandler) ListMembersByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	members, total, err := h.service.ListMembersByTenant(tenantID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      members,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetMemberByTenantAndUser retrieves a member by tenant and user ID
// @Router /api/v1/tenants/:tenant_id/members/user/:user_id [get]
func (h *TenantMemberHandler) GetMemberByTenantAndUser(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	userID, err := uuid.Parse(c.Param("user_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	member, err := h.service.GetMemberByTenantAndUser(tenantID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, member)
}

// UpdateMemberStatus updates the status of a tenant member
// @Router /api/v1/tenant-members/:id/status [put]
func (h *TenantMemberHandler) UpdateMemberStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	var req struct {
		Status string `json:"status" validate:"required,oneof=ACTIVE RESIGNED ONBOARDING SUSPENDED"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateMemberStatus(id, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status updated successfully"})
}

// UpdateMemberRole updates the role of a tenant member
// @Router /api/v1/tenant-members/:id/role [put]
func (h *TenantMemberHandler) UpdateMemberRole(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member ID"})
		return
	}

	var req struct {
		Role string `json:"role" validate:"required,oneof=OWNER ADMIN MEMBER VIEWER"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateMemberRole(id, req.Role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "role updated successfully"})
}

// GetActiveCount returns the count of active members in a tenant
// @Router /api/v1/tenants/:tenant_id/members/count [get]
func (h *TenantMemberHandler) GetActiveCount(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	count, err := h.service.GetActiveCount(tenantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// RegisterRoutes registers all tenant member routes
func (h *TenantMemberHandler) RegisterRoutes(router *gin.RouterGroup) {
	members := router.Group("/tenant-members")
	{
		members.POST("", h.CreateMember)
		members.GET("", h.ListMembers)
		members.GET("/:id", h.GetMember)
		members.PUT("/:id", h.UpdateMember)
		members.DELETE("/:id", h.DeleteMember)
		members.PUT("/:id/status", h.UpdateMemberStatus)
		members.PUT("/:id/role", h.UpdateMemberRole)
	}

	tenants := router.Group("/tenants/:tenant_id")
	{
		tenants.GET("/members", h.ListMembersByTenant)
		tenants.GET("/members/user/:user_id", h.GetMemberByTenantAndUser)
		tenants.GET("/members/count", h.GetActiveCount)
	}
}
