package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type TenantRateLimitHandler struct {
	service *service.TenantRateLimitService
}

func NewTenantRateLimitHandler(service *service.TenantRateLimitService) *TenantRateLimitHandler {
	return &TenantRateLimitHandler{service: service}
}

// CreateRateLimit godoc
// @Summary Create a new tenant rate limit
// @Tags tenant-rate-limits
// @Accept json
// @Produce json
// @Param rateLimit body models.CreateTenantRateLimitRequest true "Rate limit data"
// @Success 201 {object} models.TenantRateLimit
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-rate-limits [post]
func (h *TenantRateLimitHandler) CreateRateLimit(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTenantRateLimitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	limit, err := h.service.CreateRateLimit(&req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, limit)
}

// GetRateLimit godoc
// @Summary Get a tenant rate limit by ID
// @Tags tenant-rate-limits
// @Produce json
// @Param id path string true "Rate limit ID"
// @Success 200 {object} models.TenantRateLimit
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-rate-limits/{id} [get]
func (h *TenantRateLimitHandler) GetRateLimit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	limit, err := h.service.GetRateLimit(id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, limit)
}

// ListRateLimits godoc
// @Summary List tenant rate limits
// @Tags tenant-rate-limits
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param resource_type query string false "Filter by resource type"
// @Param is_enabled query bool false "Filter by enabled status"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /tenant-rate-limits [get]
func (h *TenantRateLimitHandler) ListRateLimits(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	var tenantID *string
	if tid := query.Get("tenant_id"); tid != "" {
		tenantID = &tid
	}

	var resourceType *string
	if rt := query.Get("resource_type"); rt != "" {
		resourceType = &rt
	}

	var isEnabled *bool
	if ie := query.Get("is_enabled"); ie != "" {
		enabled := ie == "true"
		isEnabled = &enabled
	}

	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	limits, total, err := h.service.ListRateLimits(tenantID, resourceType, isEnabled, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"data":      limits,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// ListRateLimitsByTenant godoc
// @Summary List rate limits for a specific tenant
// @Tags tenant-rate-limits
// @Produce json
// @Param tenant_id path string true "Tenant ID"
// @Success 200 {array} models.TenantRateLimit
// @Failure 500 {object} map[string]string
// @Router /tenants/{tenant_id}/rate-limits [get]
func (h *TenantRateLimitHandler) ListRateLimitsByTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	limits, err := h.service.ListRateLimitsByTenant(tenantID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, limits)
}

// UpdateRateLimit godoc
// @Summary Update a tenant rate limit
// @Tags tenant-rate-limits
// @Accept json
// @Produce json
// @Param id path string true "Rate limit ID"
// @Param rateLimit body models.UpdateTenantRateLimitRequest true "Update data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-rate-limits/{id} [put]
func (h *TenantRateLimitHandler) UpdateRateLimit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req models.UpdateTenantRateLimitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := h.service.UpdateRateLimit(id, &req); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Rate limit updated successfully"})
}

// DeleteRateLimit godoc
// @Summary Delete a tenant rate limit
// @Tags tenant-rate-limits
// @Produce json
// @Param id path string true "Rate limit ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-rate-limits/{id} [delete]
func (h *TenantRateLimitHandler) DeleteRateLimit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.DeleteRateLimit(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Rate limit deleted successfully"})
}

// IncrementUsage godoc
// @Summary Increment usage counter for a rate limit
// @Tags tenant-rate-limits
// @Produce json
// @Param id path string true "Rate limit ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-rate-limits/{id}/increment [post]
func (h *TenantRateLimitHandler) IncrementUsage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.IncrementUsage(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Usage incremented successfully"})
}

// ResetUsage godoc
// @Summary Reset usage counter for a rate limit
// @Tags tenant-rate-limits
// @Produce json
// @Param id path string true "Rate limit ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-rate-limits/{id}/reset [post]
func (h *TenantRateLimitHandler) ResetUsage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.ResetUsage(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Usage reset successfully"})
}
