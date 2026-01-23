package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type UserGroupService struct {
	groupRepo  repository.UserGroupRepository
	memberRepo repository.GroupMemberRepository
}

func NewUserGroupService(groupRepo repository.UserGroupRepository, memberRepo repository.GroupMemberRepository) *UserGroupService {
	return &UserGroupService{
		groupRepo:  groupRepo,
		memberRepo: memberRepo,
	}
}

type CreateUserGroupRequest struct {
	TenantID    uuid.UUID              `json:"tenant_id" binding:"required"`
	Code        string                 `json:"code" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	Description *string                `json:"description"`
	GroupType   *string                `json:"group_type"`
	Status      string                 `json:"status"`
	Order       int                    `json:"order"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedBy   uuid.UUID              `json:"-"`
}

type UpdateUserGroupRequest struct {
	Name        *string                `json:"name"`
	Description *string                `json:"description"`
	GroupType   *string                `json:"group_type"`
	Status      *string                `json:"status"`
	Order       *int                   `json:"order"`
	Metadata    map[string]interface{} `json:"metadata"`
	UpdatedBy   uuid.UUID              `json:"-"`
}

type AddGroupMemberRequest struct {
	TenantID       uuid.UUID              `json:"tenant_id" binding:"required"`
	UserGroupID    uuid.UUID              `json:"user_group_id" binding:"required"`
	TenantMemberID uuid.UUID              `json:"tenant_member_id" binding:"required"`
	IsPrimary      bool                   `json:"is_primary"`
	RoleInGroup    *string                `json:"role_in_group"`
	Metadata       map[string]interface{} `json:"metadata"`
	CreatedBy      uuid.UUID              `json:"-"`
}

// GetByID gets group by ID
func (s *UserGroupService) GetByID(ctx context.Context, id uuid.UUID) (*models.UserGroup, error) {
	return s.groupRepo.GetByID(ctx, id)
}

// GetByCode gets group by code
func (s *UserGroupService) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.UserGroup, error) {
	return s.groupRepo.GetByCode(ctx, tenantID, code)
}

// ListByTenant lists groups by tenant
func (s *UserGroupService) ListByTenant(ctx context.Context, tenantID uuid.UUID, status, groupType string, page, limit int) ([]*models.UserGroup, int64, error) {
	offset := (page - 1) * limit
	return s.groupRepo.ListByTenant(ctx, tenantID, status, groupType, limit, offset)
}

// CreateGroup creates a new group
func (s *UserGroupService) CreateGroup(ctx context.Context, req CreateUserGroupRequest) (*models.UserGroup, error) {
	// Check if code exists
	existing, err := s.groupRepo.GetByCode(ctx, req.TenantID, req.Code)
	if err == nil && existing != nil {
		return nil, fmt.Errorf("group code already exists")
	}

	status := req.Status
	if status == "" {
		status = "ACTIVE"
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	group := &models.UserGroup{
		ID:          uuid.New(),
		TenantID:    req.TenantID,
		Code:        req.Code,
		Name:        req.Name,
		Description: req.Description,
		GroupType:   req.GroupType,
		Status:      status,
		Order:       req.Order,
		Metadata:    metadata,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		CreatedBy:   &req.CreatedBy,
		Version:     1,
	}

	if err := s.groupRepo.Create(ctx, group); err != nil {
		return nil, fmt.Errorf("failed to create group: %w", err)
	}

	return group, nil
}

// UpdateGroup updates a group
func (s *UserGroupService) UpdateGroup(ctx context.Context, id uuid.UUID, req UpdateUserGroupRequest) (*models.UserGroup, error) {
	group, err := s.groupRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("group not found: %w", err)
	}

	if req.Name != nil {
		group.Name = *req.Name
	}
	if req.Description != nil {
		group.Description = req.Description
	}
	if req.GroupType != nil {
		group.GroupType = req.GroupType
	}
	if req.Status != nil {
		group.Status = *req.Status
	}
	if req.Order != nil {
		group.Order = *req.Order
	}
	if req.Metadata != nil {
		group.Metadata = req.Metadata
	}

	group.UpdatedAt = time.Now()
	group.UpdatedBy = &req.UpdatedBy
	group.Version++

	if err := s.groupRepo.Update(ctx, group); err != nil {
		return nil, fmt.Errorf("failed to update group: %w", err)
	}

	return group, nil
}

// DeleteGroup deletes a group
func (s *UserGroupService) DeleteGroup(ctx context.Context, id uuid.UUID) error {
	// Check if group has members
	members, _, err := s.memberRepo.ListByGroup(ctx, id, 1, 0)
	if err != nil {
		return fmt.Errorf("failed to check members: %w", err)
	}
	if len(members) > 0 {
		return fmt.Errorf("cannot delete group with members")
	}

	return s.groupRepo.Delete(ctx, id)
}

// AddMember adds a member to group
func (s *UserGroupService) AddMember(ctx context.Context, req AddGroupMemberRequest) (*models.GroupMember, error) {
	// Check if member already exists in group
	members, _, err := s.memberRepo.ListByGroup(ctx, req.UserGroupID, 1000, 0)
	if err == nil {
		for _, m := range members {
			if m.TenantMemberID == req.TenantMemberID {
				return nil, fmt.Errorf("member already in group")
			}
		}
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	now := time.Now()
	member := &models.GroupMember{
		ID:             uuid.New(),
		TenantID:       req.TenantID,
		UserGroupID:    req.UserGroupID,
		TenantMemberID: req.TenantMemberID,
		IsPrimary:      req.IsPrimary,
		RoleInGroup:    req.RoleInGroup,
		JoinedAt:       &now,
		Metadata:       metadata,
		CreatedAt:      now,
		UpdatedAt:      now,
		CreatedBy:      &req.CreatedBy,
		Version:        1,
	}

	if err := s.memberRepo.Create(ctx, member); err != nil {
		return nil, fmt.Errorf("failed to add member: %w", err)
	}

	return member, nil
}

// RemoveMember removes a member from group
func (s *UserGroupService) RemoveMember(ctx context.Context, groupID, memberID uuid.UUID) error {
	return s.memberRepo.Delete(ctx, memberID)
}

// GetMembers gets group members
func (s *UserGroupService) GetMembers(ctx context.Context, groupID uuid.UUID, page, limit int) ([]*models.GroupMember, int64, error) {
	offset := (page - 1) * limit
	return s.memberRepo.ListByGroup(ctx, groupID, limit, offset)
}

// GetMemberGroups gets groups that a member belongs to
func (s *UserGroupService) GetMemberGroups(ctx context.Context, tenantID, memberID uuid.UUID) ([]*models.UserGroup, error) {
	members, _, err := s.memberRepo.ListByMember(ctx, tenantID, memberID, 1000, 0)
	if err != nil {
		return nil, err
	}

	groups := make([]*models.UserGroup, 0)
	for _, member := range members {
		group, err := s.groupRepo.GetByID(ctx, member.UserGroupID)
		if err == nil {
			groups = append(groups, group)
		}
	}

	return groups, nil
}
