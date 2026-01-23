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

// MockRoleRepository is a mock of RoleRepository
type MockRoleRepository struct {
	mock.Mock
}

func (m *MockRoleRepository) Create(ctx context.Context, role *models.Role) error {
	args := m.Called(ctx, role)
	return args.Error(0)
}

func (m *MockRoleRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Role), args.Error(1)
}

func (m *MockRoleRepository) Update(ctx context.Context, role *models.Role) error {
	args := m.Called(ctx, role)
	return args.Error(0)
}

func (m *MockRoleRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockRoleRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.Role, int64, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Role), args.Get(1).(int64), args.Error(2)
}

func (m *MockRoleRepository) ExistsByName(ctx context.Context, tenantID uuid.UUID, name string) (bool, error) {
	args := m.Called(ctx, tenantID, name)
	return args.Bool(0), args.Error(1)
}

// MockCache is a mock of Cache
type MockCache struct {
	mock.Mock
}

func (m *MockCache) Get(ctx context.Context, key string) (string, error) {
	args := m.Called(ctx, key)
	return args.String(0), args.Error(1)
}

func (m *MockCache) GetJSON(ctx context.Context, key string, dest interface{}) error {
	args := m.Called(ctx, key, dest)
	return args.Error(0)
}

func (m *MockCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	args := m.Called(ctx, key, value, ttl)
	return args.Error(0)
}

func (m *MockCache) SetJSON(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	args := m.Called(ctx, key, value, ttl)
	return args.Error(0)
}

func (m *MockCache) Delete(ctx context.Context, key string) error {
	args := m.Called(ctx, key)
	return args.Error(0)
}

func (m *MockCache) DeletePattern(ctx context.Context, pattern string) error {
	args := m.Called(ctx, pattern)
	return args.Error(0)
}

func TestRoleService_CreateRole(t *testing.T) {
	mockRepo := new(MockRoleRepository)
	mockCache := new(MockCache)
	service := NewRoleService(mockRepo, mockCache)

	ctx := context.Background()
	tenantID := uuid.New()
	name := "Test Role"
	description := "Test description"

	t.Run("success", func(t *testing.T) {
		mockRepo.On("ExistsByName", ctx, tenantID, name).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Role")).Return(nil).Once()

		req := CreateRoleRequest{
			TenantID:        tenantID,
			Name:            name,
			Description:     &description,
			Type:            "CUSTOM",
			PermissionCodes: []string{"user.read", "user.write"},
		}

		role, err := service.CreateRole(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, role)
		assert.Equal(t, name, role.Name)
		assert.Equal(t, &description, role.Description)
		assert.Equal(t, "CUSTOM", role.Type)
		assert.Equal(t, 1, role.Version)
		assert.Len(t, role.PermissionCodes, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - default type", func(t *testing.T) {
		mockRepo.On("ExistsByName", ctx, tenantID, name).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Role")).Return(nil).Once()

		req := CreateRoleRequest{
			TenantID:    tenantID,
			Name:        name,
			Description: &description,
			Type:        "", // Empty type should default to CUSTOM
		}

		role, err := service.CreateRole(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, role)
		assert.Equal(t, "CUSTOM", role.Type)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty name", func(t *testing.T) {
		req := CreateRoleRequest{
			TenantID: tenantID,
			Name:     "",
		}

		role, err := service.CreateRole(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, role)
		assert.Contains(t, err.Error(), "name is required")
	})

	t.Run("name already exists", func(t *testing.T) {
		mockRepo.On("ExistsByName", ctx, tenantID, name).Return(true, nil).Once()

		req := CreateRoleRequest{
			TenantID: tenantID,
			Name:     name,
		}

		role, err := service.CreateRole(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, role)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on exists check", func(t *testing.T) {
		mockRepo.On("ExistsByName", ctx, tenantID, name).Return(false, errors.New("db error")).Once()

		req := CreateRoleRequest{
			TenantID: tenantID,
			Name:     name,
		}

		role, err := service.CreateRole(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, role)
		assert.Contains(t, err.Error(), "failed to check role name")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("ExistsByName", ctx, tenantID, name).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Role")).Return(errors.New("db error")).Once()

		req := CreateRoleRequest{
			TenantID: tenantID,
			Name:     name,
		}

		role, err := service.CreateRole(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, role)
		assert.Contains(t, err.Error(), "failed to create role")
		mockRepo.AssertExpectations(t)
	})
}

func TestRoleService_GetByID(t *testing.T) {
	mockRepo := new(MockRoleRepository)
	mockCache := new(MockCache)
	service := NewRoleService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success - from cache", func(t *testing.T) {
		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(nil).Once()

		role, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, role)
		mockCache.AssertExpectations(t)
	})

	t.Run("success - from database", func(t *testing.T) {
		expectedRole := &models.Role{
			ID:          id,
			TenantID:    uuid.New(),
			Name:        "Test Role",
			Type:        "CUSTOM",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
			Version:     1,
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByID", ctx, id).Return(expectedRole, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, expectedRole, mock.Anything).Return(nil).Once()

		role, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, role)
		assert.Equal(t, expectedRole.ID, role.ID)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		role, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, role)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})
}

func TestRoleService_ListByTenant(t *testing.T) {
	mockRepo := new(MockRoleRepository)
	mockCache := new(MockCache)
	service := NewRoleService(mockRepo, mockCache)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		expectedRoles := []*models.Role{
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Name:     "Role 1",
				Type:     "CUSTOM",
				Version:  1,
			},
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Name:     "Role 2",
				Type:     "SYSTEM",
				Version:  1,
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(expectedRoles, int64(2), nil).Once()

		roles, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, roles)
		assert.Len(t, roles, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		roles, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.Error(t, err)
		assert.Nil(t, roles)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestRoleService_UpdateRole(t *testing.T) {
	mockRepo := new(MockRoleRepository)
	mockCache := new(MockCache)
	service := NewRoleService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingRole := &models.Role{
			ID:              id,
			TenantID:        tenantID,
			Name:            "Old Name",
			Type:            "CUSTOM",
			PermissionCodes: []string{"user.read"},
			Version:         1,
		}

		newName := "New Name"
		newPermissions := []string{"user.read", "user.write"}

		mockRepo.On("GetByID", ctx, id).Return(existingRole, nil).Once()
		mockRepo.On("ExistsByName", ctx, tenantID, newName).Return(false, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Role")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		req := UpdateRoleRequest{
			Name:            &newName,
			PermissionCodes: newPermissions,
		}

		role, err := service.UpdateRole(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, role)
		assert.Equal(t, newName, role.Name)
		assert.Equal(t, newPermissions, role.PermissionCodes)
		assert.Equal(t, 2, role.Version)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("cannot update system role", func(t *testing.T) {
		systemRole := &models.Role{
			ID:       id,
			TenantID: tenantID,
			Name:     "System Admin",
			Type:     "SYSTEM",
			Version:  1,
		}

		newName := "New Name"

		mockRepo.On("GetByID", ctx, id).Return(systemRole, nil).Once()

		req := UpdateRoleRequest{
			Name: &newName,
		}

		role, err := service.UpdateRole(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, role)
		assert.Contains(t, err.Error(), "cannot update system role")
		mockRepo.AssertExpectations(t)
	})

	t.Run("role not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newName := "New Name"
		req := UpdateRoleRequest{
			Name: &newName,
		}

		role, err := service.UpdateRole(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, role)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("name already exists", func(t *testing.T) {
		existingRole := &models.Role{
			ID:       id,
			TenantID: tenantID,
			Name:     "Old Name",
			Type:     "CUSTOM",
			Version:  1,
		}

		newName := "Existing Name"

		mockRepo.On("GetByID", ctx, id).Return(existingRole, nil).Once()
		mockRepo.On("ExistsByName", ctx, tenantID, newName).Return(true, nil).Once()

		req := UpdateRoleRequest{
			Name: &newName,
		}

		role, err := service.UpdateRole(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, role)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})
}

func TestRoleService_DeleteRole(t *testing.T) {
	mockRepo := new(MockRoleRepository)
	mockCache := new(MockCache)
	service := NewRoleService(mockRepo, mockCache)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		role := &models.Role{
			ID:      id,
			Name:    "Test Role",
			Type:    "CUSTOM",
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, id).Return(role, nil).Once()
		mockRepo.On("Delete", ctx, id).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		err := service.DeleteRole(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("cannot delete system role", func(t *testing.T) {
		systemRole := &models.Role{
			ID:      id,
			Name:    "System Admin",
			Type:    "SYSTEM",
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, id).Return(systemRole, nil).Once()

		err := service.DeleteRole(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete system role")
		mockRepo.AssertExpectations(t)
	})

	t.Run("role not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		err := service.DeleteRole(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on delete", func(t *testing.T) {
		role := &models.Role{
			ID:      id,
			Name:    "Test Role",
			Type:    "CUSTOM",
			Version: 1,
		}

		mockRepo.On("GetByID", ctx, id).Return(role, nil).Once()
		mockRepo.On("Delete", ctx, id).Return(errors.New("db error")).Once()

		err := service.DeleteRole(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to delete role")
		mockRepo.AssertExpectations(t)
	})
}
