package service

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/yourusername/golang-backend/internal/models"
	"github.com/yourusername/golang-backend/internal/repository"
)

type TenantInvitationService struct {
	repo *repository.TenantInvitationRepository
}

func NewTenantInvitationService(repo *repository.TenantInvitationRepository) *TenantInvitationService {
	return &TenantInvitationService{repo: repo}
}

// CreateInvitation creates a new tenant invitation
func (s *TenantInvitationService) CreateInvitation(req *models.CreateTenantInvitationRequest) (*models.TenantInvitation, error) {
	invitation := &models.TenantInvitation{
		TenantID:     req.TenantID,
		Email:        req.Email,
		RoleIDs:      pq.StringArray(req.RoleIDs),
		DepartmentID: req.DepartmentID,
		InvitedBy:    req.InvitedBy,
	}

	if req.ExpiresAt != nil {
		invitation.ExpiresAt = *req.ExpiresAt
	} else {
		// Default expiration: 7 days
		invitation.ExpiresAt = time.Now().Add(7 * 24 * time.Hour)
	}

	if invitation.RoleIDs == nil {
		invitation.RoleIDs = pq.StringArray{}
	}

	err := s.repo.Create(invitation)
	if err != nil {
		return nil, err
	}

	return invitation, nil
}

// GetInvitation retrieves a tenant invitation by ID
func (s *TenantInvitationService) GetInvitation(id uuid.UUID) (*models.TenantInvitation, error) {
	return s.repo.GetByID(id)
}

// GetInvitationByToken retrieves a tenant invitation by token
func (s *TenantInvitationService) GetInvitationByToken(token string) (*models.TenantInvitation, error) {
	return s.repo.GetByToken(token)
}

// ListInvitations retrieves tenant invitations with pagination and filters
func (s *TenantInvitationService) ListInvitations(page, pageSize int, filters map[string]interface{}) ([]models.TenantInvitation, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	return s.repo.List(page, pageSize, filters)
}

// ListInvitationsByTenant retrieves all invitations for a specific tenant
func (s *TenantInvitationService) ListInvitationsByTenant(tenantID uuid.UUID, page, pageSize int) ([]models.TenantInvitation, int, error) {
	return s.repo.ListByTenantID(tenantID, page, pageSize)
}

// UpdateInvitation updates a tenant invitation
func (s *TenantInvitationService) UpdateInvitation(id uuid.UUID, req *models.UpdateTenantInvitationRequest) (*models.TenantInvitation, error) {
	updates := make(map[string]interface{})

	if req.RoleIDs != nil {
		updates["role_ids"] = pq.StringArray(req.RoleIDs)
	}
	if req.DepartmentID != nil {
		updates["department_id"] = *req.DepartmentID
	}
	if req.ExpiresAt != nil {
		updates["expires_at"] = *req.ExpiresAt
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	return s.repo.Update(id, updates)
}

// AcceptInvitation accepts a tenant invitation
func (s *TenantInvitationService) AcceptInvitation(token string) (*models.TenantInvitation, error) {
	invitation, err := s.repo.GetByToken(token)
	if err != nil {
		return nil, err
	}

	// Check if invitation is still pending
	if invitation.Status != "PENDING" {
		return nil, fmt.Errorf("invitation is not pending")
	}

	// Check if invitation has expired
	if time.Now().After(invitation.ExpiresAt) {
		// Mark as expired
		_ = s.repo.UpdateStatus(invitation.ID, "EXPIRED")
		return nil, fmt.Errorf("invitation has expired")
	}

	// Update status to accepted
	err = s.repo.UpdateStatus(invitation.ID, "ACCEPTED")
	if err != nil {
		return nil, err
	}

	return s.repo.GetByID(invitation.ID)
}

// RevokeInvitation revokes a tenant invitation
func (s *TenantInvitationService) RevokeInvitation(id uuid.UUID) error {
	invitation, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	// Only pending invitations can be revoked
	if invitation.Status != "PENDING" {
		return fmt.Errorf("only pending invitations can be revoked")
	}

	return s.repo.UpdateStatus(id, "REVOKED")
}

// ResendInvitation resends an invitation by extending expiration
func (s *TenantInvitationService) ResendInvitation(id uuid.UUID) (*models.TenantInvitation, error) {
	invitation, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// Only resend pending or expired invitations
	if invitation.Status != "PENDING" && invitation.Status != "EXPIRED" {
		return nil, fmt.Errorf("can only resend pending or expired invitations")
	}

	// Extend expiration and set status to pending
	updates := map[string]interface{}{
		"expires_at": time.Now().Add(7 * 24 * time.Hour),
		"status":     "PENDING",
	}

	return s.repo.Update(id, updates)
}

// DeleteInvitation deletes a tenant invitation
func (s *TenantInvitationService) DeleteInvitation(id uuid.UUID) error {
	return s.repo.Delete(id)
}

// ExpireOldInvitations marks old pending invitations as expired
func (s *TenantInvitationService) ExpireOldInvitations() (int64, error) {
	return s.repo.ExpireOldInvitations()
}
