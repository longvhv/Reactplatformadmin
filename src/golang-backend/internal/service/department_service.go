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

type DepartmentService interface {
	CreateDepartment(ctx context.Context, req *models.CreateDepartmentRequest) (*models.Department, error)
	GetDepartment(ctx context.Context, id uuid.UUID) (*models.Department, error)
	GetDepartmentByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.Department, error)
	ListDepartments(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.Department, int, error)
	ListDepartmentsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error)
	ListDepartmentsByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Department, error)
	ListDepartmentsByStatus(ctx context.Context, tenantID uuid.UUID, status string) ([]*models.Department, error)
	ListDepartmentsByManager(ctx context.Context, managerID uuid.UUID) ([]*models.Department, error)
	GetHierarchy(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error)
	UpdateDepartment(ctx context.Context, id uuid.UUID, req *models.UpdateDepartmentRequest) (*models.Department, error)
	UpdateDepartmentStatus(ctx context.Context, id uuid.UUID, status string) error
	DeleteDepartment(ctx context.Context, id uuid.UUID) error
	SoftDeleteDepartment(ctx context.Context, id uuid.UUID, deletedBy string) error
}

type departmentService struct {
	repo repository.DepartmentRepository
}

func NewDepartmentService(repo repository.DepartmentRepository) DepartmentService {
	return &departmentService{repo: repo}
}

func (s *departmentService) CreateDepartment(ctx context.Context, req *models.CreateDepartmentRequest) (*models.Department, error) {
	now := time.Now()
	dept := &models.Department{
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

	if req.ParentDepartmentID != nil {
		dept.ParentDepartmentID.String = req.ParentDepartmentID.String()
		dept.ParentDepartmentID.Valid = true
	}

	if req.ManagerID != nil {
		dept.ManagerID.String = req.ManagerID.String()
		dept.ManagerID.Valid = true
	}

	if req.Description != "" {
		dept.Description.String = req.Description
		dept.Description.Valid = true
	}

	if req.CreatedBy != nil {
		dept.CreatedBy.String = req.CreatedBy.String()
		dept.CreatedBy.Valid = true
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		dept.Metadata = metadataJSON
	} else {
		dept.Metadata = []byte("{}")
	}

	if err := s.repo.Create(ctx, dept); err != nil {
		return nil, fmt.Errorf("failed to create department: %w", err)
	}

	return dept, nil
}

func (s *departmentService) GetDepartment(ctx context.Context, id uuid.UUID) (*models.Department, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *departmentService) GetDepartmentByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.Department, error) {
	return s.repo.GetByCode(ctx, tenantID, code)
}

func (s *departmentService) ListDepartments(ctx context.Context, page, pageSize int, tenantID *uuid.UUID, status *string) ([]*models.Department, int, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	return s.repo.List(ctx, page, pageSize, tenantID, status)
}

func (s *departmentService) ListDepartmentsByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error) {
	return s.repo.ListByTenantID(ctx, tenantID)
}

func (s *departmentService) ListDepartmentsByParent(ctx context.Context, parentID uuid.UUID) ([]*models.Department, error) {
	return s.repo.ListByParentID(ctx, parentID)
}

func (s *departmentService) ListDepartmentsByStatus(ctx context.Context, tenantID uuid.UUID, status string) ([]*models.Department, error) {
	return s.repo.ListByStatus(ctx, tenantID, status)
}

func (s *departmentService) ListDepartmentsByManager(ctx context.Context, managerID uuid.UUID) ([]*models.Department, error) {
	return s.repo.ListByManager(ctx, managerID)
}

func (s *departmentService) GetHierarchy(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error) {
	return s.repo.GetHierarchy(ctx, tenantID)
}

func (s *departmentService) UpdateDepartment(ctx context.Context, id uuid.UUID, req *models.UpdateDepartmentRequest) (*models.Department, error) {
	dept, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		dept.Name = *req.Name
	}

	if req.ParentDepartmentID != nil {
		dept.ParentDepartmentID.String = req.ParentDepartmentID.String()
		dept.ParentDepartmentID.Valid = true
	}

	if req.ManagerID != nil {
		dept.ManagerID.String = req.ManagerID.String()
		dept.ManagerID.Valid = true
	}

	if req.Description != nil {
		if *req.Description == "" {
			dept.Description.Valid = false
		} else {
			dept.Description.String = *req.Description
			dept.Description.Valid = true
		}
	}

	if req.Status != nil {
		dept.Status = *req.Status
	}

	if req.Order != nil {
		dept.Order = *req.Order
	}

	if req.Metadata != nil {
		metadataJSON, err := json.Marshal(*req.Metadata)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal metadata: %w", err)
		}
		dept.Metadata = metadataJSON
	}

	if req.UpdatedBy != nil {
		dept.UpdatedBy.String = req.UpdatedBy.String()
		dept.UpdatedBy.Valid = true
	}

	dept.UpdatedAt = time.Now()

	if err := s.repo.Update(ctx, dept); err != nil {
		return nil, fmt.Errorf("failed to update department: %w", err)
	}

	return dept, nil
}

func (s *departmentService) UpdateDepartmentStatus(ctx context.Context, id uuid.UUID, status string) error {
	return s.repo.UpdateStatus(ctx, id, status)
}

func (s *departmentService) DeleteDepartment(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *departmentService) SoftDeleteDepartment(ctx context.Context, id uuid.UUID, deletedBy string) error {
	return s.repo.SoftDelete(ctx, id, deletedBy)
}
