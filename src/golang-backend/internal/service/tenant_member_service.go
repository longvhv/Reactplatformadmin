package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type TenantMemberService struct {
	memberRepo repository.TenantMemberRepository
}

func NewTenantMemberService(memberRepo repository.TenantMemberRepository) *TenantMemberService {
	return &TenantMemberService{
		memberRepo: memberRepo,
	}
}

type AddTenantMemberRequest struct {
	TenantID      uuid.UUID              `json:"tenant_id" binding:"required"`
	UserID        uuid.UUID              `json:"user_id" binding:"required"`
	Role          string                 `json:"role" binding:"required"`
	EmployeeCode  *string                `json:"employee_code"`
	InternalEmail *string                `json:"internal_email"`
	JobTitle      *string                `json:"job_title"`
	Permissions   []string               `json:"permissions"`
	Metadata      map[string]interface{} `json:"metadata"`
}

type UpdateTenantMemberRequest struct {
	Role          *string                `json:"role"`
	EmployeeCode  *string                `json:"employee_code"`
	InternalEmail *string                `json:"internal_email"`
	JobTitle      *string                `json:"job_title"`
	Status        *string                `json:"status"`
	Permissions   []string               `json:"permissions"`
	Metadata      map[string]interface{} `json:"metadata"`
}

// GetByID gets tenant member by ID
func (s *TenantMemberService) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantMember, error) {
	return s.memberRepo.GetByID(ctx, id)
}

// ListByTenant lists members by tenant
func (s *TenantMemberService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.TenantMember, int64, error) {
	offset := (page - 1) * limit
	return s.memberRepo.ListByTenant(ctx, tenantID, limit, offset)
}

// ListByUser lists members by user
func (s *TenantMemberService) ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.TenantMember, error) {
	return s.memberRepo.ListByUser(ctx, userID)
}

// AddMember adds a member to tenant
func (s *TenantMemberService) AddMember(ctx context.Context, req AddTenantMemberRequest) (*models.TenantMember, error) {
	// Check if user is already a member
	exists, err := s.memberRepo.Exists(ctx, req.TenantID, req.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to check membership: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("user is already a member of this tenant")
	}

	now := time.Now()
	member := &models.TenantMember{
		ID:            uuid.New(),
		TenantID:      req.TenantID,
		UserID:        req.UserID,
		Role:          req.Role,
		EmployeeCode:  req.EmployeeCode,
		InternalEmail: req.InternalEmail,
		JobTitle:      req.JobTitle,
		Status:        "ACTIVE",
		JoinedAt:      &now,
		Permissions:   req.Permissions,
		Metadata:      req.Metadata,
		CreatedAt:     now,
		UpdatedAt:     now,
		Version:       1,
	}

	if err := s.memberRepo.Create(ctx, member); err != nil {
		return nil, fmt.Errorf("failed to add member: %w", err)
	}

	return member, nil
}

// UpdateMember updates tenant member
func (s *TenantMemberService) UpdateMember(ctx context.Context, id uuid.UUID, req UpdateTenantMemberRequest) (*models.TenantMember, error) {
	member, err := s.memberRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("member not found: %w", err)
	}

	if req.Role != nil {
		member.Role = *req.Role
	}
	if req.EmployeeCode != nil {
		member.EmployeeCode = req.EmployeeCode
	}
	if req.InternalEmail != nil {
		member.InternalEmail = req.InternalEmail
	}
	if req.JobTitle != nil {
		member.JobTitle = req.JobTitle
	}
	if req.Status != nil {
		member.Status = *req.Status
	}
	if req.Permissions != nil {
		member.Permissions = req.Permissions
	}
	if req.Metadata != nil {
		member.Metadata = req.Metadata
	}

	member.UpdatedAt = time.Now()
	member.Version++

	if err := s.memberRepo.Update(ctx, member); err != nil {
		return nil, fmt.Errorf("failed to update member: %w", err)
	}

	return member, nil
}

// RemoveMember removes member from tenant
func (s *TenantMemberService) RemoveMember(ctx context.Context, id uuid.UUID) error {
	member, err := s.memberRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("member not found: %w", err)
	}

	// Cannot remove OWNER if they're the last owner
	if member.Role == "OWNER" {
		count, err := s.memberRepo.CountOwners(ctx, member.TenantID)
		if err != nil {
			return fmt.Errorf("failed to count owners: %w", err)
		}
		if count <= 1 {
			return fmt.Errorf("cannot remove the last owner")
		}
	}

	return s.memberRepo.Delete(ctx, id)
}

// UpdateMemberRole updates member's role
func (s *TenantMemberService) UpdateMemberRole(ctx context.Context, id uuid.UUID, role string) (*models.TenantMember, error) {
	member, err := s.memberRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("member not found: %w", err)
	}

	// Check if changing from OWNER role and they're the last owner
	if member.Role == "OWNER" && role != "OWNER" {
		count, err := s.memberRepo.CountOwners(ctx, member.TenantID)
		if err != nil {
			return nil, fmt.Errorf("failed to count owners: %w", err)
		}
		if count <= 1 {
			return nil, fmt.Errorf("cannot change role of the last owner")
		}
	}

	member.Role = role
	member.UpdatedAt = time.Now()
	member.Version++

	if err := s.memberRepo.Update(ctx, member); err != nil {
		return nil, fmt.Errorf("failed to update member role: %w", err)
	}

	return member, nil
}
