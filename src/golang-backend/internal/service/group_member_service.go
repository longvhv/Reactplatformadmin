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

type GroupMemberService interface {
	AddMember(ctx context.Context, req *models.CreateGroupMemberRequest) (*models.GroupMember, error)
	GetMember(ctx context.Context, id uuid.UUID) (*models.GroupMember, error)
	ListMembers(ctx context.Context, page, pageSize int, tenantID, userGroupID, tenantMemberID *uuid.UUID) ([]*models.GroupMember, int, error)
	ListMembersByGroup(ctx context.Context, userGroupID uuid.UUID) ([]*models.GroupMember, error)
	ListMembersByTenantMember(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.GroupMember, error)
	GetByGroupAndMember(ctx context.Context, userGroupID, tenantMemberID uuid.UUID) (*models.GroupMember, error)
	UpdateMember(ctx context.Context, id uuid.UUID, req *models.UpdateGroupMemberRequest) (*models.GroupMember, error)
	RemoveMember(ctx context.Context, id uuid.UUID) error
	DeleteMember(ctx context.Context, id uuid.UUID) error
	SoftDeleteMember(ctx context.Context, id uuid.UUID, deletedBy string) error
	GetActiveCount(ctx context.Context, userGroupID uuid.UUID) (int, error)
}

type groupMemberService struct {
	repo repository.GroupMemberRepository
}

func NewGroupMemberService(repo repository.GroupMemberRepository) GroupMemberService {
	return &groupMemberService{repo: repo}
}

func (s *groupMemberService) AddMember(ctx context.Context, req *models.CreateGroupMemberRequest) (*models.GroupMember, error) {
	now := time.Now()
	member := &models.GroupMember{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		UserGroupID:    req.UserGroupID,
		TenantMemberID: req.TenantMemberID,
		IsPrimary:      req.IsPrimary,
		CreatedAt:      now,
		UpdatedAt:      now,
		Version:        1,
	}

	// Set joined_at to now
	member.JoinedAt.Time = now
	member.JoinedAt.Valid = true

	if req.RoleInGroup != "" {
		member.RoleInGroup.String = req.RoleInGroup
		member.RoleInGroup.Valid = true
	}

	if req.CreatedBy != nil {
		member.CreatedBy.String = req.CreatedBy.String()
		member.CreatedBy.Valid = true
	}

	// Set metadata
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
		return nil, fmt.Errorf("failed to add group member: %w", err)
	}

	return member, nil
}

func (s *groupMemberService) GetMember(ctx context.Context, id uuid.UUID) (*models.GroupMember, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *groupMemberService) ListMembers(ctx context.Context, page, pageSize int, tenantID, userGroupID, tenantMemberID *uuid.UUID) ([]*models.GroupMember, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, userGroupID, tenantMemberID)
}

func (s *groupMemberService) ListMembersByGroup(ctx context.Context, userGroupID uuid.UUID) ([]*models.GroupMember, error) {
	return s.repo.ListByUserGroupID(ctx, userGroupID)
}

func (s *groupMemberService) ListMembersByTenantMember(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.GroupMember, error) {
	return s.repo.ListByTenantMemberID(ctx, tenantMemberID)
}

func (s *groupMemberService) GetByGroupAndMember(ctx context.Context, userGroupID, tenantMemberID uuid.UUID) (*models.GroupMember, error) {
	return s.repo.GetByGroupAndMember(ctx, userGroupID, tenantMemberID)
}

func (s *groupMemberService) UpdateMember(ctx context.Context, id uuid.UUID, req *models.UpdateGroupMemberRequest) (*models.GroupMember, error) {
	member, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.IsPrimary != nil {
		member.IsPrimary = *req.IsPrimary
	}

	if req.RoleInGroup != nil {
		if *req.RoleInGroup == "" {
			member.RoleInGroup.Valid = false
		} else {
			member.RoleInGroup.String = *req.RoleInGroup
			member.RoleInGroup.Valid = true
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
		return nil, fmt.Errorf("failed to update group member: %w", err)
	}

	return member, nil
}

func (s *groupMemberService) RemoveMember(ctx context.Context, id uuid.UUID) error {
	return s.repo.RemoveFromGroup(ctx, id)
}

func (s *groupMemberService) DeleteMember(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *groupMemberService) SoftDeleteMember(ctx context.Context, id uuid.UUID, deletedBy string) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}

func (s *groupMemberService) GetActiveCount(ctx context.Context, userGroupID uuid.UUID) (int, error) {
	return s.repo.GetActiveCount(ctx, userGroupID)
}
