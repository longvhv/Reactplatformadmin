package httputil

import (
	"encoding/json"
	"net/http"

	"github.com/vhv-platform/backend/internal/models"
)

// RespondJSON writes JSON response
func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

// RespondSuccess writes success response
func RespondSuccess(w http.ResponseWriter, data interface{}) {
	response := models.NewSuccessResponse(data)
	RespondJSON(w, http.StatusOK, response)
}

// RespondCreated writes created response
func RespondCreated(w http.ResponseWriter, data interface{}) {
	response := models.NewSuccessResponse(data)
	RespondJSON(w, http.StatusCreated, response)
}

// RespondError writes error response
func RespondError(w http.ResponseWriter, status int, code, message string) {
	response := models.NewErrorResponse(code, message)
	RespondJSON(w, status, response)
}

// RespondBadRequest writes bad request error
func RespondBadRequest(w http.ResponseWriter, message string) {
	RespondError(w, http.StatusBadRequest, "BAD_REQUEST", message)
}

// RespondUnauthorized writes unauthorized error
func RespondUnauthorized(w http.ResponseWriter, message string) {
	RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", message)
}

// RespondForbidden writes forbidden error
func RespondForbidden(w http.ResponseWriter, message string) {
	RespondError(w, http.StatusForbidden, "FORBIDDEN", message)
}

// RespondNotFound writes not found error
func RespondNotFound(w http.ResponseWriter, message string) {
	RespondError(w, http.StatusNotFound, "NOT_FOUND", message)
}

// RespondConflict writes conflict error
func RespondConflict(w http.ResponseWriter, message string) {
	RespondError(w, http.StatusConflict, "CONFLICT", message)
}

// RespondInternalError writes internal server error
func RespondInternalError(w http.ResponseWriter, message string) {
	RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", message)
}

// RespondValidationError writes validation error
func RespondValidationError(w http.ResponseWriter, errors []string) {
	response := map[string]interface{}{
		"success": false,
		"error": map[string]interface{}{
			"code":    "VALIDATION_ERROR",
			"message": "Validation failed",
			"details": errors,
		},
	}
	RespondJSON(w, http.StatusBadRequest, response)
}

// ParseRequestBody parses JSON request body
func ParseRequestBody(r *http.Request, v interface{}) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}
