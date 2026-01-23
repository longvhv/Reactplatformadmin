package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang-backend/internal/models"
)

// MockUserDelegationRepository is a mock of UserDelegationRepository
type MockUserDelegationRepository struct {
	mock.Mock
}

func (m *MockUserDelegationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserDelegation, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserDelegation), args.Error(1)
}

func (m *MockUserDelegationRepository) List(ctx context.Context, page, pageSize int, delegatorID, delegateID, tenantID *uuid.UUID, status *string) ([]*models.UserDelegation, int, error) {
	args := m.Called(ctx, page, pageSize, delegatorID, delegateID, tenantID, status)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.UserDelegation), args.Int(1), args.Error(2)
}

func (m *MockUserDelegationRepository) ListByDelegator(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error) {
	args := m.Called(ctx, delegatorID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserDelegation), args.Error(1)
}

func (m *MockUserDelegationRepository) ListByDelegate(ctx context.Context, delegateID uuid.UUID) ([]*models.UserDelegation, error) {
	args := m.Called(ctx, delegateID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserDelegation), args.Error(1)
}

func (m *MockUserDelegationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID) ([]*models.UserDelegation, error) {
	args := m.Called(ctx, tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserDelegation), args.Error(1)
}

func (m *MockUserDelegationRepository) GetActiveDelegations(ctx context.Context, delegatorID uuid.UUID) ([]*models.UserDelegation, error) {
	args := m.Called(ctx, delegatorID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserDelegation), args.Error(1)
}

func (m *MockUserDelegationRepository) Create(ctx context.Context, delegation *models.UserDelegation) error {
	args := m.Called(ctx, delegation)
	return args.Error(0)
}

func (m *MockUserDelegationRepository) Update(ctx context.Context, delegation *models.UserDelegation) error {
	args := m.Called(ctx, delegation)
	return args.Error(0)
}

func (m *MockUserDelegationRepository) Activate(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserDelegationRepository) Revoke(ctx context.Context, id uuid.UUID, revokedBy uuid.UUID, reason string) error {
	args := m.Called(ctx, id, revokedBy, reason)
	return args.Error(0)
}

func (m *MockUserDelegationRepository) Suspend(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserDelegationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserDelegationRepository) ExpireOldDelegations(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func TestUserDelegationService_CreateDelegation(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success with minimal data", func(t *testing.T) {
		req := &models.CreateUserDelegationRequest{
			DelegatorID: uuid.New(),
			DelegateID:  uuid.New(),
			AutoExpire:  true,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserDelegation")).Return(nil).Once()

		delegation, err := service.CreateDelegation(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, delegation)
		assert.Equal(t, "pending", delegation.Status)
		assert.False(t, delegation.NotifiedBeforeExpiry)
		assert.True(t, delegation.AutoExpire)
		assert.NotNil(t, delegation.StartDate)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full data", func(t *testing.T) {
		tenantID := uuid.New()
		startDate := time.Now().Add(24 * time.Hour)
		endDate := time.Now().Add(7 * 24 * time.Hour)

		req := &models.CreateUserDelegationRequest{
			DelegatorID: uuid.New(),
			DelegateID:  uuid.New(),
			TenantID:    &tenantID,
			Scope:       "admin",
			Reason:      "Vacation coverage",
			Notes:       "Full access during vacation",
			StartDate:   &startDate,
			EndDate:     &endDate,
			AutoExpire:  true,
			Permissions: []string{"read", "write", "delete"},
			Metadata:    map[string]interface{}{"department": "engineering"},
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserDelegation")).Return(nil).Once()

		delegation, err := service.CreateDelegation(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, delegation)
		assert.True(t, delegation.TenantID.Valid)
		assert.True(t, delegation.Scope.Valid)
		assert.Equal(t, "admin", delegation.Scope.String)
		assert.True(t, delegation.Reason.Valid)
		assert.True(t, delegation.Notes.Valid)
		assert.True(t, delegation.EndDate.Valid)
		assert.NotNil(t, delegation.Permissions)
		assert.NotNil(t, delegation.Metadata)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success without start date defaults to now", func(t *testing.T) {
		req := &models.CreateUserDelegationRequest{
			DelegatorID: uuid.New(),
			DelegateID:  uuid.New(),
			AutoExpire:  false,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserDelegation")).Return(nil).Once()

		delegation, err := service.CreateDelegation(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, delegation.StartDate)
		assert.WithinDuration(t, time.Now(), delegation.StartDate, 2*time.Second)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateUserDelegationRequest{
			DelegatorID: uuid.New(),
			DelegateID:  uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserDelegation")).Return(errors.New("db error")).Once()

		delegation, err := service.CreateDelegation(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, delegation)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_GetDelegation(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		delegationID := uuid.New()
		expected := &models.UserDelegation{
			ID:     delegationID,
			Status: "active",
		}

		mockRepo.On("GetByID", ctx, delegationID).Return(expected, nil).Once()

		delegation, err := service.GetDelegation(ctx, delegationID)

		assert.NoError(t, err)
		assert.NotNil(t, delegation)
		assert.Equal(t, delegationID, delegation.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		delegationID := uuid.New()
		mockRepo.On("GetByID", ctx, delegationID).Return(nil, errors.New("not found")).Once()

		delegation, err := service.GetDelegation(ctx, delegationID)

		assert.Error(t, err)
		assert.Nil(t, delegation)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_ListDelegations(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success - no filters", func(t *testing.T) {
		expected := []*models.UserDelegation{
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*string)(nil)).
			Return(expected, 2, nil).Once()

		delegations, total, err := service.ListDelegations(ctx, 1, 10, nil, nil, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, delegations, 2)
		assert.Equal(t, 2, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with delegator filter", func(t *testing.T) {
		delegatorID := uuid.New()
		expected := []*models.UserDelegation{
			{ID: uuid.New(), DelegatorID: delegatorID},
		}

		mockRepo.On("List", ctx, 1, 10, &delegatorID, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*string)(nil)).
			Return(expected, 1, nil).Once()

		delegations, total, err := service.ListDelegations(ctx, 1, 10, &delegatorID, nil, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, delegations, 1)
		assert.Equal(t, 1, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with status filter", func(t *testing.T) {
		status := "active"
		expected := []*models.UserDelegation{
			{ID: uuid.New(), Status: "active"},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*uuid.UUID)(nil), &status).
			Return(expected, 1, nil).Once()

		delegations, total, err := service.ListDelegations(ctx, 1, 10, nil, nil, nil, &status)

		assert.NoError(t, err)
		assert.Len(t, delegations, 1)
		mockRepo.AssertExpectations(t)
	})

	t.Run("auto-correct page and page size", func(t *testing.T) {
		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*string)(nil)).
			Return([]*models.UserDelegation{}, 0, nil).Once()

		// Invalid page/size should be corrected
		_, _, err := service.ListDelegations(ctx, 0, 200, nil, nil, nil, nil)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_ListDelegationsByDelegator(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		delegatorID := uuid.New()
		expected := []*models.UserDelegation{
			{ID: uuid.New(), DelegatorID: delegatorID},
			{ID: uuid.New(), DelegatorID: delegatorID},
		}

		mockRepo.On("ListByDelegator", ctx, delegatorID).Return(expected, nil).Once()

		delegations, err := service.ListDelegationsByDelegator(ctx, delegatorID)

		assert.NoError(t, err)
		assert.Len(t, delegations, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_ListDelegationsByDelegate(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		delegateID := uuid.New()
		expected := []*models.UserDelegation{
			{ID: uuid.New(), DelegateID: delegateID},
			{ID: uuid.New(), DelegateID: delegateID},
		}

		mockRepo.On("ListByDelegate", ctx, delegateID).Return(expected, nil).Once()

		delegations, err := service.ListDelegationsByDelegate(ctx, delegateID)

		assert.NoError(t, err)
		assert.Len(t, delegations, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_ListDelegationsByTenant(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.UserDelegation{
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("ListByTenant", ctx, tenantID).Return(expected, nil).Once()

		delegations, err := service.ListDelegationsByTenant(ctx, tenantID)

		assert.NoError(t, err)
		assert.Len(t, delegations, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_GetActiveDelegations(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		delegatorID := uuid.New()
		expected := []*models.UserDelegation{
			{ID: uuid.New(), Status: "active"},
			{ID: uuid.New(), Status: "active"},
		}

		mockRepo.On("GetActiveDelegations", ctx, delegatorID).Return(expected, nil).Once()

		delegations, err := service.GetActiveDelegations(ctx, delegatorID)

		assert.NoError(t, err)
		assert.Len(t, delegations, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_UpdateDelegation(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success - update all fields", func(t *testing.T) {
		delegationID := uuid.New()
		existing := &models.UserDelegation{
			ID:         delegationID,
			AutoExpire: false,
		}

		newScope := "limited"
		newReason := "Updated reason"
		newNotes := "Updated notes"
		endDate := time.Now().Add(10 * 24 * time.Hour)
		autoExpire := true
		permissions := []string{"read"}
		metadata := map[string]interface{}{"updated": true}

		req := &models.UpdateUserDelegationRequest{
			Scope:       &newScope,
			Reason:      &newReason,
			Notes:       &newNotes,
			EndDate:     &endDate,
			AutoExpire:  &autoExpire,
			Permissions: &permissions,
			Metadata:    &metadata,
		}

		mockRepo.On("GetByID", ctx, delegationID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDelegation")).Return(nil).Once()

		delegation, err := service.UpdateDelegation(ctx, delegationID, req)

		assert.NoError(t, err)
		assert.NotNil(t, delegation)
		assert.True(t, delegation.Scope.Valid)
		assert.Equal(t, "limited", delegation.Scope.String)
		assert.True(t, delegation.AutoExpire)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - clear optional fields", func(t *testing.T) {
		delegationID := uuid.New()
		existing := &models.UserDelegation{
			ID: delegationID,
			Scope: models.NullString{
				String: "admin",
				Valid:  true,
			},
		}

		emptyScope := ""
		req := &models.UpdateUserDelegationRequest{
			Scope: &emptyScope,
		}

		mockRepo.On("GetByID", ctx, delegationID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.UserDelegation")).Return(nil).Once()

		delegation, err := service.UpdateDelegation(ctx, delegationID, req)

		assert.NoError(t, err)
		assert.False(t, delegation.Scope.Valid)
		mockRepo.AssertExpectations(t)
	})

	t.Run("delegation not found", func(t *testing.T) {
		delegationID := uuid.New()
		req := &models.UpdateUserDelegationRequest{}

		mockRepo.On("GetByID", ctx, delegationID).Return(nil, errors.New("not found")).Once()

		delegation, err := service.UpdateDelegation(ctx, delegationID, req)

		assert.Error(t, err)
		assert.Nil(t, delegation)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_ActivateDelegation(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		delegationID := uuid.New()

		mockRepo.On("Activate", ctx, delegationID).Return(nil).Once()

		err := service.ActivateDelegation(ctx, delegationID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		delegationID := uuid.New()

		mockRepo.On("Activate", ctx, delegationID).Return(errors.New("db error")).Once()

		err := service.ActivateDelegation(ctx, delegationID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_RevokeDelegation(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success with reason", func(t *testing.T) {
		delegationID := uuid.New()
		revokedBy := uuid.New()
		reason := "Security concern"

		mockRepo.On("Revoke", ctx, delegationID, revokedBy, reason).Return(nil).Once()

		err := service.RevokeDelegation(ctx, delegationID, revokedBy, reason)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success without reason", func(t *testing.T) {
		delegationID := uuid.New()
		revokedBy := uuid.New()

		mockRepo.On("Revoke", ctx, delegationID, revokedBy, "").Return(nil).Once()

		err := service.RevokeDelegation(ctx, delegationID, revokedBy, "")

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_SuspendDelegation(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		delegationID := uuid.New()

		mockRepo.On("Suspend", ctx, delegationID).Return(nil).Once()

		err := service.SuspendDelegation(ctx, delegationID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		delegationID := uuid.New()

		mockRepo.On("Suspend", ctx, delegationID).Return(errors.New("db error")).Once()

		err := service.SuspendDelegation(ctx, delegationID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_DeleteDelegation(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		delegationID := uuid.New()

		mockRepo.On("Delete", ctx, delegationID).Return(nil).Once()

		err := service.DeleteDelegation(ctx, delegationID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		delegationID := uuid.New()

		mockRepo.On("Delete", ctx, delegationID).Return(errors.New("db error")).Once()

		err := service.DeleteDelegation(ctx, delegationID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserDelegationService_ExpireOldDelegations(t *testing.T) {
	mockRepo := new(MockUserDelegationRepository)
	service := NewUserDelegationService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		mockRepo.On("ExpireOldDelegations", ctx).Return(nil).Once()

		err := service.ExpireOldDelegations(ctx)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("ExpireOldDelegations", ctx).Return(errors.New("db error")).Once()

		err := service.ExpireOldDelegations(ctx)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}
