package handler

import (
	"encoding/json"
	"net/http"

	"go.uber.org/zap"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/service"
	"github.com/vhv-platform/backend/pkg/logger"
)

// AuthHandler handles authentication endpoints
type AuthHandler struct {
	authService *service.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Login handles login request
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req service.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error("Failed to decode login request", zap.Error(err))
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid request body"))
		return
	}

	// Validate
	if req.Email == "" || req.Password == "" {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Email and password are required"))
		return
	}

	// Login
	response, err := h.authService.Login(r.Context(), req)
	if err != nil {
		logger.Error("Login failed", zap.Error(err), zap.String("email", req.Email))
		respondJSON(w, http.StatusUnauthorized, models.NewErrorResponse("AUTHENTICATION_FAILED", err.Error()))
		return
	}

	logger.Info("User logged in successfully", zap.String("email", req.Email))
	respondJSON(w, http.StatusOK, models.NewSuccessResponse(response))
}

// Register handles registration request
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req service.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Error("Failed to decode register request", zap.Error(err))
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid request body"))
		return
	}

	// Validate
	if req.Email == "" || req.Password == "" {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Email and password are required"))
		return
	}

	// Register
	user, err := h.authService.Register(r.Context(), req)
	if err != nil {
		logger.Error("Registration failed", zap.Error(err), zap.String("email", req.Email))
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("REGISTRATION_FAILED", err.Error()))
		return
	}

	logger.Info("User registered successfully", zap.String("email", req.Email))
	respondJSON(w, http.StatusCreated, models.NewSuccessResponse(user))
}

// RefreshToken handles token refresh request
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Invalid request body"))
		return
	}

	if req.RefreshToken == "" {
		respondJSON(w, http.StatusBadRequest, models.NewErrorResponse("VALIDATION_ERROR", "Refresh token is required"))
		return
	}

	response, err := h.authService.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		logger.Error("Token refresh failed", zap.Error(err))
		respondJSON(w, http.StatusUnauthorized, models.NewErrorResponse("INVALID_TOKEN", err.Error()))
		return
	}

	respondJSON(w, http.StatusOK, models.NewSuccessResponse(response))
}

// Logout handles logout request
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Get user ID from context (set by auth middleware)
	userID := GetUserIDFromContext(r.Context())
	if userID == nil {
		respondJSON(w, http.StatusUnauthorized, models.NewErrorResponse("UNAUTHORIZED", "User not authenticated"))
		return
	}

	if err := h.authService.Logout(r.Context(), *userID); err != nil {
		logger.Error("Logout failed", zap.Error(err))
		respondJSON(w, http.StatusInternalServerError, models.NewErrorResponse("LOGOUT_FAILED", "Failed to logout"))
		return
	}

	respondJSON(w, http.StatusOK, models.NewSuccessResponse(map[string]string{"message": "Logged out successfully"}))
}

// Helper function to send JSON response
func respondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}
