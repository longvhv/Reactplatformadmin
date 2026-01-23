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

type UserGroupHandler struct {
	groupService *service.UserGroupService
	authzService *service.AuthorizationService
}

func NewUserGroupHandler(groupService *service.UserGroupService, authzService *service.AuthorizationService) *UserGroupHandler {
	return &UserGroupHandler{
		groupService: groupService,
		authzService: authzService,
	}
}

// List lists user groups
func (h *UserGroupHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	tenantID, ok := contextutil.GetTenantID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusBadRequest, "tenant_id required", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.Query("status")
	groupType := c.Query("group_type")

	groups, total, err := h.groupService.ListByTenant(ctx, tenantID, status, groupType, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, groups, total, page, limit)
}

// GetByID gets group by ID
func (h *UserGroupHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	groupID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid group id", nil)
		return
	}

	group, err := h.groupService.GetByID(ctx, groupID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "group not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, group)
}

// GetByCode gets group by code
func (h *UserGroupHandler) GetByCode(c *gin.Context) {
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

	group, err := h.groupService.GetByCode(ctx, tenantID, code)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "group not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, group)
}

// Create creates a group
func (h *UserGroupHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateUserGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	group, err := h.groupService.CreateGroup(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, group)
}

// Update updates a group
func (h *UserGroupHandler) Update(c *gin.Context) {
	ctx := c.Request.Context()

	groupID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid group id", nil)
		return
	}

	var req service.UpdateUserGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	userID, _ := contextutil.GetUserID(ctx)
	req.UpdatedBy = userID

	group, err := h.groupService.UpdateGroup(ctx, groupID, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, group)
}

// Delete deletes a group
func (h *UserGroupHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	groupID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid group id", nil)
		return
	}

	if err := h.groupService.DeleteGroup(ctx, groupID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "group deleted successfully"})
}

// AddMember adds a member to group
func (h *UserGroupHandler) AddMember(c *gin.Context) {
	ctx := c.Request.Context()

	groupID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid group id", nil)
		return
	}

	var req service.AddGroupMemberRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	req.UserGroupID = groupID
	userID, _ := contextutil.GetUserID(ctx)
	req.CreatedBy = userID

	member, err := h.groupService.AddMember(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, member)
}

// RemoveMember removes a member from group
func (h *UserGroupHandler) RemoveMember(c *gin.Context) {
	ctx := c.Request.Context()

	groupID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid group id", nil)
		return
	}

	memberID, err := uuid.Parse(c.Param("memberId"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid member id", nil)
		return
	}

	if err := h.groupService.RemoveMember(ctx, groupID, memberID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "member removed successfully"})
}

// GetMembers gets group members
func (h *UserGroupHandler) GetMembers(c *gin.Context) {
	ctx := c.Request.Context()

	groupID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid group id", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	members, total, err := h.groupService.GetMembers(ctx, groupID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, members, total, page, limit)
}
