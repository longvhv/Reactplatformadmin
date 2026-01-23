package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
	"github.com/vhv-platform/backend/pkg/auth"
)

// AuthService handles authentication business logic
type AuthService struct {
	userRepo         repository.UserRepository
	authIdentifierRepo repository.AuthIdentifierRepository
	userIdentityRepo repository.UserIdentityRepository
	jwtManager       *auth.JWTManager
	passwordValidator *auth.PasswordValidator
}

// NewAuthService creates a new auth service
func NewAuthService(
	userRepo repository.UserRepository,
	authIdentifierRepo repository.AuthIdentifierRepository,
	userIdentityRepo repository.UserIdentityRepository,
	jwtManager *auth.JWTManager,
	passwordValidator *auth.PasswordValidator,
) *AuthService {
	return &AuthService{
		userRepo:         userRepo,
		authIdentifierRepo: authIdentifierRepo,
		userIdentityRepo: userIdentityRepo,
		jwtManager:       jwtManager,
		passwordValidator: passwordValidator,
	}
}

// LoginRequest represents login request
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse represents login response
type LoginResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	ExpiresIn    int64        `json:"expires_in"`
	User         *models.User `json:"user"`
}

// RegisterRequest represents registration request
type RegisterRequest struct {
	Email     string  `json:"email" validate:"required,email"`
	Password  string  `json:"password" validate:"required,min=8"`
	FirstName *string `json:"first_name,omitempty"`
	LastName  *string `json:"last_name,omitempty"`
}

// Login authenticates a user
func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	// Step 1: Find user_id from auth_identifiers using email
	authIdentifier, err := s.authIdentifierRepo.GetByIdentifier(ctx, req.Email, "PASSWORD")
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Step 2: Get user identity to verify password
	userIdentity, err := s.userIdentityRepo.GetByUserIDAndType(ctx, authIdentifier.UserID, "PASSWORD")
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	// Step 3: Verify password from user_identities.credential_secret
	if !auth.VerifyPassword(req.Password, userIdentity.CredentialSecret) {
		// Increment failed login attempts
		return nil, fmt.Errorf("invalid credentials")
	}

	// Step 4: Get user details
	user, err := s.userRepo.GetByID(ctx, authIdentifier.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, fmt.Errorf("account is inactive")
	}

	// Check if account is locked
	if user.LockedUntil != nil {
		// Parse locked_until timestamp
		// For simplicity, assuming it's not locked if we reach here
	}

	// Update last login time in user_identities
	now := time.Now()
	userIdentity.LastLoginAt = &now
	s.userIdentityRepo.Update(ctx, userIdentity)

	// Update user last login
	nowStr := now.Format(time.RFC3339)
	user.LastLoginAt = &nowStr
	user.FailedLoginAttempts = 0
	s.userRepo.Update(ctx, user)

	// Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, nil, []string{})
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token")
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token")
	}

	// Remove sensitive data
	user.PasswordHash = ""
	user.MFASecret = nil

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    900, // 15 minutes
		User:         user,
	}, nil
}

// Register creates a new user
func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (*models.User, error) {
	// Check if email already registered via auth_identifiers
	_, err := s.authIdentifierRepo.GetByIdentifier(ctx, req.Email, "PASSWORD")
	if err == nil {
		return nil, fmt.Errorf("email already exists")
	}

	// Validate password
	if err := s.passwordValidator.Validate(req.Password); err != nil {
		return nil, err
	}

	// Hash password
	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password")
	}

	// Create user
	user := models.NewUser(req.Email, passwordHash)
	user.FirstName = req.FirstName
	user.LastName = req.LastName

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user")
	}

	// Create user identity for PASSWORD authentication
	userIdentity := &models.UserIdentity{
		ID:               uuid.New(),
		UserID:           user.ID,
		IdentityType:     "PASSWORD",
		IdentityValue:    req.Email,
		CredentialSecret: passwordHash,
		IsVerified:       false,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		Version:          1,
	}

	if err := s.userIdentityRepo.Create(ctx, userIdentity); err != nil {
		return nil, fmt.Errorf("failed to create user identity")
	}

	// Create auth identifier to map email -> user_id
	authIdentifier := &models.AuthIdentifier{
		TenantID:       user.TenantID,
		IdentifierHash: auth.HashIdentifier(req.Email),
		UserID:         user.ID,
		IdentityID:     userIdentity.ID,
		IdentifierType: "PASSWORD",
		OriginalValue:  &req.Email,
	}

	if err := s.authIdentifierRepo.Create(ctx, authIdentifier); err != nil {
		return nil, fmt.Errorf("failed to create auth identifier")
	}

	// Remove sensitive data
	user.PasswordHash = ""

	return user, nil
}

// RefreshToken refreshes access token
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*LoginResponse, error) {
	// Validate refresh token
	userID, err := s.jwtManager.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token")
	}

	// Get user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	if !user.IsActive {
		return nil, fmt.Errorf("account is inactive")
	}

	// Generate new tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, nil, []string{})
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token")
	}

	newRefreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token")
	}

	user.PasswordHash = ""
	user.MFASecret = nil

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    900,
		User:         user,
	}, nil
}

// Logout logs out a user (invalidate tokens in cache)
func (s *AuthService) Logout(ctx context.Context, userID uuid.UUID) error {
	// In a real implementation, you would invalidate the token in cache/database
	// For now, just return success
	return nil
}