package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type ApplicationService struct {
	repo *repository.ApplicationRepository
}

func NewApplicationService(repo *repository.ApplicationRepository) *ApplicationService {
	return &ApplicationService{repo: repo}
}

func (s *ApplicationService) GetAll(ctx context.Context, filters models.ApplicationFilters) ([]models.Application, error) {
	return s.repo.GetAll(ctx, filters)
}

func (s *ApplicationService) GetByID(ctx context.Context, id string) (*models.Application, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid application ID format")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *ApplicationService) GetByCode(ctx context.Context, code string) (*models.Application, error) {
	return s.repo.GetByCode(ctx, code)
}

func (s *ApplicationService) Create(ctx context.Context, req models.CreateApplicationRequest) (*models.Application, error) {
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	existing, _ := s.repo.GetByCode(ctx, req.Code)
	if existing != nil {
		return nil, fmt.Errorf("application code already exists")
	}

	return s.repo.Create(ctx, req)
}

func (s *ApplicationService) Update(ctx context.Context, id string, req models.UpdateApplicationRequest) (*models.Application, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid application ID format")
	}

	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, id, req)
}

func (s *ApplicationService) Delete(ctx context.Context, id string) error {
	if !isValidUUID(id) {
		return fmt.Errorf("invalid application ID format")
	}
	return s.repo.Delete(ctx, id)
}

func (s *ApplicationService) validateCreateRequest(req models.CreateApplicationRequest) error {
	code := strings.TrimSpace(req.Code)
	if code == "" {
		return fmt.Errorf("application code is required")
	}
	if !isValidCode(code) {
		return fmt.Errorf("application code must be 2-50 alphanumeric characters with hyphens")
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return fmt.Errorf("application name is required")
	}
	if len(name) > 255 {
		return fmt.Errorf("application name cannot exceed 255 characters")
	}

	return nil
}

func (s *ApplicationService) validateUpdateRequest(req models.UpdateApplicationRequest) error {
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return fmt.Errorf("application name cannot be empty")
		}
		if len(name) > 255 {
			return fmt.Errorf("application name cannot exceed 255 characters")
		}
	}
	return nil
}

func isValidCode(code string) bool {
	match, _ := regexp.MatchString(`^[a-zA-Z0-9-]{2,50}$`, code)
	return match
}
