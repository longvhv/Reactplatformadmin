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

type TenantMemberHandler struct {
	memberService *service.TenantMemberService
	authzService  *service.AuthorizationService
}

func NewTenantMemberHandler(memberService *service.TenantMemberService, authzService *service.AuthorizationService) *TenantMemberHandler {
	return &TenantMemberHandler{
		memberService: memberService,
		authzService:  authzService,
	}
}

// List lists tenant members
func (h *TenantMemberHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	members, total, err := h.memberService.ListByTenant(ctx, tenantID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, members, total, page, limit)
}

// GetByID gets tenant member by ID
func (h *TenantMemberHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	memberID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid member id", nil)
		return
	}

	member, err := h.memberService.GetByID(ctx, memberID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "member not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, member)
}

// Add adds a member to tenant
func (h *TenantMemberHandler) Add(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.AddTenantMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	member, err := h.memberService.AddMember(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, member)
}

// Update updates tenant member
func (h *TenantMemberHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	memberID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid member id", nil)
		return
	}

	var req service.UpdateTenantMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	member, err := h.memberService.UpdateMember(ctx, memberID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, member)
}

// Remove removes member from tenant
func (h *TenantMemberHandler) Remove(c *gin.Context) {
	ctx := c.Request.Context()

	memberID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid member id", nil)
		return
	}

	if err := h.memberService.RemoveMember(ctx, memberID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "member removed successfully"})
}

// UpdateRole updates member's role
func (h *TenantMemberHandler) UpdateRole(c *gin.Context) {
	ctx := c.Request.Context()

	memberID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid member id", nil)
		return
	}

	var req struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	member, err := h.memberService.UpdateMemberRole(ctx, memberID, req.Role)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, member)
}
