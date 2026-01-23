package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type ApplicationService struct {
	applicationRepo repository.ApplicationRepository
}

func NewApplicationService(applicationRepo repository.ApplicationRepository) *ApplicationService {
	return &ApplicationService{
		applicationRepo: applicationRepo,
	}
}

type CreateApplicationRequest struct {
	Code        string                 `json:"code" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	Description *string                `json:"description"`
	Type        string                 `json:"type" binding:"required"`
	LogoURL     *string                `json:"logo_url"`
	IsActive    bool                   `json:"is_active"`
	Settings    map[string]interface{} `json:"settings"`
	Metadata    map[string]interface{} `json:"metadata"`
}

type UpdateApplicationRequest struct {
	Name        *string                `json:"name"`
	Description *string                `json:"description"`
	LogoURL     *string                `json:"logo_url"`
	IsActive    *bool                  `json:"is_active"`
	Settings    map[string]interface{} `json:"settings"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// GetByID gets application by ID
func (s *ApplicationService) GetByID(ctx context.Context, id uuid.UUID) (*models.Application, error) {
	return s.applicationRepo.GetByID(ctx, id)
}

// GetByCode gets application by code
func (s *ApplicationService) GetByCode(ctx context.Context, code string) (*models.Application, error) {
	return s.applicationRepo.GetByCode(ctx, code)
}

// List lists all applications
func (s *ApplicationService) List(ctx context.Context, page, limit int) ([]*models.Application, int64, error) {
	offset := (page - 1) * limit
	return s.applicationRepo.List(ctx, limit, offset)
}

// CreateApplication creates a new application
func (s *ApplicationService) CreateApplication(ctx context.Context, req CreateApplicationRequest) (*models.Application, error) {
	if req.Code == "" {
		return nil, fmt.Errorf("application code is required")
	}

	// Check if code exists
	exists, err := s.applicationRepo.ExistsByCode(ctx, req.Code)
	if err != nil {
		return nil, fmt.Errorf("failed to check application code: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("application code already exists")
	}

	application := &models.Application{
		ID:          uuid.New(),
		Code:        req.Code,
		Name:        req.Name,
		Description: req.Description,
		Type:        req.Type,
		LogoURL:     req.LogoURL,
		IsActive:    req.IsActive,
		Settings:    req.Settings,
		Metadata:    req.Metadata,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		Version:     1,
	}

	if err := s.applicationRepo.Create(ctx, application); err != nil {
		return nil, fmt.Errorf("failed to create application: %w", err)
	}

	return application, nil
}

// UpdateApplication updates an application
func (s *ApplicationService) UpdateApplication(ctx context.Context, id uuid.UUID, req UpdateApplicationRequest) (*models.Application, error) {
	application, err := s.applicationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("application not found: %w", err)
	}

	if req.Name != nil {
		application.Name = *req.Name
	}
	if req.Description != nil {
		application.Description = req.Description
	}
	if req.LogoURL != nil {
		application.LogoURL = req.LogoURL
	}
	if req.IsActive != nil {
		application.IsActive = *req.IsActive
	}
	if req.Settings != nil {
		application.Settings = req.Settings
	}
	if req.Metadata != nil {
		application.Metadata = req.Metadata
	}

	application.UpdatedAt = time.Now()
	application.Version++

	if err := s.applicationRepo.Update(ctx, application); err != nil {
		return nil, fmt.Errorf("failed to update application: %w", err)
	}

	return application, nil
}

// DeleteApplication deletes an application
func (s *ApplicationService) DeleteApplication(ctx context.Context, id uuid.UUID) error {
	return s.applicationRepo.Delete(ctx, id)
}
