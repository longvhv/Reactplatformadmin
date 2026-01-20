package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type TenantInvitationHandler struct {
	service *service.TenantInvitationService
}

func NewTenantInvitationHandler(service *service.TenantInvitationService) *TenantInvitationHandler {
	return &TenantInvitationHandler{service: service}
}

// CreateInvitation creates a new tenant invitation
// @Router /api/v1/tenant-invitations [post]
func (h *TenantInvitationHandler) CreateInvitation(c *gin.Context) {
	var req models.CreateTenantInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invitation, err := h.service.CreateInvitation(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, invitation)
}

// GetInvitation retrieves a tenant invitation by ID
// @Router /api/v1/tenant-invitations/:id [get]
func (h *TenantInvitationHandler) GetInvitation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invitation ID"})
		return
	}

	invitation, err := h.service.GetInvitation(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// GetInvitationByToken retrieves a tenant invitation by token
// @Router /api/v1/tenant-invitations/by-token/:token [get]
func (h *TenantInvitationHandler) GetInvitationByToken(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	invitation, err := h.service.GetInvitationByToken(token)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// ListInvitations retrieves tenant invitations with pagination and filters
// @Router /api/v1/tenant-invitations [get]
func (h *TenantInvitationHandler) ListInvitations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	filters := make(map[string]interface{})
	if tenantID := c.Query("tenant_id"); tenantID != "" {
		filters["tenant_id"] = tenantID
	}
	if email := c.Query("email"); email != "" {
		filters["email"] = email
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}

	invitations, total, err := h.service.ListInvitations(page, pageSize, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      invitations,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// UpdateInvitation updates a tenant invitation
// @Router /api/v1/tenant-invitations/:id [put]
func (h *TenantInvitationHandler) UpdateInvitation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invitation ID"})
		return
	}

	var req models.UpdateTenantInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	invitation, err := h.service.UpdateInvitation(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// AcceptInvitation accepts a tenant invitation
// @Router /api/v1/tenant-invitations/accept/:token [post]
func (h *TenantInvitationHandler) AcceptInvitation(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token is required"})
		return
	}

	invitation, err := h.service.AcceptInvitation(token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// RevokeInvitation revokes a tenant invitation
// @Router /api/v1/tenant-invitations/:id/revoke [post]
func (h *TenantInvitationHandler) RevokeInvitation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invitation ID"})
		return
	}

	if err := h.service.RevokeInvitation(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "invitation revoked successfully"})
}

// ResendInvitation resends an invitation
// @Router /api/v1/tenant-invitations/:id/resend [post]
func (h *TenantInvitationHandler) ResendInvitation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invitation ID"})
		return
	}

	invitation, err := h.service.ResendInvitation(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// DeleteInvitation deletes a tenant invitation
// @Router /api/v1/tenant-invitations/:id [delete]
func (h *TenantInvitationHandler) DeleteInvitation(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invitation ID"})
		return
	}

	if err := h.service.DeleteInvitation(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "invitation deleted successfully"})
}

// ListInvitationsByTenant retrieves all invitations for a specific tenant
// @Router /api/v1/tenants/:tenant_id/invitations [get]
func (h *TenantInvitationHandler) ListInvitationsByTenant(c *gin.Context) {
	tenantID, err := uuid.Parse(c.Param("tenant_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tenant ID"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	invitations, total, err := h.service.ListInvitationsByTenant(tenantID, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      invitations,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// ExpireOldInvitations marks old pending invitations as expired
// @Router /api/v1/tenant-invitations/expire-old [post]
func (h *TenantInvitationHandler) ExpireOldInvitations(c *gin.Context) {
	count, err := h.service.ExpireOldInvitations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "old invitations expired successfully",
		"count":   count,
	})
}

// RegisterRoutes registers all tenant invitation routes
func (h *TenantInvitationHandler) RegisterRoutes(router *gin.RouterGroup) {
	invitations := router.Group("/tenant-invitations")
	{
		invitations.POST("", h.CreateInvitation)
		invitations.GET("", h.ListInvitations)
		invitations.GET("/:id", h.GetInvitation)
		invitations.GET("/by-token/:token", h.GetInvitationByToken)
		invitations.PUT("/:id", h.UpdateInvitation)
		invitations.POST("/accept/:token", h.AcceptInvitation)
		invitations.POST("/:id/revoke", h.RevokeInvitation)
		invitations.POST("/:id/resend", h.ResendInvitation)
		invitations.DELETE("/:id", h.DeleteInvitation)
		invitations.POST("/expire-old", h.ExpireOldInvitations)
	}

	tenants := router.Group("/tenants/:tenant_id")
	{
		tenants.GET("/invitations", h.ListInvitationsByTenant)
	}
}
