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

type UserSessionHandler struct {
	sessionService *service.UserSessionService
	authzService   *service.AuthorizationService
}

func NewUserSessionHandler(sessionService *service.UserSessionService, authzService *service.AuthorizationService) *UserSessionHandler {
	return &UserSessionHandler{
		sessionService: sessionService,
		authzService:   authzService,
	}
}

// List lists user sessions
func (h *UserSessionHandler) List(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	sessions, total, err := h.sessionService.ListByUser(ctx, userID, page, limit)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.PaginatedResponse(c, http.StatusOK, sessions, total, page, limit)
}

// GetByID gets session by ID
func (h *UserSessionHandler) GetByID(c *gin.Context) {
	ctx := c.Request.Context()

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid session id", nil)
		return
	}

	session, err := h.sessionService.GetByID(ctx, sessionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "session not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, session)
}

// GetByToken gets session by token
func (h *UserSessionHandler) GetByToken(c *gin.Context) {
	ctx := c.Request.Context()

	token := c.Query("token")
	if token == "" {
		httputil.ErrorResponse(c, http.StatusBadRequest, "token required", nil)
		return
	}

	session, err := h.sessionService.GetByToken(ctx, token)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusNotFound, "session not found", nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, session)
}

// Create creates a session
func (h *UserSessionHandler) Create(c *gin.Context) {
	ctx := c.Request.Context()

	var req service.CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	// Add client info
	req.IPAddress = c.ClientIP()
	req.UserAgent = c.GetHeader("User-Agent")

	session, err := h.sessionService.CreateSession(ctx, req)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusCreated, session)
}

// Delete deletes a session
func (h *UserSessionHandler) Delete(c *gin.Context) {
	ctx := c.Request.Context()

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid session id", nil)
		return
	}

	if err := h.sessionService.DeleteSession(ctx, sessionID); err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{"message": "session deleted successfully"})
}

// Revoke revokes a session
func (h *UserSessionHandler) Revoke(c *gin.Context) {
	ctx := c.Request.Context()

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid session id", nil)
		return
	}

	session, err := h.sessionService.RevokeSession(ctx, sessionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, session)
}

// Refresh refreshes a session
func (h *UserSessionHandler) Refresh(c *gin.Context) {
	ctx := c.Request.Context()

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid session id", nil)
		return
	}

	session, err := h.sessionService.RefreshSession(ctx, sessionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, session)
}

// UpdateActivity updates session activity
func (h *UserSessionHandler) UpdateActivity(c *gin.Context) {
	ctx := c.Request.Context()

	sessionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid session id", nil)
		return
	}

	session, err := h.sessionService.UpdateActivity(ctx, sessionID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, session)
}

// GetActive gets active sessions
func (h *UserSessionHandler) GetActive(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	sessions, err := h.sessionService.GetActiveSessions(ctx, userID)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, sessions)
}

// RevokeAll revokes all sessions
func (h *UserSessionHandler) RevokeAll(c *gin.Context) {
	ctx := c.Request.Context()

	userID, ok := contextutil.GetUserID(ctx)
	if !ok {
		httputil.ErrorResponse(c, http.StatusUnauthorized, "user not authenticated", nil)
		return
	}

	var req struct {
		ExceptCurrent bool `json:"except_current"`
	}
	_ = c.ShouldBindJSON(&req)

	count, err := h.sessionService.RevokeAllSessions(ctx, userID, req.ExceptCurrent)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"message":       "sessions revoked successfully",
		"revoked_count": count,
	})
}

// Validate validates a session
func (h *UserSessionHandler) Validate(c *gin.Context) {
	ctx := c.Request.Context()

	var req struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.ErrorResponse(c, http.StatusBadRequest, "invalid request", nil)
		return
	}

	session, err := h.sessionService.ValidateSession(ctx, req.Token)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"valid":   true,
		"session": session,
	})
}

// CleanupExpired cleans up expired sessions
func (h *UserSessionHandler) CleanupExpired(c *gin.Context) {
	ctx := c.Request.Context()

	count, err := h.sessionService.CleanupExpiredSessions(ctx)
	if err != nil {
		httputil.ErrorResponse(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	httputil.SuccessResponse(c, http.StatusOK, gin.H{
		"message":        "expired sessions cleaned up",
		"cleaned_count":  count,
	})
}
