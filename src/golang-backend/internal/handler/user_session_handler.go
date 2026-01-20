package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type UserSessionHandler struct {
	service *service.UserSessionService
}

func NewUserSessionHandler(service *service.UserSessionService) *UserSessionHandler {
	return &UserSessionHandler{service: service}
}

// CreateSession godoc
// @Summary Create a new user session
// @Tags user-sessions
// @Accept json
// @Produce json
// @Param session body models.CreateUserSessionRequest true "User session data"
// @Success 201 {object} models.UserSession
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-sessions [post]
func (h *UserSessionHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	session, err := h.service.CreateSession(&req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, session)
}

// GetSession godoc
// @Summary Get a user session by ID
// @Tags user-sessions
// @Produce json
// @Param id path string true "Session ID"
// @Success 200 {object} models.UserSession
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-sessions/{id} [get]
func (h *UserSessionHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	session, err := h.service.GetSession(id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, session)
}

// GetSessionByToken godoc
// @Summary Get a user session by token
// @Tags user-sessions
// @Produce json
// @Param token query string true "Session Token"
// @Success 200 {object} models.UserSession
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-sessions/token [get]
func (h *UserSessionHandler) GetSessionByToken(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		respondWithError(w, http.StatusBadRequest, "token parameter is required")
		return
	}

	session, err := h.service.GetSessionByToken(token)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, session)
}

// GetUserSessions godoc
// @Summary Get all sessions for a specific user
// @Tags user-sessions
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {object} []models.UserSession
// @Failure 500 {object} map[string]string
// @Router /users/{user_id}/sessions [get]
func (h *UserSessionHandler) GetUserSessions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	sessions, err := h.service.GetUserSessions(userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, sessions)
}

// ListSessions godoc
// @Summary List user sessions with filters
// @Tags user-sessions
// @Produce json
// @Param user_id query string false "Filter by user ID"
// @Param is_active query bool false "Filter by active status"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /user-sessions [get]
func (h *UserSessionHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	var userID *string
	if uid := query.Get("user_id"); uid != "" {
		userID = &uid
	}

	var isActive *bool
	if activeStr := query.Get("is_active"); activeStr != "" {
		active := activeStr == "true"
		isActive = &active
	}

	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	sessions, total, err := h.service.ListSessions(userID, isActive, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	response := map[string]interface{}{
		"data":        sessions,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + pageSize - 1) / pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// UpdateSession godoc
// @Summary Update a user session
// @Tags user-sessions
// @Accept json
// @Produce json
// @Param id path string true "Session ID"
// @Param session body models.UpdateUserSessionRequest true "Session update data"
// @Success 200 {object} models.UserSession
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-sessions/{id} [put]
func (h *UserSessionHandler) UpdateSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req models.UpdateUserSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	session, err := h.service.UpdateSession(id, &req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, session)
}

// UpdateSessionActivity godoc
// @Summary Update last activity timestamp for a session
// @Tags user-sessions
// @Param id path string true "Session ID"
// @Success 204
// @Failure 500 {object} map[string]string
// @Router /user-sessions/{id}/activity [put]
func (h *UserSessionHandler) UpdateSessionActivity(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	err := h.service.UpdateSessionActivity(id)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteSession godoc
// @Summary Delete a user session
// @Tags user-sessions
// @Param id path string true "Session ID"
// @Success 204
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-sessions/{id} [delete]
func (h *UserSessionHandler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	err := h.service.DeleteSession(id)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeleteAllUserSessions godoc
// @Summary Delete all sessions for a specific user
// @Tags user-sessions
// @Param user_id path string true "User ID"
// @Success 204
// @Failure 500 {object} map[string]string
// @Router /users/{user_id}/sessions [delete]
func (h *UserSessionHandler) DeleteAllUserSessions(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	err := h.service.DeleteAllUserSessions(userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// DeactivateExpiredSessions godoc
// @Summary Deactivate all expired sessions (maintenance endpoint)
// @Tags user-sessions
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /user-sessions/deactivate-expired [post]
func (h *UserSessionHandler) DeactivateExpiredSessions(w http.ResponseWriter, r *http.Request) {
	count, err := h.service.DeactivateExpiredSessions()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"deactivated_count": count,
		"message":           "Expired sessions have been deactivated",
	})
}
