package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/pkg/cache"
)

// UserService handles user business logic
type UserService struct {
	userRepo repository.UserRepository
	cache    cache.Cache
}

// NewUserService creates a new user service
func NewUserService(userRepo repository.UserRepository, cache cache.Cache) *UserService {
	return &UserService{
		userRepo: userRepo,
		cache:    cache,
	}
}

// CreateUserRequest represents create user request
type CreateUserRequest struct {
	Email       string                 `json:"email" binding:"required,email"`
	Password    string                 `json:"password" binding:"required,min=8"`
	FirstName   *string                `json:"first_name"`
	LastName    *string                `json:"last_name"`
	PhoneNumber *string                `json:"phone_number"`
	TenantID    uuid.UUID              `json:"tenant_id"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// UpdateUserRequest represents update user request
type UpdateUserRequest struct {
	FirstName   *string                `json:"first_name"`
	LastName    *string                `json:"last_name"`
	PhoneNumber *string                `json:"phone_number"`
	AvatarURL   *string                `json:"avatar_url"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// GetByID gets user by ID
func (s *UserService) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	// Try cache first
	cacheKey := cache.UserCacheKey(id.String())
	var user models.User
	err := s.cache.GetJSON(ctx, cacheKey, &user)
	if err == nil {
		return &user, nil
	}

	// Get from database
	dbUser, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Cache user
	_ = s.cache.SetJSON(ctx, cacheKey, dbUser, cache.UserTTL)

	// Remove sensitive data
	dbUser.PasswordHash = ""
	dbUser.MFASecret = nil

	return dbUser, nil
}

// ListByTenant lists users by tenant
func (s *UserService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.User, int64, error) {
	offset := (page - 1) * limit
	users, total, err := s.userRepo.ListByTenant(ctx, tenantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	// Remove sensitive data
	for _, user := range users {
		user.PasswordHash = ""
		user.MFASecret = nil
	}

	return users, total, nil
}

// CreateUser creates a new user
func (s *UserService) CreateUser(ctx context.Context, req CreateUserRequest) (*models.User, error) {
	// Check if email exists
	exists, err := s.userRepo.Exists(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("email already exists")
	}

	// Hash password
	passwordHash, err := hashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: passwordHash,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		PhoneNumber:  req.PhoneNumber,
		TenantID:     req.TenantID,
		IsActive:     true,
		Metadata:     req.Metadata,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Remove sensitive data
	user.PasswordHash = ""

	return user, nil
}

// UpdateUser updates a user
func (s *UserService) UpdateUser(ctx context.Context, id uuid.UUID, req UpdateUserRequest) (*models.User, error) {
	// Get existing user
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	// Update fields
	if req.FirstName != nil {
		user.FirstName = req.FirstName
	}
	if req.LastName != nil {
		user.LastName = req.LastName
	}
	if req.PhoneNumber != nil {
		user.PhoneNumber = req.PhoneNumber
	}
	if req.AvatarURL != nil {
		user.AvatarURL = req.AvatarURL
	}
	if req.Metadata != nil {
		user.Metadata = req.Metadata
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Invalidate cache
	cacheKey := cache.UserCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	// Remove sensitive data
	user.PasswordHash = ""
	user.MFASecret = nil

	return user, nil
}

// DeleteUser deletes a user
func (s *UserService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	if err := s.userRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	// Invalidate cache
	cacheKey := cache.UserCacheKey(id.String())
	_ = s.cache.Delete(ctx, cacheKey)

	return nil
}

// hashPassword hashes a password using bcrypt
func hashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}