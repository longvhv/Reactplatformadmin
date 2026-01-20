package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type TenantApplicationHandler struct {
	service *service.TenantApplicationService
}

func NewTenantApplicationHandler(service *service.TenantApplicationService) *TenantApplicationHandler {
	return &TenantApplicationHandler{service: service}
}

// CreateApplication godoc
// @Summary Create a new tenant application
// @Tags tenant-applications
// @Accept json
// @Produce json
// @Param application body models.CreateTenantApplicationRequest true "Application data"
// @Success 201 {object} models.TenantApplication
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-applications [post]
func (h *TenantApplicationHandler) CreateApplication(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTenantApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	app, err := h.service.CreateApplication(&req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, app)
}

// GetApplication godoc
// @Summary Get a tenant application by ID
// @Tags tenant-applications
// @Produce json
// @Param id path string true "Application ID"
// @Success 200 {object} models.TenantApplication
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-applications/{id} [get]
func (h *TenantApplicationHandler) GetApplication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	app, err := h.service.GetApplication(id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, app)
}

// GetApplicationByTenantAndApp godoc
// @Summary Get a tenant application by tenant ID and app code
// @Tags tenant-applications
// @Produce json
// @Param tenant_id path string true "Tenant ID"
// @Param app_code path string true "App Code"
// @Success 200 {object} models.TenantApplication
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenants/{tenant_id}/applications/{app_code} [get]
func (h *TenantApplicationHandler) GetApplicationByTenantAndApp(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	appCode := vars["app_code"]

	app, err := h.service.GetApplicationByTenantAndApp(tenantID, appCode)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, app)
}

// ListApplications godoc
// @Summary List tenant applications
// @Tags tenant-applications
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param app_code query string false "Filter by app code"
// @Param is_active query bool false "Filter by active status"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /tenant-applications [get]
func (h *TenantApplicationHandler) ListApplications(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	var tenantID *string
	if tid := query.Get("tenant_id"); tid != "" {
		tenantID = &tid
	}

	var appCode *string
	if ac := query.Get("app_code"); ac != "" {
		appCode = &ac
	}

	var isActive *bool
	if ia := query.Get("is_active"); ia != "" {
		active := ia == "true"
		isActive = &active
	}

	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	apps, total, err := h.service.ListApplications(tenantID, appCode, isActive, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"data":      apps,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// ListApplicationsByTenant godoc
// @Summary List applications for a specific tenant
// @Tags tenant-applications
// @Produce json
// @Param tenant_id path string true "Tenant ID"
// @Success 200 {array} models.TenantApplication
// @Failure 500 {object} map[string]string
// @Router /tenants/{tenant_id}/applications [get]
func (h *TenantApplicationHandler) ListApplicationsByTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	apps, err := h.service.ListApplicationsByTenant(tenantID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, apps)
}

// UpdateApplication godoc
// @Summary Update a tenant application
// @Tags tenant-applications
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Param application body models.UpdateTenantApplicationRequest true "Update data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-applications/{id} [put]
func (h *TenantApplicationHandler) UpdateApplication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req models.UpdateTenantApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := h.service.UpdateApplication(id, &req); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Application updated successfully"})
}

// DeleteApplication godoc
// @Summary Delete a tenant application
// @Tags tenant-applications
// @Accept json
// @Produce json
// @Param id path string true "Application ID"
// @Param body body map[string]string false "Request body with deleted_by field"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-applications/{id} [delete]
func (h *TenantApplicationHandler) DeleteApplication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var body struct {
		DeletedBy *string `json:"deleted_by,omitempty"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	if err := h.service.DeleteApplication(id, body.DeletedBy); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Application deleted successfully"})
}

// ActivateApplication godoc
// @Summary Activate a tenant application
// @Tags tenant-applications
// @Produce json
// @Param id path string true "Application ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-applications/{id}/activate [post]
func (h *TenantApplicationHandler) ActivateApplication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.ActivateApplication(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Application activated successfully"})
}

// DeactivateApplication godoc
// @Summary Deactivate a tenant application
// @Tags tenant-applications
// @Produce json
// @Param id path string true "Application ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-applications/{id}/deactivate [post]
func (h *TenantApplicationHandler) DeactivateApplication(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.DeactivateApplication(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Application deactivated successfully"})
}
