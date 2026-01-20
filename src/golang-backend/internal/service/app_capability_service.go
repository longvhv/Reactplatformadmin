package service

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golang-backend/internal/models"
	"golang-backend/internal/repository"
)

type AppCapabilityService interface {
	CreateCapability(ctx context.Context, req *models.CreateAppCapabilityRequest) (*models.AppCapability, error)
	GetCapability(ctx context.Context, id uuid.UUID) (*models.AppCapability, error)
	ListCapabilities(ctx context.Context, page, pageSize int, tenantID, appID *uuid.UUID, capabilityType *string) ([]*models.AppCapability, int, error)
	ListCapabilitiesByApp(ctx context.Context, appID uuid.UUID) ([]*models.AppCapability, error)
	UpdateCapability(ctx context.Context, id uuid.UUID, req *models.UpdateAppCapabilityRequest) (*models.AppCapability, error)
	DeleteCapability(ctx context.Context, id uuid.UUID) error
	SoftDeleteCapability(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error
}

type appCapabilityService struct {
	repo repository.AppCapabilityRepository
}

func NewAppCapabilityService(repo repository.AppCapabilityRepository) AppCapabilityService {
	return &appCapabilityService{repo: repo}
}

func (s *appCapabilityService) CreateCapability(ctx context.Context, req *models.CreateAppCapabilityRequest) (*models.AppCapability, error) {
	displayOrder := 0
	if req.DisplayOrder != nil {
		displayOrder = *req.DisplayOrder
	}

	isRequired := false
	if req.IsRequired != nil {
		isRequired = *req.IsRequired
	}

	capability := &models.AppCapability{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		AppID:           req.AppID,
		Code:            req.Code,
		Name:            req.Name,
		Description:     req.Description,
		Type:            req.Type,
		DefaultValue:    req.DefaultValue,
		DisplayOrder:    displayOrder,
		IsRequired:      isRequired,
		ValidationRules: req.ValidationRules,
		Status:          "active",
		Metadata:        req.Metadata,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		Version:         1,
	}

	err := s.repo.Create(ctx, capability)
	if err != nil {
		return nil, err
	}
	return capability, nil
}

func (s *appCapabilityService) GetCapability(ctx context.Context, id uuid.UUID) (*models.AppCapability, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *appCapabilityService) ListCapabilities(ctx context.Context, page, pageSize int, tenantID, appID *uuid.UUID, capabilityType *string) ([]*models.AppCapability, int, error) {
	return s.repo.List(ctx, page, pageSize, tenantID, appID, capabilityType)
}

func (s *appCapabilityService) ListCapabilitiesByApp(ctx context.Context, appID uuid.UUID) ([]*models.AppCapability, error) {
	return s.repo.ListByApp(ctx, appID)
}

func (s *appCapabilityService) UpdateCapability(ctx context.Context, id uuid.UUID, req *models.UpdateAppCapabilityRequest) (*models.AppCapability, error) {
	capability, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		capability.Name = *req.Name
	}
	if req.Description != nil {
		capability.Description = req.Description
	}
	if req.DefaultValue != nil {
		capability.DefaultValue = req.DefaultValue
	}
	if req.DisplayOrder != nil {
		capability.DisplayOrder = *req.DisplayOrder
	}
	if req.IsRequired != nil {
		capability.IsRequired = *req.IsRequired
	}
	if req.ValidationRules != nil {
		capability.ValidationRules = req.ValidationRules
	}
	if req.Status != nil {
		capability.Status = *req.Status
	}
	if req.Metadata != nil {
		capability.Metadata = req.Metadata
	}

	err = s.repo.Update(ctx, capability)
	if err != nil {
		return nil, err
	}
	return capability, nil
}

func (s *appCapabilityService) DeleteCapability(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *appCapabilityService) SoftDeleteCapability(ctx context.Context, id uuid.UUID, deletedBy uuid.UUID) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}
