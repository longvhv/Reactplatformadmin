package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type DepartmentService struct {
	departmentRepo repository.DepartmentRepository
}

func NewDepartmentService(departmentRepo repository.DepartmentRepository) *DepartmentService {
	return &DepartmentService{
		departmentRepo: departmentRepo,
	}
}

type CreateDepartmentRequest struct {
	TenantID           uuid.UUID              `json:"tenant_id" binding:"required"`
	Code               string                 `json:"code" binding:"required"`
	Name               string                 `json:"name" binding:"required"`
	ParentDepartmentID *uuid.UUID             `json:"parent_department_id"`
	ManagerID          *uuid.UUID             `json:"manager_id"`
	Description        *string                `json:"description"`
	Status             string                 `json:"status"`
	Order              int                    `json:"order"`
	Metadata           map[string]interface{} `json:"metadata"`
}

type UpdateDepartmentRequest struct {
	Name               *string                `json:"name"`
	ParentDepartmentID *uuid.UUID             `json:"parent_department_id"`
	ManagerID          *uuid.UUID             `json:"manager_id"`
	Description        *string                `json:"description"`
	Status             *string                `json:"status"`
	Order              *int                   `json:"order"`
	Metadata           map[string]interface{} `json:"metadata"`
}

// GetByID gets department by ID
func (s *DepartmentService) GetByID(ctx context.Context, id uuid.UUID) (*models.Department, error) {
	return s.departmentRepo.GetByID(ctx, id)
}

// ListByTenant lists departments by tenant
func (s *DepartmentService) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Department, int64, error) {
	offset := (page - 1) * limit
	return s.departmentRepo.ListByTenant(ctx, tenantID, limit, offset)
}

// CreateDepartment creates a new department
func (s *DepartmentService) CreateDepartment(ctx context.Context, req CreateDepartmentRequest) (*models.Department, error) {
	if req.Code == "" {
		return nil, fmt.Errorf("department code is required")
	}

	// Check if code exists in tenant
	exists, err := s.departmentRepo.ExistsByCode(ctx, req.TenantID, req.Code)
	if err != nil {
		return nil, fmt.Errorf("failed to check department code: %w", err)
	}
	if exists {
		return nil, fmt.Errorf("department code already exists")
	}

	status := req.Status
	if status == "" {
		status = "ACTIVE"
	}

	department := &models.Department{
		ID:                 uuid.New(),
		TenantID:           req.TenantID,
		Code:               req.Code,
		Name:               req.Name,
		ParentDepartmentID: req.ParentDepartmentID,
		ManagerID:          req.ManagerID,
		Description:        req.Description,
		Status:             status,
		Order:              req.Order,
		Metadata:           req.Metadata,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
		Version:            1,
	}

	if err := s.departmentRepo.Create(ctx, department); err != nil {
		return nil, fmt.Errorf("failed to create department: %w", err)
	}

	return department, nil
}

// UpdateDepartment updates a department
func (s *DepartmentService) UpdateDepartment(ctx context.Context, id uuid.UUID, req UpdateDepartmentRequest) (*models.Department, error) {
	department, err := s.departmentRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("department not found: %w", err)
	}

	if req.Name != nil {
		department.Name = *req.Name
	}
	if req.ParentDepartmentID != nil {
		// Check for circular reference
		if *req.ParentDepartmentID == id {
			return nil, fmt.Errorf("department cannot be its own parent")
		}
		department.ParentDepartmentID = req.ParentDepartmentID
	}
	if req.ManagerID != nil {
		department.ManagerID = req.ManagerID
	}
	if req.Description != nil {
		department.Description = req.Description
	}
	if req.Status != nil {
		department.Status = *req.Status
	}
	if req.Order != nil {
		department.Order = *req.Order
	}
	if req.Metadata != nil {
		department.Metadata = req.Metadata
	}

	department.UpdatedAt = time.Now()
	department.Version++

	if err := s.departmentRepo.Update(ctx, department); err != nil {
		return nil, fmt.Errorf("failed to update department: %w", err)
	}

	return department, nil
}

// DeleteDepartment deletes a department
func (s *DepartmentService) DeleteDepartment(ctx context.Context, id uuid.UUID) error {
	// Check if department has children
	hasChildren, err := s.departmentRepo.HasChildren(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to check children: %w", err)
	}
	if hasChildren {
		return fmt.Errorf("cannot delete department with children")
	}

	return s.departmentRepo.Delete(ctx, id)
}

// GetTree gets department tree structure
func (s *DepartmentService) GetTree(ctx context.Context, tenantID uuid.UUID) ([]*models.Department, error) {
	departments, _, err := s.departmentRepo.ListByTenant(ctx, tenantID, 1000, 0)
	if err != nil {
		return nil, err
	}

	// Build tree structure
	deptMap := make(map[uuid.UUID]*models.Department)
	var rootDepts []*models.Department

	// First pass: create map
	for _, dept := range departments {
		deptMap[dept.ID] = dept
	}

	// Second pass: build tree
	for _, dept := range departments {
		if dept.ParentDepartmentID == nil {
			rootDepts = append(rootDepts, dept)
		}
	}

	return rootDepts, nil
}
