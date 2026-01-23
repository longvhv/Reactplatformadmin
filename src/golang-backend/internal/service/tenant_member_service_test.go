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

// MockTenantMemberRepository is a mock of TenantMemberRepository
type MockTenantMemberRepository struct {
	mock.Mock
}

func (m *MockTenantMemberRepository) Create(ctx context.Context, member *models.TenantMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func (m *MockTenantMemberRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantMember, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantMember), args.Error(1)
}

func (m *MockTenantMemberRepository) Update(ctx context.Context, member *models.TenantMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func (m *MockTenantMemberRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockTenantMemberRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, limit, offset int) ([]*models.TenantMember, int64, error) {
	args := m.Called(ctx, tenantID, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.TenantMember), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantMemberRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]*models.TenantMember, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.TenantMember), args.Error(1)
}

func (m *MockTenantMemberRepository) Exists(ctx context.Context, tenantID, userID uuid.UUID) (bool, error) {
	args := m.Called(ctx, tenantID, userID)
	return args.Bool(0), args.Error(1)
}

func (m *MockTenantMemberRepository) CountOwners(ctx context.Context, tenantID uuid.UUID) (int64, error) {
	args := m.Called(ctx, tenantID)
	return args.Get(0).(int64), args.Error(1)
}

func TestTenantMemberService_AddMember(t *testing.T) {
	mockRepo := new(MockTenantMemberRepository)
	service := NewTenantMemberService(mockRepo)

	ctx := context.Background()
	tenantID := uuid.New()
	userID := uuid.New()

	t.Run("success", func(t *testing.T) {
		employeeCode := "EMP001"
		email := "john@company.com"
		jobTitle := "Software Engineer"

		mockRepo.On("Exists", ctx, tenantID, userID).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantMember")).Return(nil).Once()

		req := AddTenantMemberRequest{
			TenantID:      tenantID,
			UserID:        userID,
			Role:          "MEMBER",
			EmployeeCode:  &employeeCode,
			InternalEmail: &email,
			JobTitle:      &jobTitle,
			Permissions:   []string{"read", "write"},
		}

		member, err := service.AddMember(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, member)
		assert.Equal(t, tenantID, member.TenantID)
		assert.Equal(t, userID, member.UserID)
		assert.Equal(t, "MEMBER", member.Role)
		assert.Equal(t, "ACTIVE", member.Status)
		assert.Equal(t, 1, member.Version)
		assert.NotNil(t, member.JoinedAt)
		mockRepo.AssertExpectations(t)
	})

	t.Run("user already member", func(t *testing.T) {
		mockRepo.On("Exists", ctx, tenantID, userID).Return(true, nil).Once()

		req := AddTenantMemberRequest{
			TenantID: tenantID,
			UserID:   userID,
			Role:     "MEMBER",
		}

		member, err := service.AddMember(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		assert.Contains(t, err.Error(), "already a member")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on exists check", func(t *testing.T) {
		mockRepo.On("Exists", ctx, tenantID, userID).Return(false, errors.New("db error")).Once()

		req := AddTenantMemberRequest{
			TenantID: tenantID,
			UserID:   userID,
			Role:     "MEMBER",
		}

		member, err := service.AddMember(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		assert.Contains(t, err.Error(), "failed to check membership")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockRepo.On("Exists", ctx, tenantID, userID).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantMember")).Return(errors.New("db error")).Once()

		req := AddTenantMemberRequest{
			TenantID: tenantID,
			UserID:   userID,
			Role:     "MEMBER",
		}

		member, err := service.AddMember(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		assert.Contains(t, err.Error(), "failed to add member")
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantMemberService_GetByID(t *testing.T) {
	mockRepo := new(MockTenantMemberRepository)
	service := NewTenantMemberService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		now := time.Now()
		expectedMember := &models.TenantMember{
			ID:        id,
			TenantID:  uuid.New(),
			UserID:    uuid.New(),
			Role:      "MEMBER",
			Status:    "ACTIVE",
			JoinedAt:  &now,
			CreatedAt: now,
			UpdatedAt: now,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, id).Return(expectedMember, nil).Once()

		member, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, member)
		assert.Equal(t, id, member.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		member, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, member)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantMemberService_ListByTenant(t *testing.T) {
	mockRepo := new(MockTenantMemberRepository)
	service := NewTenantMemberService(mockRepo)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0
		now := time.Now()

		expectedMembers := []*models.TenantMember{
			{
				ID:        uuid.New(),
				TenantID:  tenantID,
				UserID:    uuid.New(),
				Role:      "OWNER",
				Status:    "ACTIVE",
				JoinedAt:  &now,
				CreatedAt: now,
				UpdatedAt: now,
				Version:   1,
			},
			{
				ID:        uuid.New(),
				TenantID:  tenantID,
				UserID:    uuid.New(),
				Role:      "MEMBER",
				Status:    "ACTIVE",
				JoinedAt:  &now,
				CreatedAt: now,
				UpdatedAt: now,
				Version:   1,
			},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(expectedMembers, int64(2), nil).Once()

		members, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, members)
		assert.Len(t, members, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0

		mockRepo.On("ListByTenant", ctx, tenantID, limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		members, total, err := service.ListByTenant(ctx, tenantID, page, limit)

		assert.Error(t, err)
		assert.Nil(t, members)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantMemberService_ListByUser(t *testing.T) {
	mockRepo := new(MockTenantMemberRepository)
	service := NewTenantMemberService(mockRepo)

	ctx := context.Background()
	userID := uuid.New()

	t.Run("success", func(t *testing.T) {
		now := time.Now()

		expectedMembers := []*models.TenantMember{
			{
				ID:        uuid.New(),
				TenantID:  uuid.New(),
				UserID:    userID,
				Role:      "OWNER",
				Status:    "ACTIVE",
				JoinedAt:  &now,
				CreatedAt: now,
				UpdatedAt: now,
				Version:   1,
			},
			{
				ID:        uuid.New(),
				TenantID:  uuid.New(),
				UserID:    userID,
				Role:      "MEMBER",
				Status:    "ACTIVE",
				JoinedAt:  &now,
				CreatedAt: now,
				UpdatedAt: now,
				Version:   1,
			},
		}

		mockRepo.On("ListByUser", ctx, userID).Return(expectedMembers, nil).Once()

		members, err := service.ListByUser(ctx, userID)

		assert.NoError(t, err)
		assert.NotNil(t, members)
		assert.Len(t, members, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("ListByUser", ctx, userID).Return(nil, errors.New("db error")).Once()

		members, err := service.ListByUser(ctx, userID)

		assert.Error(t, err)
		assert.Nil(t, members)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantMemberService_UpdateMember(t *testing.T) {
	mockRepo := new(MockTenantMemberRepository)
	service := NewTenantMemberService(mockRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		now := time.Now()
		existingMember := &models.TenantMember{
			ID:        id,
			TenantID:  uuid.New(),
			UserID:    uuid.New(),
			Role:      "MEMBER",
			Status:    "ACTIVE",
			JoinedAt:  &now,
			CreatedAt: now,
			UpdatedAt: now,
			Version:   1,
		}

		newRole := "ADMIN"
		newStatus := "INACTIVE"
		newJobTitle := "Senior Engineer"

		mockRepo.On("GetByID", ctx, id).Return(existingMember, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantMember")).Return(nil).Once()

		req := UpdateTenantMemberRequest{
			Role:     &newRole,
			Status:   &newStatus,
			JobTitle: &newJobTitle,
		}

		member, err := service.UpdateMember(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, member)
		assert.Equal(t, newRole, member.Role)
		assert.Equal(t, newStatus, member.Status)
		assert.Equal(t, &newJobTitle, member.JobTitle)
		assert.Equal(t, 2, member.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("member not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newRole := "ADMIN"
		req := UpdateTenantMemberRequest{
			Role: &newRole,
		}

		member, err := service.UpdateMember(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		now := time.Now()
		existingMember := &models.TenantMember{
			ID:        id,
			TenantID:  uuid.New(),
			UserID:    uuid.New(),
			Role:      "MEMBER",
			Status:    "ACTIVE",
			JoinedAt:  &now,
			CreatedAt: now,
			UpdatedAt: now,
			Version:   1,
		}

		newRole := "ADMIN"

		mockRepo.On("GetByID", ctx, id).Return(existingMember, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantMember")).Return(errors.New("db error")).Once()

		req := UpdateTenantMemberRequest{
			Role: &newRole,
		}

		member, err := service.UpdateMember(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		assert.Contains(t, err.Error(), "failed to update member")
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantMemberService_RemoveMember(t *testing.T) {
	mockRepo := new(MockTenantMemberRepository)
	service := NewTenantMemberService(mockRepo)

	ctx := context.Background()
	id := uuid.New()
	tenantID := uuid.New()

	t.Run("success - non-owner", func(t *testing.T) {
		now := time.Now()
		member := &models.TenantMember{
			ID:        id,
			TenantID:  tenantID,
			UserID:    uuid.New(),
			Role:      "MEMBER",
			Status:    "ACTIVE",
			JoinedAt:  &now,
			CreatedAt: now,
			UpdatedAt: now,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, id).Return(member, nil).Once()
		mockRepo.On("Delete", ctx, id).Return(nil).Once()

		err := service.RemoveMember(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - owner with multiple owners", func(t *testing.T) {
		now := time.Now()
		ownerMember := &models.TenantMember{
			ID:        id,
			TenantID:  tenantID,
			UserID:    uuid.New(),
			Role:      "OWNER",
			Status:    "ACTIVE",
			JoinedAt:  &now,
			CreatedAt: now,
			UpdatedAt: now,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, id).Return(ownerMember, nil).Once()
		mockRepo.On("CountOwners", ctx, tenantID).Return(int64(2), nil).Once()
		mockRepo.On("Delete", ctx, id).Return(nil).Once()

		err := service.RemoveMember(ctx, id)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("cannot remove last owner", func(t *testing.T) {
		now := time.Now()
		lastOwner := &models.TenantMember{
			ID:        id,
			TenantID:  tenantID,
			UserID:    uuid.New(),
			Role:      "OWNER",
			Status:    "ACTIVE",
			JoinedAt:  &now,
			CreatedAt: now,
			UpdatedAt: now,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, id).Return(lastOwner, nil).Once()
		mockRepo.On("CountOwners", ctx, tenantID).Return(int64(1), nil).Once()

		err := service.RemoveMember(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot remove the last owner")
		mockRepo.AssertExpectations(t)
	})

	t.Run("member not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		err := service.RemoveMember(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error on count owners", func(t *testing.T) {
		now := time.Now()
		ownerMember := &models.TenantMember{
			ID:        id,
			TenantID:  tenantID,
			UserID:    uuid.New(),
			Role:      "OWNER",
			Status:    "ACTIVE",
			JoinedAt:  &now,
			CreatedAt: now,
			UpdatedAt: now,
			Version:   1,
		}

		mockRepo.On("GetByID", ctx, id).Return(ownerMember, nil).Once()
		mockRepo.On("CountOwners", ctx, tenantID).Return(int64(0), errors.New("db error")).Once()

		err := service.RemoveMember(ctx, id)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to count owners")
		mockRepo.AssertExpectations(t)
	})
}
