package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type ProductService struct {
	repo *repository.ProductRepository
}

func NewProductService(repo *repository.ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) GetAll(ctx context.Context, filters models.ProductFilters) ([]models.Product, error) {
	return s.repo.GetAll(ctx, filters)
}

func (s *ProductService) GetByID(ctx context.Context, id string) (*models.Product, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid product ID format")
	}
	return s.repo.GetByID(ctx, id)
}

func (s *ProductService) GetByCode(ctx context.Context, applicationID, code string) (*models.Product, error) {
	if !isValidUUID(applicationID) {
		return nil, fmt.Errorf("invalid application ID format")
	}
	return s.repo.GetByCode(ctx, applicationID, code)
}

func (s *ProductService) Create(ctx context.Context, req models.CreateProductRequest) (*models.Product, error) {
	if err := s.validateCreateRequest(req); err != nil {
		return nil, err
	}

	existing, _ := s.repo.GetByCode(ctx, req.ApplicationID, req.Code)
	if existing != nil {
		return nil, fmt.Errorf("product code already exists for this application")
	}

	return s.repo.Create(ctx, req)
}

func (s *ProductService) Update(ctx context.Context, id string, req models.UpdateProductRequest) (*models.Product, error) {
	if !isValidUUID(id) {
		return nil, fmt.Errorf("invalid product ID format")
	}

	if err := s.validateUpdateRequest(req); err != nil {
		return nil, err
	}

	return s.repo.Update(ctx, id, req)
}

func (s *ProductService) Delete(ctx context.Context, id string) error {
	if !isValidUUID(id) {
		return fmt.Errorf("invalid product ID format")
	}
	return s.repo.Delete(ctx, id)
}

func (s *ProductService) validateCreateRequest(req models.CreateProductRequest) error {
	code := strings.TrimSpace(req.Code)
	if code == "" {
		return fmt.Errorf("product code is required")
	}
	if !isValidCode(code) {
		return fmt.Errorf("product code must be 2-50 alphanumeric characters with hyphens")
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		return fmt.Errorf("product name is required")
	}
	if len(name) > 255 {
		return fmt.Errorf("product name cannot exceed 255 characters")
	}

	return nil
}

func (s *ProductService) validateUpdateRequest(req models.UpdateProductRequest) error {
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return fmt.Errorf("product name cannot be empty")
		}
		if len(name) > 255 {
			return fmt.Errorf("product name cannot exceed 255 characters")
		}
	}
	return nil
}
