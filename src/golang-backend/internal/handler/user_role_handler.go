package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type UserRoleHandler struct {
	service *service.UserRoleService
}

func NewUserRoleHandler(service *service.UserRoleService) *UserRoleHandler {
	return &UserRoleHandler{service: service}
}

// AssignRole godoc
// @Summary Assign a role to a user
// @Tags user-roles
// @Accept json
// @Produce json
// @Param role body models.CreateUserRoleRequest true "User role assignment data"
// @Success 201 {object} models.UserRole
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-roles [post]
func (h *UserRoleHandler) AssignRole(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userRole, err := h.service.AssignRole(&req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, userRole)
}

// GetUserRole godoc
// @Summary Get a user role by ID
// @Tags user-roles
// @Produce json
// @Param id path string true "User Role ID"
// @Success 200 {object} models.UserRole
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-roles/{id} [get]
func (h *UserRoleHandler) GetUserRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	userRole, err := h.service.GetUserRole(id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, userRole)
}

// GetUserRoles godoc
// @Summary Get all roles for a specific user
// @Tags user-roles
// @Produce json
// @Param user_id path string true "User ID"
// @Param tenant_id query string false "Filter by tenant ID"
// @Success 200 {object} []models.UserRole
// @Failure 500 {object} map[string]string
// @Router /users/{user_id}/roles [get]
func (h *UserRoleHandler) GetUserRoles(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	var tenantID *string
	if tid := r.URL.Query().Get("tenant_id"); tid != "" {
		tenantID = &tid
	}

	userRoles, err := h.service.GetUserRoles(userID, tenantID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, userRoles)
}

// ListUserRoles godoc
// @Summary List user roles with filters
// @Tags user-roles
// @Produce json
// @Param user_id query string false "Filter by user ID"
// @Param role_id query string false "Filter by role ID"
// @Param tenant_id query string false "Filter by tenant ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /user-roles [get]
func (h *UserRoleHandler) ListUserRoles(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	var userID *string
	if uid := query.Get("user_id"); uid != "" {
		userID = &uid
	}

	var roleID *string
	if rid := query.Get("role_id"); rid != "" {
		roleID = &rid
	}

	var tenantID *string
	if tid := query.Get("tenant_id"); tid != "" {
		tenantID = &tid
	}

	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	userRoles, total, err := h.service.ListUserRoles(userID, roleID, tenantID, page, pageSize)
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
		"data":        userRoles,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + pageSize - 1) / pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// UpdateUserRole godoc
// @Summary Update a user role
// @Tags user-roles
// @Accept json
// @Produce json
// @Param id path string true "User Role ID"
// @Param role body models.UpdateUserRoleRequest true "User role update data"
// @Success 200 {object} models.UserRole
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-roles/{id} [put]
func (h *UserRoleHandler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req models.UpdateUserRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userRole, err := h.service.UpdateUserRole(id, &req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, userRole)
}

// RevokeRole godoc
// @Summary Revoke a user role
// @Tags user-roles
// @Param id path string true "User Role ID"
// @Success 204
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /user-roles/{id} [delete]
func (h *UserRoleHandler) RevokeRole(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	err := h.service.RevokeRole(id)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RevokeExpiredRoles godoc
// @Summary Revoke all expired user roles (maintenance endpoint)
// @Tags user-roles
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /user-roles/revoke-expired [post]
func (h *UserRoleHandler) RevokeExpiredRoles(w http.ResponseWriter, r *http.Request) {
	count, err := h.service.RevokeExpiredRoles()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"revoked_count": count,
		"message":       "Expired roles have been revoked",
	})
}
