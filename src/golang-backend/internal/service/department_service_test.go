package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockDepartmentRepository is a mock of DepartmentRepository
type MockDepartmentRepository struct {
	mock.Mock
}

func (m *MockDepartmentRepository) Create(ctx context.Context, dept *models.Department) error {
	args := m.Called(ctx, dept)
	return args.Error(0)
}

func (m *MockDepartmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Department, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Department), args.Error(1)
}

func (m *MockDepartmentRepository) Update(ctx context.Context, dept *models.Department) error {
	args := m.Called(ctx, dept)
	return args.Error(0)
}

func (m *MockDepartmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockDepartmentRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.Department, int64, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Department), args.Get(1).(int64), args.Error(2)
}

func (m *MockDepartmentRepository) ExistsByCode(ctx context.Context, tenantID uuid.UUID, code string) (bool, error) {
	args := m.Called(ctx, tenantID, code)
	return args.Bool(0), args.Error(1)
}

func (m *MockDepartmentRepository) HasChildren(ctx context.Context, id uuid.UUID) (bool, error) {
	args := m.Called(ctx, id)
	return args.Bool(0), args.Error(1)
}

func TestDepartmentService_CreateDepartment(t *testing.T) {
	mockRepo := new(MockDepartmentRepository)
	service := NewDepartmentService(mockRepo)

	ctx := context.Background()
	tenantID := uuid.New()
	code := "DEPT001"
	name := "Engineering"

	t.Run("success", func(t *testing.T) {
		description := "Engineering Department"
		managerID := uuid.New()

		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Department")).Return(nil).Once()

		req := CreateDepartmentRequest{
			TenantID:    tenantID,
			Code:        code,
			Name:        name,
			Description: &description,
			ManagerID:   &managerID,
			Status:      "ACTIVE",
			Order:       1,
		}

		dept, err := service.CreateDepartment(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, dept)
		assert.Equal(t, code, dept.Code)
		assert.Equal(t, name, dept.Name)
		assert.Equal(t, "ACTIVE", dept.Status)
		assert.Equal(t, 1, dept.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - default status", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Department")).Return(nil).Once()

		req := CreateDepartmentRequest{
			TenantID: tenantID,
			Code:     code,
			Name:     name,
			Status:   "", // Should default to ACTIVE
		}

		dept, err := service.CreateDepartment(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, dept)
		assert.Equal(t, "ACTIVE", dept.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty code", func(t *testing.T) {
		req := CreateDepartmentRequest{
			TenantID: tenantID,
			Code:     "",
			Name:     name,
		}

		dept, err := service.CreateDepartment(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, dept)
		assert.Contains(t, err.Error(), "code is required")
	})

	t.Run("code already exists", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(true, nil).Once()

		req := CreateDepartmentRequest{
			TenantID: tenantID,
			Code:     code,
			Name:     name,
		}

		dept, err := service.CreateDepartment(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, dept)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on exists check", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, errors.New("db error")).Once()

		req := CreateDepartmentRequest{
			TenantID: tenantID,
			Code:     code,
			Name:     name,
		}

		dept, err := service.CreateDepartment(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, dept)
		assert.Contains(t, err.Error(), "failed to check department code")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Department")).Return(errors.New("db error")).Once()

		req := CreateDepartmentRequest{
			TenantID: tenantID,
			Code:     code,
			Name:     name,
		}

		dept, err := service.CreateDepartment(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, dept)
		assert.Contains(t, err.Error(), "failed to create department")
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_GetByID(t *testing.T) {
	mockRepo := new(MockDepartmentRepository)
	service := NewDepartmentService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		expectedDept := &models.Department{
			ID:        id,
			TenantID:  uuid.New(),
			Code:      "DEPT001",
			Name:      "Engineering",
			Status:    "ACTIVE",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, id).Return(expectedDept, nil).Once()

		dept, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, dept)
		assert.Equal(t, id, dept.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		dept, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, dept)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_ListByTenant(t *testing.T) {
	mockRepo := new(MockDepartmentRepository)
	service := NewDepartmentService(mockRepo)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		expectedDepts := []*models.Department{
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "DEPT001",
				Name:     "Engineering",
				Status:   "ACTIVE",
				Version:  1,
			},
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "DEPT002",
				Name:     "Sales",
				Status:   "ACTIVE",
				Version:  1,
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(expectedDepts, int64(2), nil).Once()

		depts, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, depts)
		assert.Len(t, depts, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		depts, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.Error(t, err)
		assert.Nil(t, depts)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_UpdateDepartment(t *testing.T) {
	mockRepo := new(MockDepartmentRepository)
	service := NewDepartmentService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingDept := &models.Department{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "DEPT001",
			Name:     "Old Name",
			Status:   "ACTIVE",
			Version:  1,
		}

		newName := "New Name"
		newStatus := "INACTIVE"

		mockRepo.On("GetByID", ctx, id).Return(existingDept, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Department")).Return(nil).Once()

		req := UpdateDepartmentRequest{
			Name:   &newName,
			Status: &newStatus,
		}

		dept, err := service.UpdateDepartment(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, dept)
		assert.Equal(t, newName, dept.Name)
		assert.Equal(t, newStatus, dept.Status)
		assert.Equal(t, 2, dept.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("circular parent reference", func(t *testing.T) {
		existingDept := &models.Department{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "DEPT001",
			Name:     "Department",
			Status:   "ACTIVE",
			Version:  1,
		}

		mockRepo.On("GetByID", ctx, id).Return(existingDept, nil).Once()

		req := UpdateDepartmentRequest{
			ParentDepartmentID: &id, // Same as department ID
		}

		dept, err := service.UpdateDepartment(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, dept)
		assert.Contains(t, err.Error(), "cannot be its own parent")
		mockRepo.AssertExpectations(t)
	})

	t.Run("department not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newName := "New Name"
		req := UpdateDepartmentRequest{
			Name: &newName,
		}

		dept, err := service.UpdateDepartment(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, dept)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		existingDept := &models.Department{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "DEPT001",
			Name:     "Old Name",
			Status:   "ACTIVE",
			Version:  1,
		}

		newName := "New Name"

		mockRepo.On("GetByID", ctx, id).Return(existingDept, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Department")).Return(errors.New("db error")).Once()

		req := UpdateDepartmentRequest{
			Name: &newName,
		}

		dept, err := service.UpdateDepartment(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, dept)
		assert.Contains(t, err.Error(), "failed to update department")
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_DeleteDepartment(t *testing.T) {
	mockRepo := new(MockDepartmentRepository)
	service := NewDepartmentService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockRepo.On("HasChildren", ctx, id).Return(false, nil).Once()
		mockRepo.On("Delete", ctx, id).Return(nil).Once()

		err := service.DeleteDepartment(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("has children", func(t *testing.T) {
		mockRepo.On("HasChildren", ctx, id).Return(true, nil).Once()

		err := service.DeleteDepartment(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete department with children")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on has children check", func(t *testing.T) {
		mockRepo.On("HasChildren", ctx, id).Return(false, errors.New("db error")).Once()

		err := service.DeleteDepartment(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to check children")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on delete", func(t *testing.T) {
		mockRepo.On("HasChildren", ctx, id).Return(false, nil).Once()
		mockRepo.On("Delete", ctx, id).Return(errors.New("db error")).Once()

		err := service.DeleteDepartment(ctx, id)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentService_GetTree(t *testing.T) {
	mockRepo := new(MockDepartmentRepository)
	service := NewDepartmentService(mockRepo)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success - build tree", func(t *testing.T) {
		parentID := uuid.New()
		departments := []*models.Department{
			{
				ID:                 parentID,
				TenantID:           tenantID,
				Code:               "DEPT001",
				Name:               "Engineering",
				ParentDepartmentID: nil,
				Status:             "ACTIVE",
				Version:            1,
			},
			{
				ID:                 uuid.New(),
				TenantID:           tenantID,
				Code:               "DEPT002",
				Name:               "Backend Team",
				ParentDepartmentID: &parentID,
				Status:             "ACTIVE",
				Version:            1,
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, 1000, 0).Return(departments, int64(2), nil).Once()

		tree, err := service.GetTree(ctx, tenantID)

		assert.NoError(t, err)
		assert.NotNil(t, tree)
		assert.Len(t, tree, 1) // Only root department
		assert.Equal(t, "Engineering", tree[0].Name)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("ListByTenant", ctx, tenantID, 1000, 0).Return(nil, int64(0), errors.New("db error")).Once()

		tree, err := service.GetTree(ctx, tenantID)

		assert.Error(t, err)
		assert.Nil(t, tree)
		mockRepo.AssertExpectations(t)
	})
}
