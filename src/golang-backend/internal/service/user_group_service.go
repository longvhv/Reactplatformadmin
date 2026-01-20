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

type UserGroupService interface {
	CreateGroup(ctx context.Context, req *models.CreateUserGroupRequest) (*models.UserGroup, error)
	GetGroup(ctx context.Context, id uuid.UUID) (*models.UserGroup, error)
	GetGroupByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.UserGroup, error)
	ListGroups(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.UserGroup, int, error)
	ListGroupsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.UserGroup, error)
	ListGroupsByStatus(ctx context.Context, tenantID uuid.UUID, status string) ([]*models.UserGroup, error)
	UpdateGroup(ctx context.Context, id uuid.UUID, req *models.UpdateUserGroupRequest) (*models.UserGroup, error)
	UpdateGroupStatus(ctx context.Context, id uuid.UUID, status string) error
	DeleteGroup(ctx context.Context, id uuid.UUID) error
	SoftDeleteGroup(ctx context.Context, id uuid.UUID, deletedBy string) error
}

type userGroupService struct {
	repo repository.UserGroupRepository
}

func NewUserGroupService(repo repository.UserGroupRepository) UserGroupService {
	return &userGroupService{repo: repo}
}

func (s *userGroupService) CreateGroup(ctx context.Context, req *models.CreateUserGroupRequest) (*models.UserGroup, error) {
	now := time.Now()
	group := &models.UserGroup{
		ID:        uuid.New(),
		TenantID:  req.TenantID,
		Code:      req.Code,
		Name:      req.Name,
		Status:    "ACTIVE",
		Order:     req.Order,
		CreatedAt: now,
		UpdatedAt: now,
		Version:   1,
	}

	if req.Description != "" {
		group.Description.String = req.Description
		group.Description.Valid = true
	}

	if req.GroupType != "" {
		group.GroupType.String = req.GroupType
		group.GroupType.Valid = true
	}

	if req.CreatedBy != nil {
		group.CreatedBy.String = req.CreatedBy.String()
		group.CreatedBy.Valid = true
	}

	// Set metadata
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		group.Metadata = metadataJSON
	} else {
		group.Metadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, group); err != nil {
		return nil, fmt.Errorf("failed to create user group: %w", err)
	}

	return group, nil
}

func (s *userGroupService) GetGroup(ctx context.Context, id uuid.UUID) (*models.UserGroup, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *userGroupService) GetGroupByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.UserGroup, error) {
	return s.repo.GetByCode(ctx, tenantID, code)
}

func (s *userGroupService) ListGroups(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.UserGroup, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, status)
}

func (s *userGroupService) ListGroupsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.UserGroup, error) {
	return s.repo.ListByTenantID(ctx, tenantID)
}

func (s *userGroupService) ListGroupsByStatus(ctx context.Context, tenantID uuid.UUID, status string) ([]*models.UserGroup, error) {
	return s.repo.ListByStatus(ctx, tenantID, status)
}

func (s *userGroupService) UpdateGroup(ctx context.Context, id uuid.UUID, req *models.UpdateUserGroupRequest) (*models.UserGroup, error) {
	group, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		group.Name = *req.Name
	}

	if req.Description != nil {
		if *req.Description == "" {
			group.Description.Valid = false
		} else {
			group.Description.String = *req.Description
			group.Description.Valid = true
		}
	}

	if req.GroupType != nil {
		if *req.GroupType == "" {
			group.GroupType.Valid = false
		} else {
			group.GroupType.String = *req.GroupType
			group.GroupType.Valid = true
		}
	}

	if req.Status != nil {
		group.Status = *req.Status
	}

	if req.Order != nil {
		group.Order = *req.Order
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(*req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		group.Metadata = metadataJSON
	}

	if req.UpdatedBy != nil {
		group.UpdatedBy.String = req.UpdatedBy.String()
		group.UpdatedBy.Valid = true
	}

	group.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, group); err != nil {
		return nil, fmt.Errorf("failed to update user group: %w", err)
	}

	return group, nil
}

func (s *userGroupService) UpdateGroupStatus(ctx context.Context, id uuid.UUID, status string) error {
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *userGroupService) DeleteGroup(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *userGroupService) SoftDeleteGroup(ctx context.Context, id uuid.UUID, deletedBy string) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}
