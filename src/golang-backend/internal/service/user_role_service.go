package service

import (
	"fmt"
	"time"

	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type UserRoleService struct {
	repo *repository.UserRoleRepository
}

func NewUserRoleService(repo *repository.UserRoleRepository) *UserRoleService {
	return &UserRoleService{repo: repo}
}

func (s *UserRoleService) AssignRole(req *models.CreateUserRoleRequest) (*models.UserRole, error) {
	// Validate expiration date
	if req.ExpiresAt != nil && req.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("expires_at cannot be in the past")
	}

	return s.repo.Create(req)
}

func (s *UserRoleService) GetUserRole(id string) (*models.UserRole, error) {
	return s.repo.GetByID(id)
}

func (s *UserRoleService) GetUserRoles(userID string, tenantID *string) ([]*models.UserRole, error) {
	return s.repo.GetByUserID(userID, tenantID)
}

func (s *UserRoleService) ListUserRoles(userID *string, roleID *string, tenantID *string, page, pageSize int) ([]*models.UserRole, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	return s.repo.List(userID, roleID, tenantID, pageSize, offset)
}

func (s *UserRoleService) UpdateUserRole(id string, req *models.UpdateUserRoleRequest) (*models.UserRole, error) {
	// Validate expiration date if provided
	if req.ExpiresAt != nil && req.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("expires_at cannot be in the past")
	}

	return s.repo.Update(id, req)
}

func (s *UserRoleService) RevokeRole(id string) error {
	return s.repo.Delete(id)
}

func (s *UserRoleService) RevokeExpiredRoles() (int64, error) {
	return s.repo.RevokeExpiredRoles()
}
