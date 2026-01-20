package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type WebhookHandler struct {
	service *service.WebhookService
}

func NewWebhookHandler(service *service.WebhookService) *WebhookHandler {
	return &WebhookHandler{service: service}
}

// CreateWebhook godoc
// @Summary Create a new webhook
// @Tags webhooks
// @Accept json
// @Produce json
// @Param webhook body models.CreateWebhookRequest true "Webhook data"
// @Success 201 {object} models.Webhook
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /webhooks [post]
func (h *WebhookHandler) CreateWebhook(w http.ResponseWriter, r *http.Request) {
	var req models.CreateWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	webhook, err := h.service.CreateWebhook(&req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, webhook)
}

// GetWebhook godoc
// @Summary Get a webhook by ID
// @Tags webhooks
// @Produce json
// @Param id path string true "Webhook ID"
// @Success 200 {object} models.Webhook
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /webhooks/{id} [get]
func (h *WebhookHandler) GetWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	webhook, err := h.service.GetWebhook(id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, webhook)
}

// ListWebhooks godoc
// @Summary List webhooks
// @Tags webhooks
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param is_active query bool false "Filter by active status"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /webhooks [get]
func (h *WebhookHandler) ListWebhooks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	var tenantID *string
	if tid := query.Get("tenant_id"); tid != "" {
		tenantID = &tid
	}

	var isActive *bool
	if ia := query.Get("is_active"); ia != "" {
		active := ia == "true"
		isActive = &active
	}

	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	webhooks, total, err := h.service.ListWebhooks(tenantID, isActive, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"data":      webhooks,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// ListWebhooksByTenant godoc
// @Summary List webhooks for a specific tenant
// @Tags webhooks
// @Produce json
// @Param tenant_id path string true "Tenant ID"
// @Success 200 {array} models.Webhook
// @Failure 500 {object} map[string]string
// @Router /tenants/{tenant_id}/webhooks [get]
func (h *WebhookHandler) ListWebhooksByTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	webhooks, err := h.service.ListWebhooksByTenant(tenantID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, webhooks)
}

// UpdateWebhook godoc
// @Summary Update a webhook
// @Tags webhooks
// @Accept json
// @Produce json
// @Param id path string true "Webhook ID"
// @Param webhook body models.UpdateWebhookRequest true "Update data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /webhooks/{id} [put]
func (h *WebhookHandler) UpdateWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var req models.UpdateWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := h.service.UpdateWebhook(id, &req); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Webhook updated successfully"})
}

// DeleteWebhook godoc
// @Summary Delete a webhook
// @Tags webhooks
// @Produce json
// @Param id path string true "Webhook ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /webhooks/{id} [delete]
func (h *WebhookHandler) DeleteWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.DeleteWebhook(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Webhook deleted successfully"})
}

// VerifyWebhook godoc
// @Summary Verify a webhook
// @Tags webhooks
// @Produce json
// @Param id path string true "Webhook ID"
// @Success 200 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /webhooks/{id}/verify [post]
func (h *WebhookHandler) VerifyWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := h.service.VerifyWebhook(id); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Webhook verified successfully"})
}

// UpdateWebhookStats godoc
// @Summary Update webhook statistics after delivery
// @Tags webhooks
// @Accept json
// @Produce json
// @Param id path string true "Webhook ID"
// @Param stats body map[string]interface{} true "Stats data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /webhooks/{id}/stats [post]
func (h *WebhookHandler) UpdateWebhookStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	var stats struct {
		IsSuccess       bool `json:"is_success"`
		ResponseTimeMs  int  `json:"response_time_ms"`
	}

	if err := json.NewDecoder(r.Body).Decode(&stats); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := h.service.UpdateStats(id, stats.IsSuccess, stats.ResponseTimeMs); err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Webhook stats updated successfully"})
}
