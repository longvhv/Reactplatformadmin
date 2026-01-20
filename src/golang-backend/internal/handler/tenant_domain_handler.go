package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type TenantDomainHandler struct {
	service *service.TenantDomainService
}

func NewTenantDomainHandler(service *service.TenantDomainService) *TenantDomainHandler {
	return &TenantDomainHandler{service: service}
}

// CreateDomain godoc
// @Summary Create a new tenant domain
// @Tags tenant-domains
// @Accept json
// @Produce json
// @Param domain body models.CreateTenantDomainRequest true "Domain data"
// @Success 201 {object} models.TenantDomain
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-domains [post]
func (h *TenantDomainHandler) CreateDomain(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTenantDomainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	domain, err := h.service.CreateDomain(&req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, domain)
}

// GetDomain godoc
// @Summary Get a tenant domain by ID
// @Tags tenant-domains
// @Produce json
// @Param id path string true "Domain ID"
// @Success 200 {object} models.TenantDomain
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-domains/{id} [get]
func (h *TenantDomainHandler) GetDomain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	domain, err := h.service.GetDomain(id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, domain)
}

// GetDomainByName godoc
// @Summary Get a tenant domain by domain name
// @Tags tenant-domains
// @Produce json
// @Param domain path string true "Domain name"
// @Success 200 {object} models.TenantDomain
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-domains/by-domain/{domain} [get]
func (h *TenantDomainHandler) GetDomainByName(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	domain := vars["domain"]

	tenantDomain, err := h.service.GetDomainByName(domain)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, tenantDomain)
}

// ListDomains godoc
// @Summary List tenant domains
// @Tags tenant-domains
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param verification_status query string false "Filter by verification status"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /tenant-domains [get]
func (h *TenantDomainHandler) ListDomains(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	var tenantID *string
	if tid := query.Get("tenant_id"); tid != "" {
		tenantID = &tid
	}

	var verificationStatus *string
	if vs := query.Get("verification_status"); vs != "" {
		verificationStatus = &vs
	}

	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	domains, total, err := h.service.ListDomains(tenantID, verificationStatus, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"data":  domains,
		"total": total,
		"page":  page,
		"page_size": pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// ListDomainsByTenant godoc
// @Summary List domains for a specific tenant
// @Tags tenant-domains
// @Produce json
// @Param tenant_id path string true "Tenant ID"
// @Success 200 {array} models.TenantDomain
// @Failure 500 {object} map[string]string
// @Router /tenants/{tenant_id}/domains [get]
func (h *TenantDomainHandler) ListDomainsByTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	domains, err := h.service.ListDomainsByTenant(tenantID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, domains)
}

// UpdateDomain godoc
// @Summary Update a tenant domain
// @Tags tenant-domains
// @Accept json
// @Produce json
// @Param id path string true "Domain ID"
// @Param domain body models.UpdateTenantDomainRequest true "Update data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-domains/{id} [put]
func (h *TenantDomainHandler) UpdateDomain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req models.UpdateTenantDomainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := h.service.UpdateDomain(id, &req); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Domain updated successfully"})
}

// VerifyDomain godoc
// @Summary Verify a tenant domain
// @Tags tenant-domains
// @Produce json
// @Param id path string true "Domain ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-domains/{id}/verify [post]
func (h *TenantDomainHandler) VerifyDomain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.VerifyDomain(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Domain verified successfully"})
}

// DeleteDomain godoc
// @Summary Delete a tenant domain
// @Tags tenant-domains
// @Produce json
// @Param id path string true "Domain ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-domains/{id} [delete]
func (h *TenantDomainHandler) DeleteDomain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.DeleteDomain(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Domain deleted successfully"})
}
