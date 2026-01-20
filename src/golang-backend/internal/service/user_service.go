package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

// UserService handles business logic for users
type UserService struct {
	repo *repository.UserRepository
}

// NewUserService creates a new user service
func NewUserService(repo *repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

// GetAll retrieves all users with filters
func (s *UserService) GetAll(ctx context.Context, filters models.UserFilters) ([]models.User, error) {
	return s.repo.GetAll(ctx, filters)
}

// GetByID retrieves a user by ID
func (s *UserService) GetByID(ctx context.Context, id string) (*models.User, error) {
	// Validate UUID
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid user ID format")
	}

	return s.repo.GetByID(ctx, id)
}

// GetByEmail retrieves a user by email
func (s *UserService) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	if !isValidEmail(email) {
		return nil, fmt.Errorf("invalid email format")
	}

	return s.repo.GetByEmail(ctx, email)
}

// Create creates a new user
func (s *UserService) Create(ctx context.Context, req models.CreateUserRequest) (*models.User, error) {
	// Validate request
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	// Check if email already exists
	existing, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("email already exists")
	}

	return s.repo.Create(ctx, req)
}

// Update updates a user
func (s *UserService) Update(ctx context.Context, id string, req models.UpdateUserRequest) (*models.User, error) {
	// Validate UUID
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid user ID format")
	}

	// Validate request
	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	// Check if user exists
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, id, req)
}

// Delete deletes a user
func (s *UserService) Delete(ctx context.Context, id string) error {
	// Validate UUID
	if !isValidUUID(id) {
		return fmt.Errorf("invalid user ID format")
	}

	// Check if user exists
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// TODO: Check if user has active sessions or assignments
	// TODO: Cascade delete related data (user_roles, user_sessions, etc.)

	return s.repo.Delete(ctx, id)
}

// UpdateStatus updates user status
func (s *UserService) UpdateStatus(ctx context.Context, id string, status models.UserStatus) (*models.User, error) {
	// Validate UUID
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid user ID format")
	}

	// Validate status
	if !isValidUserStatus(status) {
		return nil, fmt.Errorf("invalid user status")
	}

	return s.repo.Update(ctx, id, models.UpdateUserRequest{
		Status: &status,
	})
}

// EnableMFA enables MFA for a user
func (s *UserService) EnableMFA(ctx context.Context, id string) (*models.User, error) {
	enabled := true
	return s.repo.Update(ctx, id, models.UpdateUserRequest{
		MFAEnabled: &enabled,
	})
}

// DisableMFA disables MFA for a user
func (s *UserService) DisableMFA(ctx context.Context, id string) (*models.User, error) {
	disabled := false
	return s.repo.Update(ctx, id, models.UpdateUserRequest{
		MFAEnabled: &disabled,
	})
}

// validateCreateRequest validates create user request
func (s *UserService) validateCreateRequest(req models.CreateUserRequest) error {
	// Validate email
	if !isValidEmail(req.Email) {
		return fmt.Errorf("invalid email format")
	}

	// Validate full name
	fullName := strings.TrimSpace(req.FullName)
	if fullName == "" {
		return fmt.Errorf("full name is required")
	}
	if len(fullName) > 255 {
		return fmt.Errorf("full name cannot exceed 255 characters")
	}

	// Validate phone number if provided
	if req.PhoneNumber != nil && *req.PhoneNumber != "" {
		if !isValidPhoneNumber(*req.PhoneNumber) {
			return fmt.Errorf("invalid phone number format")
		}
	}

	// Validate status if provided
	if req.Status != "" && !isValidUserStatus(req.Status) {
		return fmt.Errorf("invalid user status")
	}

	// Validate locale if provided
	if req.Locale != "" && !isValidLocale(req.Locale) {
		return fmt.Errorf("invalid locale: must be one of vi, en, es, ja, ko, zh")
	}

	return nil
}

// validateUpdateRequest validates update user request
func (s *UserService) validateUpdateRequest(req models.UpdateUserRequest) error {
	// Validate full name if provided
	if req.FullName != nil {
		fullName := strings.TrimSpace(*req.FullName)
		if fullName == "" {
			return fmt.Errorf("full name cannot be empty")
		}
		if len(fullName) > 255 {
			return fmt.Errorf("full name cannot exceed 255 characters")
		}
	}

	// Validate phone number if provided
	if req.PhoneNumber != nil && *req.PhoneNumber != "" {
		if !isValidPhoneNumber(*req.PhoneNumber) {
			return fmt.Errorf("invalid phone number format")
		}
	}

	// Validate status if provided
	if req.Status != nil && !isValidUserStatus(*req.Status) {
		return fmt.Errorf("invalid user status")
	}

	// Validate locale if provided
	if req.Locale != nil && !isValidLocale(*req.Locale) {
		return fmt.Errorf("invalid locale: must be one of vi, en, es, ja, ko, zh")
	}

	return nil
}

// Helper validation functions
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

func isValidPhoneNumber(phone string) bool {
	// Basic phone validation (customize based on requirements)
	phoneRegex := regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)
	return phoneRegex.MatchString(phone)
}

func isValidUserStatus(status models.UserStatus) bool {
	return status == models.UserStatusActive ||
		status == models.UserStatusInactive ||
		status == models.UserStatusSuspended ||
		status == models.UserStatusPending
}

func isValidLocale(locale string) bool {
	validLocales := []string{"vi", "en", "es", "ja", "ko", "zh"}
	for _, valid := range validLocales {
		if locale == valid {
			return true
		}
	}
	return false
}
