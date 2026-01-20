package service

import (
	"fmt"
	"time"

	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type UserSessionService struct {
	repo *repository.UserSessionRepository
}

func NewUserSessionService(repo *repository.UserSessionRepository) *UserSessionService {
	return &UserSessionService{repo: repo}
}

func (s *UserSessionService) CreateSession(req *models.CreateUserSessionRequest) (*models.UserSession, error) {
	// Validate expiration date
	if req.ExpiresAt != nil && req.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("expires_at cannot be in the past")
	}

	return s.repo.Create(req)
}

func (s *UserSessionService) GetSession(id string) (*models.UserSession, error) {
	return s.repo.GetByID(id)
}

func (s *UserSessionService) GetSessionByToken(token string) (*models.UserSession, error) {
	return s.repo.GetByToken(token)
}

func (s *UserSessionService) GetUserSessions(userID string) ([]*models.UserSession, error) {
	return s.repo.GetByUserID(userID)
}

func (s *UserSessionService) ListSessions(userID *string, isActive *bool, page, pageSize int) ([]*models.UserSession, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.List(userID, isActive, pageSize, offset)
}

func (s *UserSessionService) UpdateSession(id string, req *models.UpdateUserSessionRequest) (*models.UserSession, error) {
	return s.repo.Update(id, req)
}

func (s *UserSessionService) UpdateSessionActivity(sessionID string) error {
	return s.repo.UpdateActivity(sessionID)
}

func (s *UserSessionService) DeleteSession(id string) error {
	return s.repo.Delete(id)
}

func (s *UserSessionService) DeleteAllUserSessions(userID string) error {
	return s.repo.DeleteByUserID(userID)
}

func (s *UserSessionService) DeactivateExpiredSessions() (int64, error) {
	return s.repo.DeactivateExpiredSessions()
}
