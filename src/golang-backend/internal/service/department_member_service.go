package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type DepartmentMemberService interface {
	AddMember(ctx context.Context, req *models.CreateDepartmentMemberRequest) (*models.DepartmentMember, error)
	GetMember(ctx context.Context, id uuid.UUID) (*models.DepartmentMember, error)
	ListMembers(ctx context.Context, page, pageSize int, tenantID, departmentID, tenantMemberID *uuid.UUID) ([]*models.DepartmentMember, int, error)
	ListMembersByDepartment(ctx context.Context, departmentID uuid.UUID) ([]*models.DepartmentMember, error)
	ListMembersByTenantMember(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.DepartmentMember, error)
	GetByDepartmentAndMember(ctx context.Context, departmentID, tenantMemberID uuid.UUID) (*models.DepartmentMember, error)
	UpdateMember(ctx context.Context, id uuid.UUID, req *models.UpdateDepartmentMemberRequest) (*models.DepartmentMember, error)
	RemoveMember(ctx context.Context, id uuid.UUID) error
	DeleteMember(ctx context.Context, id uuid.UUID) error
	SoftDeleteMember(ctx context.Context, id uuid.UUID, deletedBy string) error
	GetActiveCount(ctx context.Context, departmentID uuid.UUID) (int, error)
}

type departmentMemberService struct {
	repo repository.DepartmentMemberRepository
}

func NewDepartmentMemberService(repo repository.DepartmentMemberRepository) DepartmentMemberService {
	return &departmentMemberService{repo: repo}
}

func (s *departmentMemberService) AddMember(ctx context.Context, req *models.CreateDepartmentMemberRequest) (*models.DepartmentMember, error) {
	now := time.Now()
	member := &models.DepartmentMember{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		DepartmentID:   req.DepartmentID,
		TenantMemberID: req.TenantMemberID,
		IsPrimary:      req.IsPrimary,
		CreatedAt:      now,
		UpdatedAt:      now,
		Version:        1,
	}

	member.JoinedAt.Time = now
	member.JoinedAt.Valid = true

	if req.RoleInDepartment != "" {
		member.RoleInDepartment.String = req.RoleInDepartment
		member.RoleInDepartment.Valid = true
	}

	if req.CreatedBy != nil {
		member.CreatedBy.String = req.CreatedBy.String()
		member.CreatedBy.Valid = true
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		member.Metadata = metadataJSON
	} else {
		member.Metadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, member); err != nil {
		return nil, fmt.Errorf("failed to add department member: %w", err)
	}

	return member, nil
}

func (s *departmentMemberService) GetMember(ctx context.Context, id uuid.UUID) (*models.DepartmentMember, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *departmentMemberService) ListMembers(ctx context.Context, page, pageSize int, tenantID, departmentID, tenantMemberID *uuid.UUID) ([]*models.DepartmentMember, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, departmentID, tenantMemberID)
}

func (s *departmentMemberService) ListMembersByDepartment(ctx context.Context, departmentID uuid.UUID) ([]*models.DepartmentMember, error) {
	return s.repo.ListByDepartmentID(ctx, departmentID)
}

func (s *departmentMemberService) ListMembersByTenantMember(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.DepartmentMember, error) {
	return s.repo.ListByTenantMemberID(ctx, tenantMemberID)
}

func (s *departmentMemberService) GetByDepartmentAndMember(ctx context.Context, departmentID, tenantMemberID uuid.UUID) (*models.DepartmentMember, error) {
	return s.repo.GetByDepartmentAndMember(ctx, departmentID, tenantMemberID)
}

func (s *departmentMemberService) UpdateMember(ctx context.Context, id uuid.UUID, req *models.UpdateDepartmentMemberRequest) (*models.DepartmentMember, error) {
	member, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.IsPrimary != nil {
		member.IsPrimary = *req.IsPrimary
	}

	if req.RoleInDepartment != nil {
		if *req.RoleInDepartment == "" {
			member.RoleInDepartment.Valid = false
		} else {
			member.RoleInDepartment.String = *req.RoleInDepartment
			member.RoleInDepartment.Valid = true
		}
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(*req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		member.Metadata = metadataJSON
	}

	if req.UpdatedBy != nil {
		member.UpdatedBy.String = req.UpdatedBy.String()
		member.UpdatedBy.Valid = true
	}

	member.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, member); err != nil {
		return nil, fmt.Errorf("failed to update department member: %w", err)
	}

	return member, nil
}

func (s *departmentMemberService) RemoveMember(ctx context.Context, id uuid.UUID) error {
	return s.repo.RemoveFromDepartment(ctx, id)
}

func (s *departmentMemberService) DeleteMember(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *departmentMemberService) SoftDeleteMember(ctx context.Context, id uuid.UUID, deletedBy string) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}

func (s *departmentMemberService) GetActiveCount(ctx context.Context, departmentID uuid.UUID) (int, error) {
	return s.repo.GetActiveCount(ctx, departmentID)
}
