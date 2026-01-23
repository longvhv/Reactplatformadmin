package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type TenantInvitationService struct {
	invitationRepo  repository.TenantInvitationRepository
	tenantMemberRepo repository.TenantMemberRepository
	// emailService would be used to send invitation emails
}

func NewTenantInvitationService(
	invitationRepo repository.TenantInvitationRepository,
	tenantMemberRepo repository.TenantMemberRepository,
) *TenantInvitationService {
	return &TenantInvitationService{
		invitationRepo:   invitationRepo,
		tenantMemberRepo: tenantMemberRepo,
	}
}

type CreateTenantInvitationRequest struct {
	TenantID     uuid.UUID   `json:"tenant_id" binding:"required"`
	Email        string      `json:"email" binding:"required,email"`
	RoleIDs      []string    `json:"role_ids"`
	DepartmentID *uuid.UUID  `json:"department_id"`
	InvitedBy    uuid.UUID   `json:"-"`
}

// GetByID gets invitation by ID
func (s *TenantInvitationService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantInvitation, error) {
	return s.invitationRepo.GetByID(ctx, id)
}

// GetByToken gets invitation by token
func (s *TenantInvitationService) GetByToken(ctx context.Context, token string) (*models.TenantInvitation, error) {
	return s.invitationRepo.GetByToken(ctx, token)
}

// ListByTenant lists invitations by tenant
func (s *TenantInvitationService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, page, limit int) ([]*models.TenantInvitation, int64, error) {
	offset := (page - 1) * limit
	return s.invitationRepo.ListByTenant(ctx, tenantID, status, limit, offset)
}

// CreateInvitation creates a new tenant invitation
func (s *TenantInvitationService) CreateInvitation(ctx context.Context, req CreateTenantInvitationRequest) (*models.TenantInvitation, error) {
	// Check if user already a member
	exists, err := s.tenantMemberRepo.ExistsByEmail(ctx, req.TenantID, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check member: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("user already a member of this tenant")
	}

	// Check if pending invitation exists
	pendingExists, err := s.invitationRepo.ExistsPending(ctx, req.TenantID, req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check pending invitations: %w", err)
	}
	if pendingExists {
		return nil, fmt.Errorf("pending invitation already exists for this email")
	}

	// Generate token
	token, err := generateInvitationToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Set expiration (7 days from now)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	invitation := &models.TenantInvitation{
		ID:           uuid.New(),
		TenantID:     req.TenantID,
		Email:        req.Email,
		RoleIDs:      req.RoleIDs,
		DepartmentID: req.DepartmentID,
		Token:        token,
		Status:       "PENDING",
		ExpiresAt:    expiresAt,
		InvitedBy:    &req.InvitedBy,
		CreatedAt:    time.Now(),
	}

	if err := s.invitationRepo.Create(ctx, invitation); err != nil {
		return nil, fmt.Errorf("failed to create invitation: %w", err)
	}

	// TODO: Send invitation email
	// s.emailService.SendInvitation(ctx, invitation)

	return invitation, nil
}

// ResendInvitation resends an invitation
func (s *TenantInvitationService) ResendInvitation(ctx context.Context, id uuid.UUID) error {
	invitation, err := s.invitationRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("invitation not found: %w", err)
	}

	if invitation.Status != "PENDING" {
		return fmt.Errorf("can only resend pending invitations")
	}

	if time.Now().After(invitation.ExpiresAt) {
		return fmt.Errorf("invitation expired")
	}

	// TODO: Send invitation email
	// s.emailService.SendInvitation(ctx, invitation)

	return nil
}

// AcceptInvitation accepts an invitation and creates tenant member
func (s *TenantInvitationService) AcceptInvitation(ctx context.Context, token string, userID uuid.UUID) (*models.TenantMember, error) {
	invitation, err := s.invitationRepo.GetByToken(ctx, token)
	if err != nil {
		return nil, fmt.Errorf("invitation not found: %w", err)
	}

	if invitation.Status != "PENDING" {
		return nil, fmt.Errorf("invitation is not pending")
	}

	if time.Now().After(invitation.ExpiresAt) {
		// Mark as expired
		invitation.Status = "EXPIRED"
		_ = s.invitationRepo.Update(ctx, invitation)
		return nil, fmt.Errorf("invitation expired")
	}

	// Create tenant member
	member := &models.TenantMember{
		ID:        uuid.New(),
		TenantID:  invitation.TenantID,
		UserID:    userID,
		Status:    "ACTIVE",
		JoinedAt:  timePtr(time.Now()),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Version:   1,
	}

	if err := s.tenantMemberRepo.Create(ctx, member); err != nil {
		return nil, fmt.Errorf("failed to create member: %w", err)
	}

	// Mark invitation as accepted
	invitation.Status = "ACCEPTED"
	_ = s.invitationRepo.Update(ctx, invitation)

	// TODO: Assign roles to member
	// if len(invitation.RoleIDs) > 0 {
	//     s.roleService.AssignRolesToMember(ctx, member.ID, invitation.RoleIDs)
	// }

	return member, nil
}

// RevokeInvitation revokes an invitation
func (s *TenantInvitationService) RevokeInvitation(ctx context.Context, id uuid.UUID) error {
	invitation, err := s.invitationRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("invitation not found: %w", err)
	}

	if invitation.Status != "PENDING" {
		return fmt.Errorf("can only revoke pending invitations")
	}

	invitation.Status = "REVOKED"
	if err := s.invitationRepo.Update(ctx, invitation); err != nil {
		return fmt.Errorf("failed to revoke invitation: %w", err)
	}

	return nil
}

// CleanupExpired marks expired invitations
func (s *TenantInvitationService) CleanupExpired(ctx context.Context) error {
	return s.invitationRepo.MarkExpired(ctx)
}

// Helper functions
func generateInvitationToken() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

func timePtr(t time.Time) *time.Time {
	return &t
}
