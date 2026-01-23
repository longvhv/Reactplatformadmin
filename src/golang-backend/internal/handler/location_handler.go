package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/logger"
)

// LocationHandler handles location endpoints
type LocationHandler struct {
	locationService *service.LocationService
}

// NewLocationHandler creates a new location handler
func NewLocationHandler(locationService *service.LocationService) *LocationHandler {
	return &LocationHandler{
		locationService: locationService,
	}
}

// Create creates a new location
func (h *LocationHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req service.CreateLocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid request body"))
		return
	}

	if req.Code == "" || req.Name == "" {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Code and name are required"))
		return
	}

	location, err := h.locationService.CreateLocation(r.Context(), req)
	if err != nil {
		logger.Error("Failed to create location", zap.Error(err))
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("CREATE_FAILED", err.Error()))
		return
	}

	respondJSON(w, http.StatusCreated, models.NewSuccessResponse(location))
}

// GetByID gets location by ID
func (h *LocationHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid location ID"))
		return
	}

	location, err := h.locationService.GetLocation(r.Context(), id)
	if err != nil {
		logger.Error("Failed to get location", zap.Error(err))
		respondJSON(w, http.StatusNotFound, models.NewErrorResponse("NOT_FOUND", "Location not found"))
		return
	}

	respondJSON(w, http.StatusOK, models.NewSuccessResponse(location))
}

// List lists locations for a tenant
func (h *LocationHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantIDStr := chi.URLParam(r, "tenantID")
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid tenant ID"))
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	// Check if filtering by type
	if typeIDStr := r.URL.Query().Get("type_id"); typeIDStr != "" {
		typeID, err := uuid.Parse(typeIDStr)
		if err == nil {
			locations, meta, err := h.locationService.ListLocationsByType(r.Context(), tenantID, typeID, page, limit)
			if err != nil {
				logger.Error("Failed to list locations by type", zap.Error(err))
				respondJSON(w, http.StatusInternalServerError, models.NewErrorResponse("INTERNAL_ERROR", "Failed to list locations"))
				return
			}
			respondJSON(w, http.StatusOK, models.NewSuccessResponseWithMeta(locations, meta))
			return
		}
	}

	locations, meta, err := h.locationService.ListLocations(r.Context(), tenantID, page, limit)
	if err != nil {
		logger.Error("Failed to list locations", zap.Error(err))
		respondJSON(w, http.StatusInternalServerError, models.NewErrorResponse("INTERNAL_ERROR", "Failed to list locations"))
		return
	}

	respondJSON(w, http.StatusOK, models.NewSuccessResponseWithMeta(locations, meta))
}

// Update updates a location
func (h *LocationHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid location ID"))
		return
	}

	var req service.UpdateLocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid request body"))
		return
	}

	location, err := h.locationService.UpdateLocation(r.Context(), id, req)
	if err != nil {
		logger.Error("Failed to update location", zap.Error(err))
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("UPDATE_FAILED", err.Error()))
		return
	}

	respondJSON(w, http.StatusOK, models.NewSuccessResponse(location))
}

// Delete deletes a location
func (h *LocationHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid location ID"))
		return
	}

	if err := h.locationService.DeleteLocation(r.Context(), id); err != nil {
		logger.Error("Failed to delete location", zap.Error(err))
		respondJSON(w, http.StatusInternalServerError, models.NewErrorResponse("DELETE_FAILED", "Failed to delete location"))
		return
	}

	respondJSON(w, http.StatusOK, models.NewSuccessResponse(map[string]string{"message": "Location deleted successfully"}))
}
