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

type TenantInvitationHandler struct {
	invitationService *service.TenantInvitationService
	authzService      *service.AuthorizationService
}

func NewTenantInvitationHandler(invitationService *service.TenantInvitationService, authzService *service.AuthorizationService) *TenantInvitationHandler {
	return &TenantInvitationHandler{
		invitationService: invitationService,
		authzService:      authzService,
	}
}

// List lists tenant invitations
func (h *TenantInvitationHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")

	invitations, total, err := h.invitationService.ListByTenant(ctx, tenantID, status, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, invitations, total, page, limit)
}

// GetByID gets invitation by ID
func (h *TenantInvitationHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	invitationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invitation id", nil)
		return
	}

	invitation, err := h.invitationService.GetByID(ctx, invitationID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "invitation not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invitation)
}

// GetByToken gets invitation by token
func (h *TenantInvitationHandler) GetByToken(c *gin.Context) {
	ctx := c.Request.Context()

	token := c.Param("token")
	if token == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "token required", nil)
		return
	}

	invitation, err := h.invitationService.GetByToken(ctx, token)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "invitation not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, invitation)
}

// Create creates a tenant invitation
func (h *TenantInvitationHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateTenantInvitationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.InvitedBy = userID

	invitation, err := h.invitationService.CreateInvitation(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, invitation)
}

// Resend resends invitation email
func (h *TenantInvitationHandler) Resend(c *gin.Context) {
	ctx := c.Request.Context()

	invitationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invitation id", nil)
		return
	}

	if err := h.invitationService.ResendInvitation(ctx, invitationID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "invitation resent successfully"})
}

// Accept accepts an invitation
func (h *TenantInvitationHandler) Accept(c *gin.Context) {
	ctx := c.Request.Context()

	token := c.Param("token")
	if token == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "token required", nil)
		return
	}

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	member, err := h.invitationService.AcceptInvitation(ctx, token, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, member)
}

// Revoke revokes an invitation
func (h *TenantInvitationHandler) Revoke(c *gin.Context) {
	ctx := c.Request.Context()

	invitationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid invitation id", nil)
		return
	}

	if err := h.invitationService.RevokeInvitation(ctx, invitationID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "invitation revoked successfully"})
}
