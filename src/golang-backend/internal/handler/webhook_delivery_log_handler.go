package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/service"
)

type WebhookDeliveryLogHandler struct {
	service *service.WebhookDeliveryLogService
}

func NewWebhookDeliveryLogHandler(service *service.WebhookDeliveryLogService) *WebhookDeliveryLogHandler {
	return &WebhookDeliveryLogHandler{service: service}
}

// CreateLog godoc
// @Summary Create a new webhook delivery log
// @Tags webhook-delivery-logs
// @Accept json
// @Produce json
// @Param log body models.CreateWebhookDeliveryLogRequest true "Log data"
// @Success 201 {object} models.WebhookDeliveryLog
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /webhook-delivery-logs [post]
func (h *WebhookDeliveryLogHandler) CreateLog(w http.ResponseWriter, r *http.Request) {
	var req models.CreateWebhookDeliveryLogRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	log, err := h.service.CreateLog(&req)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusCreated, log)
}

// GetLog godoc
// @Summary Get a webhook delivery log by ID
// @Tags webhook-delivery-logs
// @Produce json
// @Param id path string true "Log ID"
// @Success 200 {object} models.WebhookDeliveryLog
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /webhook-delivery-logs/{id} [get]
func (h *WebhookDeliveryLogHandler) GetLog(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	log, err := h.service.GetLog(id)
	if err != nil {
		respondWithError(w, http.StatusNotFound, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, log)
}

// ListLogs godoc
// @Summary List webhook delivery logs
// @Tags webhook-delivery-logs
// @Produce json
// @Param tenant_id query string false "Filter by tenant ID"
// @Param webhook_id query string false "Filter by webhook ID"
// @Param is_success query bool false "Filter by success status"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /webhook-delivery-logs [get]
func (h *WebhookDeliveryLogHandler) ListLogs(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	var tenantID *string
	if tid := query.Get("tenant_id"); tid != "" {
		tenantID = &tid
	}

	var webhookID *string
	if wid := query.Get("webhook_id"); wid != "" {
		webhookID = &wid
	}

	var isSuccess *bool
	if is := query.Get("is_success"); is != "" {
		success := is == "true"
		isSuccess = &success
	}

	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	logs, total, err := h.service.ListLogs(tenantID, webhookID, isSuccess, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"data":      logs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// ListLogsByWebhook godoc
// @Summary List delivery logs for a specific webhook
// @Tags webhook-delivery-logs
// @Produce json
// @Param webhook_id path string true "Webhook ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /webhooks/{webhook_id}/delivery-logs [get]
func (h *WebhookDeliveryLogHandler) ListLogsByWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	webhookID := vars["webhook_id"]

	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	logs, total, err := h.service.ListLogsByWebhook(webhookID, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"data":      logs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// ListLogsByTenant godoc
// @Summary List delivery logs for a specific tenant
// @Tags webhook-delivery-logs
// @Produce json
// @Param tenant_id path string true "Tenant ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(20)
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /tenants/{tenant_id}/webhook-delivery-logs [get]
func (h *WebhookDeliveryLogHandler) ListLogsByTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	query := r.URL.Query()
	page, _ := strconv.Atoi(query.Get("page"))
	pageSize, _ := strconv.Atoi(query.Get("page_size"))

	logs, total, err := h.service.ListLogsByTenant(tenantID, page, pageSize)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := map[string]interface{}{
		"data":      logs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetWebhookStats godoc
// @Summary Get delivery statistics for a webhook
// @Tags webhook-delivery-logs
// @Produce json
// @Param webhook_id path string true "Webhook ID"
// @Success 200 {object} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Router /webhooks/{webhook_id}/delivery-stats [get]
func (h *WebhookDeliveryLogHandler) GetWebhookStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	webhookID := vars["webhook_id"]

	stats, err := h.service.GetStats(webhookID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondWithJSON(w, http.StatusOK, stats)
}
