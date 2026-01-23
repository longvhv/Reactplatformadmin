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

// MockUserRoleRepository is a mock of UserRoleRepository
type MockUserRoleRepository struct {
	mock.Mock
}

func (m *MockUserRoleRepository) ListByUserAndTenant(ctx context.Context, userID, tenantID uuid.UUID) ([]*models.UserRole, error) {
	args := m.Called(ctx, userID, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserRole), args.Error(1)
}

func (m *MockUserRoleRepository) Create(ctx context.Context, userRole *models.UserRole) error {
	args := m.Called(ctx, userRole)
	return args.Error(0)
}

func (m *MockUserRoleRepository) Delete(ctx context.Context, userRoleID uuid.UUID) error {
	args := m.Called(ctx, userRoleID)
	return args.Error(0)
}

func (m *MockUserRoleRepository) RevokeExpiredRoles(ctx context.Context) (int64, error) {
	args := m.Called(ctx)
	return args.Get(0).(int64), args.Error(1)
}

func TestUserRoleService_AssignRole(t *testing.T) {
	mockRepo := new(MockUserRoleRepository)
	service := NewUserRoleService(mockRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		grantedBy := uuid.New()

		req := AssignRoleRequest{
			UserID:   userID,
			RoleID:   roleID,
			TenantID: tenantID,
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return([]*models.UserRole{}, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserRole")).Return(nil).Once()

		err := service.AssignRole(ctx, req, grantedBy)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with custom scope", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		scopeID := uuid.New()
		grantedBy := uuid.New()

		req := AssignRoleRequest{
			UserID:   userID,
			RoleID:   roleID,
			TenantID: tenantID,
			Scope:    "department",
			ScopeID:  &scopeID,
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return([]*models.UserRole{}, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserRole")).Return(nil).Once()

		err := service.AssignRole(ctx, req, grantedBy)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with expiration", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		grantedBy := uuid.New()
		expiresAt := time.Now().Add(90 * 24 * time.Hour)

		req := AssignRoleRequest{
			UserID:    userID,
			RoleID:    roleID,
			TenantID:  tenantID,
			ExpiresAt: &expiresAt,
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return([]*models.UserRole{}, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserRole")).Return(nil).Once()

		err := service.AssignRole(ctx, req, grantedBy)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("role already assigned", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		grantedBy := uuid.New()

		existingRoles := []*models.UserRole{
			{
				ID:       uuid.New(),
				UserID:   userID,
				RoleID:   roleID,
				TenantID: &tenantID,
				IsActive: true,
			},
		}

		req := AssignRoleRequest{
			UserID:   userID,
			RoleID:   roleID,
			TenantID: tenantID,
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(existingRoles, nil).Once()

		err := service.AssignRole(ctx, req, grantedBy)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "already has this role")
		mockRepo.AssertExpectations(t)
	})

	t.Run("can reassign if inactive", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		grantedBy := uuid.New()

		existingRoles := []*models.UserRole{
			{
				ID:       uuid.New(),
				UserID:   userID,
				RoleID:   roleID,
				TenantID: &tenantID,
				IsActive: false, // Inactive, can reassign
			},
		}

		req := AssignRoleRequest{
			UserID:   userID,
			RoleID:   roleID,
			TenantID: tenantID,
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(existingRoles, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserRole")).Return(nil).Once()

		err := service.AssignRole(ctx, req, grantedBy)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("different role can be assigned", func(t *testing.T) {
		userID := uuid.New()
		existingRoleID := uuid.New()
		newRoleID := uuid.New()
		tenantID := uuid.New()
		grantedBy := uuid.New()

		existingRoles := []*models.UserRole{
			{
				ID:       uuid.New(),
				UserID:   userID,
				RoleID:   existingRoleID, // Different role
				TenantID: &tenantID,
				IsActive: true,
			},
		}

		req := AssignRoleRequest{
			UserID:   userID,
			RoleID:   newRoleID,
			TenantID: tenantID,
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(existingRoles, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserRole")).Return(nil).Once()

		err := service.AssignRole(ctx, req, grantedBy)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("error checking existing roles", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		grantedBy := uuid.New()

		req := AssignRoleRequest{
			UserID:   userID,
			RoleID:   roleID,
			TenantID: tenantID,
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(nil, errors.New("db error")).Once()

		err := service.AssignRole(ctx, req, grantedBy)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to check existing roles")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		userID := uuid.New()
		roleID := uuid.New()
		tenantID := uuid.New()
		grantedBy := uuid.New()

		req := AssignRoleRequest{
			UserID:   userID,
			RoleID:   roleID,
			TenantID: tenantID,
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return([]*models.UserRole{}, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserRole")).Return(errors.New("db error")).Once()

		err := service.AssignRole(ctx, req, grantedBy)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to assign role")
		mockRepo.AssertExpectations(t)
	})
}

func TestUserRoleService_ListByUserAndTenant(t *testing.T) {
	mockRepo := new(MockUserRoleRepository)
	service := NewUserRoleService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		expected := []*models.UserRole{
			{ID: uuid.New(), UserID: userID, TenantID: &tenantID},
			{ID: uuid.New(), UserID: userID, TenantID: &tenantID},
			{ID: uuid.New(), UserID: userID, TenantID: &tenantID},
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(expected, nil).Once()

		roles, total, err := service.ListByUserAndTenant(ctx, userID, tenantID, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, roles, 3)
		assert.Equal(t, int64(3), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("pagination - first page", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		expected := []*models.UserRole{
			{ID: uuid.New()},
			{ID: uuid.New()},
			{ID: uuid.New()},
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(expected, nil).Once()

		roles, total, err := service.ListByUserAndTenant(ctx, userID, tenantID, 1, 3)

		assert.NoError(t, err)
		assert.Len(t, roles, 3)
		assert.Equal(t, int64(5), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("pagination - second page", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		expected := []*models.UserRole{
			{ID: uuid.New()},
			{ID: uuid.New()},
			{ID: uuid.New()},
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(expected, nil).Once()

		roles, total, err := service.ListByUserAndTenant(ctx, userID, tenantID, 2, 3)

		assert.NoError(t, err)
		assert.Len(t, roles, 2) // Only 2 remaining
		assert.Equal(t, int64(5), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("pagination - out of range", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		expected := []*models.UserRole{
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(expected, nil).Once()

		roles, total, err := service.ListByUserAndTenant(ctx, userID, tenantID, 3, 10)

		assert.NoError(t, err)
		assert.Len(t, roles, 0)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return([]*models.UserRole{}, nil).Once()

		roles, total, err := service.ListByUserAndTenant(ctx, userID, tenantID, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, roles, 0)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()

		mockRepo.On("ListByUserAndTenant", ctx, userID, tenantID).Return(nil, errors.New("db error")).Once()

		roles, total, err := service.ListByUserAndTenant(ctx, userID, tenantID, 1, 10)

		assert.Error(t, err)
		assert.Nil(t, roles)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserRoleService_RevokeRole(t *testing.T) {
	mockRepo := new(MockUserRoleRepository)
	service := NewUserRoleService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userRoleID := uuid.New()

		mockRepo.On("Delete", ctx, userRoleID).Return(nil).Once()

		err := service.RevokeRole(ctx, userRoleID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		userRoleID := uuid.New()

		mockRepo.On("Delete", ctx, userRoleID).Return(errors.New("db error")).Once()

		err := service.RevokeRole(ctx, userRoleID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		userRoleID := uuid.New()

		mockRepo.On("Delete", ctx, userRoleID).Return(errors.New("not found")).Once()

		err := service.RevokeRole(ctx, userRoleID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserRoleService_RevokeExpiredRoles(t *testing.T) {
	mockRepo := new(MockUserRoleRepository)
	service := NewUserRoleService(mockRepo)
	ctx := context.Background()

	t.Run("success - some revoked", func(t *testing.T) {
		mockRepo.On("RevokeExpiredRoles", ctx).Return(int64(5), nil).Once()

		count, err := service.RevokeExpiredRoles(ctx)

		assert.NoError(t, err)
		assert.Equal(t, int64(5), count)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - none revoked", func(t *testing.T) {
		mockRepo.On("RevokeExpiredRoles", ctx).Return(int64(0), nil).Once()

		count, err := service.RevokeExpiredRoles(ctx)

		assert.NoError(t, err)
		assert.Equal(t, int64(0), count)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("RevokeExpiredRoles", ctx).Return(int64(0), errors.New("db error")).Once()

		count, err := service.RevokeExpiredRoles(ctx)

		assert.Error(t, err)
		assert.Equal(t, int64(0), count)
		mockRepo.AssertExpectations(t)
	})
}
