package service

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockPermissionRepository is a mock of PermissionRepository
type MockPermissionRepository struct {
	mock.Mock
}

func (m *MockPermissionRepository) ListAll(ctx context.Context) ([]*models.Permission, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Permission), args.Error(1)
}

func (m *MockPermissionRepository) GetByCode(ctx context.Context, code string) (*models.Permission, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Permission), args.Error(1)
}

func (m *MockPermissionRepository) ListByApp(ctx context.Context, appCode string) ([]*models.Permission, error) {
	args := m.Called(ctx, appCode)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Permission), args.Error(1)
}

func TestPermissionService_ListAll(t *testing.T) {
	mockRepo := new(MockPermissionRepository)
	service := NewPermissionService(mockRepo)

	ctx := context.Background()

	t.Run("list all permissions - no app filter", func(t *testing.T) {
		expectedPerms := []*models.Permission{
			{
				Code:        "user.read",
				Name:        "Read User",
				Description: stringPtr("Read user data"),
				AppCode:     "APP1",
			},
			{
				Code:        "user.write",
				Name:        "Write User",
				Description: stringPtr("Write user data"),
				AppCode:     "APP1",
			},
		}

		mockRepo.On("ListAll", ctx).Return(expectedPerms, nil).Once()

		perms, err := service.ListAll(ctx, "")

		assert.NoError(t, err)
		assert.NotNil(t, perms)
		assert.Len(t, perms, 2)
		assert.Equal(t, "user.read", perms[0].Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("list all permissions - with app filter", func(t *testing.T) {
		appCode := "APP1"
		expectedPerms := []*models.Permission{
			{
				Code:        "user.read",
				Name:        "Read User",
				Description: stringPtr("Read user data"),
				AppCode:     appCode,
			},
		}

		mockRepo.On("ListByApp", ctx, appCode).Return(expectedPerms, nil).Once()

		perms, err := service.ListAll(ctx, appCode)

		assert.NoError(t, err)
		assert.NotNil(t, perms)
		assert.Len(t, perms, 1)
		assert.Equal(t, "user.read", perms[0].Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("ListAll", ctx).Return(nil, errors.New("db error")).Once()

		perms, err := service.ListAll(ctx, "")

		assert.Error(t, err)
		assert.Nil(t, perms)
		mockRepo.AssertExpectations(t)
	})
}

func TestPermissionService_GetByCode(t *testing.T) {
	mockRepo := new(MockPermissionRepository)
	service := NewPermissionService(mockRepo)

	ctx := context.Background()
	code := "user.read"

	t.Run("success", func(t *testing.T) {
		expectedPerm := &models.Permission{
			Code:        code,
			Name:        "Read User",
			Description: stringPtr("Read user data"),
			AppCode:     "APP1",
		}

		mockRepo.On("GetByCode", ctx, code).Return(expectedPerm, nil).Once()

		perm, err := service.GetByCode(ctx, code)

		assert.NoError(t, err)
		assert.NotNil(t, perm)
		assert.Equal(t, code, perm.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, code).Return(nil, errors.New("not found")).Once()

		perm, err := service.GetByCode(ctx, code)

		assert.Error(t, err)
		assert.Nil(t, perm)
		mockRepo.AssertExpectations(t)
	})
}

func TestPermissionService_ListByApp(t *testing.T) {
	mockRepo := new(MockPermissionRepository)
	service := NewPermissionService(mockRepo)

	ctx := context.Background()
	appCode := "APP1"

	t.Run("success", func(t *testing.T) {
		expectedPerms := []*models.Permission{
			{
				Code:        "user.read",
				Name:        "Read User",
				Description: stringPtr("Read user data"),
				AppCode:     appCode,
			},
			{
				Code:        "user.write",
				Name:        "Write User",
				Description: stringPtr("Write user data"),
				AppCode:     appCode,
			},
		}

		mockRepo.On("ListByApp", ctx, appCode).Return(expectedPerms, nil).Once()

		perms, err := service.ListByApp(ctx, appCode)

		assert.NoError(t, err)
		assert.NotNil(t, perms)
		assert.Len(t, perms, 2)
		assert.Equal(t, appCode, perms[0].AppCode)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		mockRepo.On("ListByApp", ctx, appCode).Return([]*models.Permission{}, nil).Once()

		perms, err := service.ListByApp(ctx, appCode)

		assert.NoError(t, err)
		assert.NotNil(t, perms)
		assert.Len(t, perms, 0)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("ListByApp", ctx, appCode).Return(nil, errors.New("db error")).Once()

		perms, err := service.ListByApp(ctx, appCode)

		assert.Error(t, err)
		assert.Nil(t, perms)
		mockRepo.AssertExpectations(t)
	})
}

func TestPermissionService_GetTree(t *testing.T) {
	mockRepo := new(MockPermissionRepository)
	service := NewPermissionService(mockRepo)

	ctx := context.Background()
	appCode := "APP1"

	t.Run("success - build tree structure", func(t *testing.T) {
		parentCode := "user"
		permissions := []*models.Permission{
			{
				Code:        "user",
				Name:        "User Management",
				Description: stringPtr("User management permissions"),
				AppCode:     appCode,
				ParentCode:  nil,
			},
			{
				Code:        "user.read",
				Name:        "Read User",
				Description: stringPtr("Read user data"),
				AppCode:     appCode,
				ParentCode:  &parentCode,
			},
			{
				Code:        "user.write",
				Name:        "Write User",
				Description: stringPtr("Write user data"),
				AppCode:     appCode,
				ParentCode:  &parentCode,
			},
		}

		mockRepo.On("ListByApp", ctx, appCode).Return(permissions, nil).Once()

		tree, err := service.GetTree(ctx, appCode)

		assert.NoError(t, err)
		assert.NotNil(t, tree)
		assert.Len(t, tree, 1) // Should only return root permissions
		assert.Equal(t, "user", tree[0].Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - all root permissions", func(t *testing.T) {
		permissions := []*models.Permission{
			{
				Code:        "user",
				Name:        "User Management",
				Description: stringPtr("User management permissions"),
				AppCode:     appCode,
				ParentCode:  nil,
			},
			{
				Code:        "role",
				Name:        "Role Management",
				Description: stringPtr("Role management permissions"),
				AppCode:     appCode,
				ParentCode:  nil,
			},
		}

		mockRepo.On("ListByApp", ctx, appCode).Return(permissions, nil).Once()

		tree, err := service.GetTree(ctx, appCode)

		assert.NoError(t, err)
		assert.NotNil(t, tree)
		assert.Len(t, tree, 2) // Both are root permissions
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("ListByApp", ctx, appCode).Return(nil, errors.New("db error")).Once()

		tree, err := service.GetTree(ctx, appCode)

		assert.Error(t, err)
		assert.Nil(t, tree)
		mockRepo.AssertExpectations(t)
	})
}

// Helper function
func stringPtr(s string) *string {
	return &s
}
