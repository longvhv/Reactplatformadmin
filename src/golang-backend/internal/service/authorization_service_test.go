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

func (m *MockRoleRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Role, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Role), args.Error(1)
}

// MockPermissionRepository is a mock of PermissionRepository
type MockPermissionRepository struct {
	mock.Mock
}

func TestAuthorizationService_GetUserPermissions(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("success - from cache", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		cacheKey := "permissions:" + userID.String() + ":" + tenantID.String()
		
		mockCache.On("GetJSON", ctx, cacheKey, mock.AnythingOfType("*[]string")).Return(nil).Once()

		permissions, err := service.GetUserPermissions(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.NotNil(t, permissions)
		mockCache.AssertExpectations(t)
	})

	t.Run("success - from database", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()
		cacheKey := "permissions:" + userID.String() + ":" + tenantID.String()

		userRoles := []*models.UserRole{
			{
				ID:       uuid.New(),
				UserID:   userID,
				RoleID:   roleID,
				IsActive: true,
			},
		}

		role := &models.Role{
			ID:              roleID,
			Name:            "ADMIN",
			PermissionCodes: []string{"user:view", "user:create", "tenant:view"},
		}

		mockCache.On("GetJSON", ctx, cacheKey, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()
		mockCache.On("SetJSON", ctx, cacheKey, mock.Anything, mock.Anything).Return(nil).Once()

		permissions, err := service.GetUserPermissions(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.Len(t, permissions, 3)
		mockCache.AssertExpectations(t)
		mockUserRoleRepo.AssertExpectations(t)
		mockRoleRepo.AssertExpectations(t)
	})

	t.Run("skip inactive roles", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{
				ID:       uuid.New(),
				UserID:   userID,
				RoleID:   roleID,
				IsActive: false, // Inactive
			},
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

		permissions, err := service.GetUserPermissions(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.Empty(t, permissions)
		mockCache.AssertExpectations(t)
		mockUserRoleRepo.AssertExpectations(t)
	})

	t.Run("skip expired roles", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()
		pastTime := time.Now().Add(-24 * time.Hour)

		userRoles := []*models.UserRole{
			{
				ID:        uuid.New(),
				UserID:    userID,
				RoleID:    roleID,
				IsActive:  true,
				ExpiresAt: &pastTime, // Expired
			},
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

		permissions, err := service.GetUserPermissions(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.Empty(t, permissions)
		mockUserRoleRepo.AssertExpectations(t)
	})
}

func TestAuthorizationService_HasPermission(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("has permission", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{
			ID:              roleID,
			PermissionCodes: []string{"user:view", "user:create"},
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

		hasPermission, err := service.HasPermission(ctx, userID, tenantID, "user:view")

		assert.NoError(t, err)
		assert.True(t, hasPermission)
		mockUserRoleRepo.AssertExpectations(t)
	})

	t.Run("does not have permission", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{
			ID:              roleID,
			PermissionCodes: []string{"user:view"},
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

		hasPermission, err := service.HasPermission(ctx, userID, tenantID, "user:delete")

		assert.NoError(t, err)
		assert.False(t, hasPermission)
		mockUserRoleRepo.AssertExpectations(t)
	})
}

func TestAuthorizationService_HasAnyPermission(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("has one of the permissions", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{
			ID:              roleID,
			PermissionCodes: []string{"user:view", "user:create"},
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

		hasAny, err := service.HasAnyPermission(ctx, userID, tenantID, []string{"user:view", "user:delete"})

		assert.NoError(t, err)
		assert.True(t, hasAny)
		mockUserRoleRepo.AssertExpectations(t)
	})

	t.Run("does not have any permission", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{
			ID:              roleID,
			PermissionCodes: []string{"user:view"},
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

		hasAny, err := service.HasAnyPermission(ctx, userID, tenantID, []string{"user:delete", "tenant:delete"})

		assert.NoError(t, err)
		assert.False(t, hasAny)
		mockUserRoleRepo.AssertExpectations(t)
	})
}

func TestAuthorizationService_HasAllPermissions(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("has all permissions", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{
			ID:              roleID,
			PermissionCodes: []string{"user:view", "user:create", "user:update"},
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

		hasAll, err := service.HasAllPermissions(ctx, userID, tenantID, []string{"user:view", "user:create"})

		assert.NoError(t, err)
		assert.True(t, hasAll)
		mockUserRoleRepo.AssertExpectations(t)
	})

	t.Run("missing one permission", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{
			ID:              roleID,
			PermissionCodes: []string{"user:view", "user:create"},
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

		hasAll, err := service.HasAllPermissions(ctx, userID, tenantID, []string{"user:view", "user:delete"})

		assert.NoError(t, err)
		assert.False(t, hasAll)
		mockUserRoleRepo.AssertExpectations(t)
	})
}

func TestAuthorizationService_GetUserRoles(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID1 := uuid.New()
		roleID2 := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID1, IsActive: true},
			{ID: uuid.New(), UserID: userID, RoleID: roleID2, IsActive: true},
		}
		role1 := &models.Role{ID: roleID1, Name: "ADMIN"}
		role2 := &models.Role{ID: roleID2, Name: "EDITOR"}

		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID1).Return(role1, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID2).Return(role2, nil).Once()

		roles, err := service.GetUserRoles(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.Len(t, roles, 2)
		mockUserRoleRepo.AssertExpectations(t)
		mockRoleRepo.AssertExpectations(t)
	})
}

func TestAuthorizationService_IsTenantOwner(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("is owner", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{ID: roleID, Name: "OWNER"}

		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()

		isOwner, err := service.IsTenantOwner(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.True(t, isOwner)
		mockUserRoleRepo.AssertExpectations(t)
	})

	t.Run("is not owner", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{ID: roleID, Name: "MEMBER"}

		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()

		isOwner, err := service.IsTenantOwner(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.False(t, isOwner)
		mockUserRoleRepo.AssertExpectations(t)
	})
}

func TestAuthorizationService_IsTenantAdmin(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("is admin", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{ID: roleID, Name: "ADMIN"}

		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()

		isAdmin, err := service.IsTenantAdmin(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.True(t, isAdmin)
		mockUserRoleRepo.AssertExpectations(t)
	})

	t.Run("owner is also admin", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		roleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, RoleID: roleID, IsActive: true},
		}
		role := &models.Role{ID: roleID, Name: "OWNER"}

		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockRoleRepo.On("GetByID", ctx, roleID).Return(role, nil).Once()

		isAdmin, err := service.IsTenantAdmin(ctx, userID, tenantID)

		assert.NoError(t, err)
		assert.True(t, isAdmin)
		mockUserRoleRepo.AssertExpectations(t)
	})
}

func TestAuthorizationService_GrantRole(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		grantedBy := uuid.New()

		mockUserRoleRepo.On("Create", ctx, mock.AnythingOfType("*models.UserRole")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		err := service.GrantRole(ctx, userID, roleID, tenantID, grantedBy)

		assert.NoError(t, err)
		mockUserRoleRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})
}

func TestAuthorizationService_RevokeRole(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		userRoleID := uuid.New()

		userRoles := []*models.UserRole{
			{ID: userRoleID, UserID: userID, RoleID: roleID, IsActive: true},
		}

		mockUserRoleRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(userRoles, nil).Once()
		mockUserRoleRepo.On("Delete", ctx, userRoleID).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		err := service.RevokeRole(ctx, userID, roleID, tenantID)

		assert.NoError(t, err)
		mockUserRoleRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})
}

func TestAuthorizationService_InvalidateUserPermissions(t *testing.T) {
	mockUserRoleRepo := new(MockUserRoleRepository)
	mockRoleRepo := new(MockRoleRepository)
	mockPermRepo := new(MockPermissionRepository)
	mockCache := new(MockCache)
	service := NewAuthorizationService(mockUserRoleRepo, mockRoleRepo, mockPermRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()

		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		err := service.InvalidateUserPermissions(ctx, userID, tenantID)

		assert.NoError(t, err)
		mockCache.AssertExpectations(t)
	})
}
