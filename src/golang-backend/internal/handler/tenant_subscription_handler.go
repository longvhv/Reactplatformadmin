package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type TenantSubscriptionHandler struct {
	service *service.TenantSubscriptionService
}

func NewTenantSubscriptionHandler(service *service.TenantSubscriptionService) *TenantSubscriptionHandler {
	return &TenantSubscriptionHandler{service: service}
}

// CreateSubscription godoc
// @Summary Create a new tenant subscription
// @Tags tenant-subscriptions
// @Accept json
// @Produce json
// @Param subscription body models.CreateTenantSubscriptionRequest true "Subscription data"
// @Success 201 {object} models.TenantSubscription
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-subscriptions [post]
func (h *TenantSubscriptionHandler) CreateSubscription(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTenantSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	subscription, err := h.service.CreateSubscription(&req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, subscription)
}

// GetSubscription godoc
// @Summary Get a tenant subscription by ID
// @Tags tenant-subscriptions
// @Produce json
// @Param id path string true "Subscription ID"
// @Success 200 {object} models.TenantSubscription
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-subscriptions/{id} [get]
func (h *TenantSubscriptionHandler) GetSubscription(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	subscription, err := h.service.GetSubscription(id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, subscription)
}

// ListSubscriptions godoc
// @Summary List tenant subscriptions
// @Tags tenant-subscriptions
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param status query string false "Filter by status"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /tenant-subscriptions [get]
func (h *TenantSubscriptionHandler) ListSubscriptions(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	var tenantID *string
	if tid := query.Get("tenant_id"); tid != "" {
		tenantID = &tid
	}

	var status *string
	if s := query.Get("status"); s != "" {
		status = &s
	}

	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	subscriptions, total, err := h.service.ListSubscriptions(tenantID, status, page, pageSize)
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
		"data":       subscriptions,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"total_pages": (total + pageSize - 1) / pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// UpdateSubscription godoc
// @Summary Update a tenant subscription
// @Tags tenant-subscriptions
// @Accept json
// @Produce json
// @Param id path string true "Subscription ID"
// @Param subscription body models.UpdateTenantSubscriptionRequest true "Subscription update data"
// @Success 200 {object} models.TenantSubscription
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-subscriptions/{id} [put]
func (h *TenantSubscriptionHandler) UpdateSubscription(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req models.UpdateTenantSubscriptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	subscription, err := h.service.UpdateSubscription(id, &req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, subscription)
}

// DeleteSubscription godoc
// @Summary Delete a tenant subscription
// @Tags tenant-subscriptions
// @Param id path string true "Subscription ID"
// @Success 204
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /tenant-subscriptions/{id} [delete]
func (h *TenantSubscriptionHandler) DeleteSubscription(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	err := h.service.DeleteSubscription(id)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}
