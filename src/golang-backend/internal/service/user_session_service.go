package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type UserSessionService struct {
	sessionRepo repository.UserSessionRepository
}

func NewUserSessionService(sessionRepo repository.UserSessionRepository) *UserSessionService {
	return &UserSessionService{
		sessionRepo: sessionRepo,
	}
}

type CreateSessionRequest struct {
	UserID       uuid.UUID  `json:"user_id" binding:"required"`
	DeviceID     *uuid.UUID `json:"device_id"`
	DeviceType   *string    `json:"device_type"`
	DeviceName   *string    `json:"device_name"`
	Browser      *string    `json:"browser"`
	OS           *string    `json:"os"`
	IPAddress    string     `json:"-"`
	UserAgent    string     `json:"-"`
	Location     *string    `json:"location"`
	ExpiresInSec int        `json:"expires_in_sec"`
}

// GetByID gets session by ID
func (s *UserSessionService) GetByID(ctx context.Context, id uuid.UUID) (*models.UserSession, error) {
	return s.sessionRepo.GetByID(ctx, id)
}

// GetByToken gets session by token
func (s *UserSessionService) GetByToken(ctx context.Context, token string) (*models.UserSession, error) {
	return s.sessionRepo.GetByToken(ctx, token)
}

// ListByUser lists sessions by user
func (s *UserSessionService) ListByUser(ctx context.Context, userID uuid.UUID, page, limit int) ([]*models.UserSession, int64, error) {
	offset := (page - 1) * limit
	return s.sessionRepo.ListByUser(ctx, userID, limit, offset)
}

// CreateSession creates a new session
func (s *UserSessionService) CreateSession(ctx context.Context, req CreateSessionRequest) (*models.UserSession, error) {
	// Generate session token
	token, err := s.generateToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Parse IP address
	var ipAddr *net.IP
	if req.IPAddress != "" {
		parsed := net.ParseIP(req.IPAddress)
		if parsed != nil {
			ipAddr = &parsed
		}
	}

	// Calculate expiration
	expiresIn := req.ExpiresInSec
	if expiresIn == 0 {
		expiresIn = 86400 // 24 hours default
	}
	expiresAt := time.Now().Add(time.Duration(expiresIn) * time.Second)

	now := time.Now()
	session := &models.UserSession{
		ID:             uuid.New(),
		UserID:         req.UserID,
		DeviceID:       req.DeviceID,
		Token:          token,
		DeviceType:     req.DeviceType,
		DeviceName:     req.DeviceName,
		Browser:        req.Browser,
		OS:             req.OS,
		IPAddress:      ipAddr,
		Location:       req.Location,
		IsActive:       true,
		LastActivityAt: now,
		ExpiresAt:      &expiresAt,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

// DeleteSession deletes a session
func (s *UserSessionService) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return s.sessionRepo.Delete(ctx, id)
}

// RevokeSession revokes a session
func (s *UserSessionService) RevokeSession(ctx context.Context, id uuid.UUID) (*models.UserSession, error) {
	session, err := s.sessionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}

	session.IsActive = false
	session.UpdatedAt = time.Now()

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to revoke session: %w", err)
	}

	return session, nil
}

// RefreshSession refreshes a session
func (s *UserSessionService) RefreshSession(ctx context.Context, id uuid.UUID) (*models.UserSession, error) {
	session, err := s.sessionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}

	if !session.IsActive {
		return nil, fmt.Errorf("session is not active")
	}

	// Check if expired
	if session.ExpiresAt != nil && session.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("session has expired")
	}

	// Extend expiration
	newExpiresAt := time.Now().Add(24 * time.Hour)
	session.ExpiresAt = &newExpiresAt
	session.UpdatedAt = time.Now()

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to refresh session: %w", err)
	}

	return session, nil
}

// UpdateActivity updates session activity
func (s *UserSessionService) UpdateActivity(ctx context.Context, id uuid.UUID) (*models.UserSession, error) {
	session, err := s.sessionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}

	session.LastActivityAt = time.Now()
	session.UpdatedAt = time.Now()

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, fmt.Errorf("failed to update activity: %w", err)
	}

	return session, nil
}

// GetActiveSessions gets active sessions for user
func (s *UserSessionService) GetActiveSessions(ctx context.Context, userID uuid.UUID) ([]*models.UserSession, error) {
	sessions, _, err := s.sessionRepo.ListByUser(ctx, userID, 1000, 0)
	if err != nil {
		return nil, err
	}

	active := make([]*models.UserSession, 0)
	now := time.Now()

	for _, session := range sessions {
		if session.IsActive {
			// Check expiration
			if session.ExpiresAt == nil || session.ExpiresAt.After(now) {
				active = append(active, session)
			}
		}
	}

	return active, nil
}

// RevokeAllSessions revokes all sessions for user
func (s *UserSessionService) RevokeAllSessions(ctx context.Context, userID uuid.UUID, exceptCurrent bool) (int, error) {
	sessions, _, err := s.sessionRepo.ListByUser(ctx, userID, 1000, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, session := range sessions {
		if session.IsActive {
			// TODO: Skip current session if exceptCurrent is true
			session.IsActive = false
			session.UpdatedAt = time.Now()
			_ = s.sessionRepo.Update(ctx, session)
			count++
		}
	}

	return count, nil
}

// ValidateSession validates a session token
func (s *UserSessionService) ValidateSession(ctx context.Context, token string) (*models.UserSession, error) {
	session, err := s.sessionRepo.GetByToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("invalid session token")
	}

	// Check if active
	if !session.IsActive {
		return nil, fmt.Errorf("session is not active")
	}

	// Check expiration
	if session.ExpiresAt != nil && session.ExpiresAt.Before(time.Now()) {
		// Auto-revoke expired session
		session.IsActive = false
		_ = s.sessionRepo.Update(ctx, session)
		return nil, fmt.Errorf("session has expired")
	}

	// Update activity
	session.LastActivityAt = time.Now()
	_ = s.sessionRepo.Update(ctx, session)

	return session, nil
}

// CleanupExpiredSessions removes expired sessions
func (s *UserSessionService) CleanupExpiredSessions(ctx context.Context) (int, error) {
	// Get all sessions (this would typically be optimized with a query)
	sessions, _, err := s.sessionRepo.ListByUser(ctx, uuid.Nil, 10000, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	now := time.Now()

	for _, session := range sessions {
		// Delete expired sessions
		if session.ExpiresAt != nil && session.ExpiresAt.Before(now) {
			_ = s.sessionRepo.Delete(ctx, session.ID)
			count++
		}
	}

	return count, nil
}

// CleanupInactiveSessions removes inactive sessions
func (s *UserSessionService) CleanupInactiveSessions(ctx context.Context, inactiveDays int) (int, error) {
	sessions, _, err := s.sessionRepo.ListByUser(ctx, uuid.Nil, 10000, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	cutoff := time.Now().AddDate(0, 0, -inactiveDays)

	for _, session := range sessions {
		if session.LastActivityAt.Before(cutoff) {
			_ = s.sessionRepo.Delete(ctx, session.ID)
			count++
		}
	}

	return count, nil
}

// GetSessionsByDevice gets sessions by device
func (s *UserSessionService) GetSessionsByDevice(ctx context.Context, deviceID uuid.UUID) ([]*models.UserSession, error) {
	sessions, _, err := s.sessionRepo.ListByUser(ctx, uuid.Nil, 10000, 0)
	if err != nil {
		return nil, err
	}

	deviceSessions := make([]*models.UserSession, 0)
	for _, session := range sessions {
		if session.DeviceID != nil && *session.DeviceID == deviceID {
			deviceSessions = append(deviceSessions, session)
		}
	}

	return deviceSessions, nil
}

// Helper function to generate session token
func (s *UserSessionService) generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

// GetSessionDuration gets session duration
func (s *UserSessionService) GetSessionDuration(session *models.UserSession) time.Duration {
	return session.LastActivityAt.Sub(session.CreatedAt)
}

// IsSessionExpired checks if session is expired
func (s *UserSessionService) IsSessionExpired(session *models.UserSession) bool {
	if session.ExpiresAt == nil {
		return false
	}
	return session.ExpiresAt.Before(time.Now())
}
