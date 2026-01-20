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

type UserDelegationService interface {
	CreateDelegation(ctx context.Context, req *models.CreateUserDelegationRequest) (*models.UserDelegation, error)
	GetDelegation(ctx context.Context, id uuid.UUID) (*models.UserDelegation, error)
	ListDelegations(ctx context.Context, page, pageSize int, delegatorID, delegateID, tenantID *uuid.UUID, status *string) ([]*models.UserDelegation, int, error)
	ListDelegationsByDelegator(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error)
	ListDelegationsByDelegate(ctx context.Context, delegateID uuid.UUID) ([]*models.UserDelegation, error)
	ListDelegationsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.UserDelegation, error)
	GetActiveDelegations(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error)
	UpdateDelegation(ctx context.Context, id uuid.UUID, req *models.UpdateUserDelegationRequest) (*models.UserDelegation, error)
	ActivateDelegation(ctx context.Context, id uuid.UUID) error
	RevokeDelegation(ctx context.Context, id uuid.UUID, revokedBy uuid.UUID, reason string) error
	SuspendDelegation(ctx context.Context, id uuid.UUID) error
	DeleteDelegation(ctx context.Context, id uuid.UUID) error
	ExpireOldDelegations(ctx context.Context) error
}

type userDelegationService struct {
	repo repository.UserDelegationRepository
}

func NewUserDelegationService(repo repository.UserDelegationRepository) UserDelegationService {
	return &userDelegationService{repo: repo}
}

func (s *userDelegationService) CreateDelegation(ctx context.Context, req *models.CreateUserDelegationRequest) (*models.UserDelegation, error) {
	now := time.Now()
	delegation := &models.UserDelegation{
		ID:                   uuid.New(),
		DelegatorID:          req.DelegatorID,
		DelegateID:           req.DelegateID,
		Status:               "pending",
		AutoExpire:           req.AutoExpire,
		NotifiedBeforeExpiry: false,
		CreatedAt:            now,
		UpdatedAt:            now,
	}

	// Set start date
	if req.StartDate != nil {
		delegation.StartDate = *req.StartDate
	} else {
		delegation.StartDate = now
	}

	if req.TenantID != nil {
		delegation.TenantID.String = req.TenantID.String()
		delegation.TenantID.Valid = true
	}

	if req.Scope != "" {
		delegation.Scope.String = req.Scope
		delegation.Scope.Valid = true
	}

	if req.Reason != "" {
		delegation.Reason.String = req.Reason
		delegation.Reason.Valid = true
	}

	if req.Notes != "" {
		delegation.Notes.String = req.Notes
		delegation.Notes.Valid = true
	}

	if req.EndDate != nil {
		delegation.EndDate.Time = *req.EndDate
		delegation.EndDate.Valid = true
	}

	// Set permissions
	if req.Permissions != nil {
		permissionsJSON, err := json.Marshal(req.Permissions)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal permissions: %w", err)
		}
		delegation.Permissions = permissionsJSON
	} else {
		delegation.Permissions = []byte("[]")
	}

	// Set metadata
	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		delegation.Metadata = metadataJSON
	} else {
		delegation.Metadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, delegation); err != nil {
		return nil, fmt.Errorf("failed to create delegation: %w", err)
	}

	return delegation, nil
}

func (s *userDelegationService) GetDelegation(ctx context.Context, id uuid.UUID) (*models.UserDelegation, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *userDelegationService) ListDelegations(ctx context.Context, page, pageSize int, delegatorID, delegateID, tenantID *uuid.UUID, status *string) ([]*models.UserDelegation, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, delegatorID, delegateID, tenantID, status)
}

func (s *userDelegationService) ListDelegationsByDelegator(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error) {
	return s.repo.ListByDelegator(ctx, delegatorID)
}

func (s *userDelegationService) ListDelegationsByDelegate(ctx context.Context, delegateID uuid.UUID) ([]*models.UserDelegation, error) {
	return s.repo.ListByDelegate(ctx, delegateID)
}

func (s *userDelegationService) ListDelegationsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.UserDelegation, error) {
	return s.repo.ListByTenant(ctx, tenantID)
}

func (s *userDelegationService) GetActiveDelegations(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error) {
	return s.repo.GetActiveDelegations(ctx, delegatorID)
}

func (s *userDelegationService) UpdateDelegation(ctx context.Context, id uuid.UUID, req *models.UpdateUserDelegationRequest) (*models.UserDelegation, error) {
	delegation, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Scope != nil {
		if *req.Scope == "" {
			delegation.Scope.Valid = false
		} else {
			delegation.Scope.String = *req.Scope
			delegation.Scope.Valid = true
		}
	}

	if req.Reason != nil {
		if *req.Reason == "" {
			delegation.Reason.Valid = false
		} else {
			delegation.Reason.String = *req.Reason
			delegation.Reason.Valid = true
		}
	}

	if req.Notes != nil {
		if *req.Notes == "" {
			delegation.Notes.Valid = false
		} else {
			delegation.Notes.String = *req.Notes
			delegation.Notes.Valid = true
		}
	}

	if req.EndDate != nil {
		delegation.EndDate.Time = *req.EndDate
		delegation.EndDate.Valid = true
	}

	if req.AutoExpire != nil {
		delegation.AutoExpire = *req.AutoExpire
	}

	if req.Permissions != nil {
		permissionsJSON, err := json.Marshal(*req.Permissions)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal permissions: %w", err)
		}
		delegation.Permissions = permissionsJSON
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(*req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		delegation.Metadata = metadataJSON
	}

	delegation.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, delegation); err != nil {
		return nil, fmt.Errorf("failed to update delegation: %w", err)
	}

	return delegation, nil
}

func (s *userDelegationService) ActivateDelegation(ctx context.Context, id uuid.UUID) error {
	return s.repo.Activate(ctx, id)
}

func (s *userDelegationService) RevokeDelegation(ctx context.Context, id uuid.UUID, revokedBy uuid.UUID, reason string) error {
	return s.repo.Revoke(ctx, id, revokedBy, reason)
}

func (s *userDelegationService) SuspendDelegation(ctx context.Context, id uuid.UUID) error {
	return s.repo.Suspend(ctx, id)
}

func (s *userDelegationService) DeleteDelegation(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *userDelegationService) ExpireOldDelegations(ctx context.Context) error {
	return s.repo.ExpireOldDelegations(ctx)
}
