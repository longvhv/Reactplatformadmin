package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type PackageService struct {
	repo *repository.PackageRepository
}

func NewPackageService(repo *repository.PackageRepository) *PackageService {
	return &PackageService{repo: repo}
}

func (s *PackageService) GetAll(ctx context.Context, filters models.PackageFilters) ([]models.Package, error) {
	return s.repo.GetAll(ctx, filters)
}

func (s *PackageService) GetByID(ctx context.Context, id string) (*models.Package, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid package ID format")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *PackageService) GetByCode(ctx context.Context, productID, code string) (*models.Package, error) {
	if !isValidUUID(productID) {
		return nil, fmt.Errorf("invalid product ID format")
	}
	return s.repo.GetByCode(ctx, productID, code)
}

func (s *PackageService) Create(ctx context.Context, req models.CreatePackageRequest) (*models.Package, error) {
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	existing, _ := s.repo.GetByCode(ctx, req.ProductID, req.Code)
	if existing != nil {
		return nil, fmt.Errorf("package code already exists for this product")
	}

	return s.repo.Create(ctx, req)
}

func (s *PackageService) Update(ctx context.Context, id string, req models.UpdatePackageRequest) (*models.Package, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid package ID format")
	}

	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, id, req)
}

func (s *PackageService) Delete(ctx context.Context, id string) error {
	if !isValidUUID(id) {
		return fmt.Errorf("invalid package ID format")
	}
	return s.repo.Delete(ctx, id)
}

func (s *PackageService) validateCreateRequest(req models.CreatePackageRequest) error {
	code := strings.TrimSpace(req.Code)
	if code == "" {
		return fmt.Errorf("package code is required")
	}
	if !isValidCode(code) {
		return fmt.Errorf("package code must be 2-50 alphanumeric characters with hyphens")
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return fmt.Errorf("package name is required")
	}
	if len(name) > 255 {
		return fmt.Errorf("package name cannot exceed 255 characters")
	}

	if req.Price < 0 {
		return fmt.Errorf("price cannot be negative")
	}

	if len(req.Currency) != 3 {
		return fmt.Errorf("currency must be 3-letter code (e.g., USD, VND)")
	}

	return nil
}

func (s *PackageService) validateUpdateRequest(req models.UpdatePackageRequest) error {
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return fmt.Errorf("package name cannot be empty")
		}
		if len(name) > 255 {
			return fmt.Errorf("package name cannot exceed 255 characters")
		}
	}

	if req.Price != nil && *req.Price < 0 {
		return fmt.Errorf("price cannot be negative")
	}

	if req.Currency != nil && len(*req.Currency) != 3 {
		return fmt.Errorf("currency must be 3-letter code (e.g., USD, VND)")
	}

	return nil
}
