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

// MockTenantInvitationRepository is a mock of TenantInvitationRepository
type MockTenantInvitationRepository struct {
	mock.Mock
}

func (m *MockTenantInvitationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantInvitation, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantInvitation), args.Error(1)
}

func (m *MockTenantInvitationRepository) GetByToken(ctx context.Context, token string) (*models.TenantInvitation, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantInvitation), args.Error(1)
}

func (m *MockTenantInvitationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, status string, limit, offset int) ([]*models.TenantInvitation, int64, error) {
	args := m.Called(ctx, tenantID, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.TenantInvitation), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantInvitationRepository) ExistsPending(ctx context.Context, tenantID uuid.UUID, email string) (bool, error) {
	args := m.Called(ctx, tenantID, email)
	return args.Bool(0), args.Error(1)
}

func (m *MockTenantInvitationRepository) Create(ctx context.Context, invitation *models.TenantInvitation) error {
	args := m.Called(ctx, invitation)
	return args.Error(0)
}

func (m *MockTenantInvitationRepository) Update(ctx context.Context, invitation *models.TenantInvitation) error {
	args := m.Called(ctx, invitation)
	return args.Error(0)
}

func (m *MockTenantInvitationRepository) MarkExpired(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

// MockTenantMemberRepository is a mock
type MockTenantMemberRepository struct {
	mock.Mock
}

func (m *MockTenantMemberRepository) ExistsByEmail(ctx context.Context, tenantID uuid.UUID, email string) (bool, error) {
	args := m.Called(ctx, tenantID, email)
	return args.Bool(0), args.Error(1)
}

func (m *MockTenantMemberRepository) Create(ctx context.Context, member *models.TenantMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func TestTenantInvitationService_CreateInvitation(t *testing.T) {
	mockInvitationRepo := new(MockTenantInvitationRepository)
	mockMemberRepo := new(MockTenantMemberRepository)
	service := NewTenantInvitationService(mockInvitationRepo, mockMemberRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		invitedBy := uuid.New()
		req := CreateTenantInvitationRequest{
			TenantID:  tenantID,
			Email:     "newuser@example.com",
			RoleIDs:   []string{"role1", "role2"},
			InvitedBy: invitedBy,
		}

		mockMemberRepo.On("ExistsByEmail", ctx, tenantID, "newuser@example.com").Return(false, nil).Once()
		mockInvitationRepo.On("ExistsPending", ctx, tenantID, "newuser@example.com").Return(false, nil).Once()
		mockInvitationRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantInvitation")).Return(nil).Once()

		invitation, err := service.CreateInvitation(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, invitation)
		assert.Equal(t, "newuser@example.com", invitation.Email)
		assert.Equal(t, "PENDING", invitation.Status)
		assert.NotEmpty(t, invitation.Token)
		assert.True(t, invitation.ExpiresAt.After(time.Now()))
		mockMemberRepo.AssertExpectations(t)
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("user already member", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantInvitationRequest{
			TenantID:  tenantID,
			Email:     "existing@example.com",
			InvitedBy: uuid.New(),
		}

		mockMemberRepo.On("ExistsByEmail", ctx, tenantID, "existing@example.com").Return(true, nil).Once()

		invitation, err := service.CreateInvitation(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, invitation)
		assert.Contains(t, err.Error(), "already a member")
		mockMemberRepo.AssertExpectations(t)
	})

	t.Run("pending invitation exists", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantInvitationRequest{
			TenantID:  tenantID,
			Email:     "pending@example.com",
			InvitedBy: uuid.New(),
		}

		mockMemberRepo.On("ExistsByEmail", ctx, tenantID, "pending@example.com").Return(false, nil).Once()
		mockInvitationRepo.On("ExistsPending", ctx, tenantID, "pending@example.com").Return(true, nil).Once()

		invitation, err := service.CreateInvitation(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, invitation)
		assert.Contains(t, err.Error(), "pending invitation already exists")
		mockMemberRepo.AssertExpectations(t)
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("with department", func(t *testing.T) {
		tenantID := uuid.New()
		deptID := uuid.New()
		req := CreateTenantInvitationRequest{
			TenantID:     tenantID,
			Email:        "user@example.com",
			DepartmentID: &deptID,
			InvitedBy:    uuid.New(),
		}

		mockMemberRepo.On("ExistsByEmail", ctx, tenantID, "user@example.com").Return(false, nil).Once()
		mockInvitationRepo.On("ExistsPending", ctx, tenantID, "user@example.com").Return(false, nil).Once()
		mockInvitationRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantInvitation")).Return(nil).Once()

		invitation, err := service.CreateInvitation(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, invitation.DepartmentID)
		assert.Equal(t, deptID, *invitation.DepartmentID)
		mockMemberRepo.AssertExpectations(t)
		mockInvitationRepo.AssertExpectations(t)
	})
}

func TestTenantInvitationService_GetByID(t *testing.T) {
	mockInvitationRepo := new(MockTenantInvitationRepository)
	mockMemberRepo := new(MockTenantMemberRepository)
	service := NewTenantInvitationService(mockInvitationRepo, mockMemberRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		invitationID := uuid.New()
		expected := &models.TenantInvitation{
			ID:     invitationID,
			Email:  "user@example.com",
			Status: "PENDING",
		}

		mockInvitationRepo.On("GetByID", ctx, invitationID).Return(expected, nil).Once()

		invitation, err := service.GetByID(ctx, invitationID)

		assert.NoError(t, err)
		assert.NotNil(t, invitation)
		assert.Equal(t, invitationID, invitation.ID)
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		invitationID := uuid.New()
		mockInvitationRepo.On("GetByID", ctx, invitationID).Return(nil, errors.New("not found")).Once()

		invitation, err := service.GetByID(ctx, invitationID)

		assert.Error(t, err)
		assert.Nil(t, invitation)
		mockInvitationRepo.AssertExpectations(t)
	})
}

func TestTenantInvitationService_GetByToken(t *testing.T) {
	mockInvitationRepo := new(MockTenantInvitationRepository)
	mockMemberRepo := new(MockTenantMemberRepository)
	service := NewTenantInvitationService(mockInvitationRepo, mockMemberRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		token := "abc123token"
		expected := &models.TenantInvitation{
			ID:     uuid.New(),
			Token:  token,
			Status: "PENDING",
		}

		mockInvitationRepo.On("GetByToken", ctx, token).Return(expected, nil).Once()

		invitation, err := service.GetByToken(ctx, token)

		assert.NoError(t, err)
		assert.NotNil(t, invitation)
		assert.Equal(t, token, invitation.Token)
		mockInvitationRepo.AssertExpectations(t)
	})
}

func TestTenantInvitationService_ResendInvitation(t *testing.T) {
	mockInvitationRepo := new(MockTenantInvitationRepository)
	mockMemberRepo := new(MockTenantMemberRepository)
	service := NewTenantInvitationService(mockInvitationRepo, mockMemberRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		invitationID := uuid.New()
		existing := &models.TenantInvitation{
			ID:        invitationID,
			Status:    "PENDING",
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		mockInvitationRepo.On("GetByID", ctx, invitationID).Return(existing, nil).Once()

		err := service.ResendInvitation(ctx, invitationID)

		assert.NoError(t, err)
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("not pending", func(t *testing.T) {
		invitationID := uuid.New()
		existing := &models.TenantInvitation{
			ID:     invitationID,
			Status: "ACCEPTED",
		}

		mockInvitationRepo.On("GetByID", ctx, invitationID).Return(existing, nil).Once()

		err := service.ResendInvitation(ctx, invitationID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "can only resend pending")
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("expired", func(t *testing.T) {
		invitationID := uuid.New()
		existing := &models.TenantInvitation{
			ID:        invitationID,
			Status:    "PENDING",
			ExpiresAt: time.Now().Add(-24 * time.Hour),
		}

		mockInvitationRepo.On("GetByID", ctx, invitationID).Return(existing, nil).Once()

		err := service.ResendInvitation(ctx, invitationID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "expired")
		mockInvitationRepo.AssertExpectations(t)
	})
}

func TestTenantInvitationService_AcceptInvitation(t *testing.T) {
	mockInvitationRepo := new(MockTenantInvitationRepository)
	mockMemberRepo := new(MockTenantMemberRepository)
	service := NewTenantInvitationService(mockInvitationRepo, mockMemberRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		token := "valid-token"
		userID := uuid.New()
		tenantID := uuid.New()
		existing := &models.TenantInvitation{
			ID:        uuid.New(),
			TenantID:  tenantID,
			Token:     token,
			Email:     "user@example.com",
			Status:    "PENDING",
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		mockInvitationRepo.On("GetByToken", ctx, token).Return(existing, nil).Once()
		mockMemberRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantMember")).Return(nil).Once()
		mockInvitationRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantInvitation")).Return(nil).Once()

		member, err := service.AcceptInvitation(ctx, token, userID)

		assert.NoError(t, err)
		assert.NotNil(t, member)
		assert.Equal(t, tenantID, member.TenantID)
		assert.Equal(t, userID, member.UserID)
		assert.Equal(t, "ACTIVE", member.Status)
		mockInvitationRepo.AssertExpectations(t)
		mockMemberRepo.AssertExpectations(t)
	})

	t.Run("not pending", func(t *testing.T) {
		token := "accepted-token"
		userID := uuid.New()
		existing := &models.TenantInvitation{
			ID:     uuid.New(),
			Token:  token,
			Status: "ACCEPTED",
		}

		mockInvitationRepo.On("GetByToken", ctx, token).Return(existing, nil).Once()

		member, err := service.AcceptInvitation(ctx, token, userID)

		assert.Error(t, err)
		assert.Nil(t, member)
		assert.Contains(t, err.Error(), "not pending")
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("expired", func(t *testing.T) {
		token := "expired-token"
		userID := uuid.New()
		existing := &models.TenantInvitation{
			ID:        uuid.New(),
			Token:     token,
			Status:    "PENDING",
			ExpiresAt: time.Now().Add(-24 * time.Hour),
		}

		mockInvitationRepo.On("GetByToken", ctx, token).Return(existing, nil).Once()
		mockInvitationRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantInvitation")).Return(nil).Once()

		member, err := service.AcceptInvitation(ctx, token, userID)

		assert.Error(t, err)
		assert.Nil(t, member)
		assert.Contains(t, err.Error(), "expired")
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("member creation error", func(t *testing.T) {
		token := "valid-token"
		userID := uuid.New()
		existing := &models.TenantInvitation{
			ID:        uuid.New(),
			TenantID:  uuid.New(),
			Token:     token,
			Status:    "PENDING",
			ExpiresAt: time.Now().Add(24 * time.Hour),
		}

		mockInvitationRepo.On("GetByToken", ctx, token).Return(existing, nil).Once()
		mockMemberRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantMember")).Return(errors.New("db error")).Once()

		member, err := service.AcceptInvitation(ctx, token, userID)

		assert.Error(t, err)
		assert.Nil(t, member)
		mockInvitationRepo.AssertExpectations(t)
		mockMemberRepo.AssertExpectations(t)
	})
}

func TestTenantInvitationService_RevokeInvitation(t *testing.T) {
	mockInvitationRepo := new(MockTenantInvitationRepository)
	mockMemberRepo := new(MockTenantMemberRepository)
	service := NewTenantInvitationService(mockInvitationRepo, mockMemberRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		invitationID := uuid.New()
		existing := &models.TenantInvitation{
			ID:     invitationID,
			Status: "PENDING",
		}

		mockInvitationRepo.On("GetByID", ctx, invitationID).Return(existing, nil).Once()
		mockInvitationRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantInvitation")).Return(nil).Once()

		err := service.RevokeInvitation(ctx, invitationID)

		assert.NoError(t, err)
		assert.Equal(t, "REVOKED", existing.Status)
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("not pending", func(t *testing.T) {
		invitationID := uuid.New()
		existing := &models.TenantInvitation{
			ID:     invitationID,
			Status: "ACCEPTED",
		}

		mockInvitationRepo.On("GetByID", ctx, invitationID).Return(existing, nil).Once()

		err := service.RevokeInvitation(ctx, invitationID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "can only revoke pending")
		mockInvitationRepo.AssertExpectations(t)
	})
}

func TestTenantInvitationService_ListByTenant(t *testing.T) {
	mockInvitationRepo := new(MockTenantInvitationRepository)
	mockMemberRepo := new(MockTenantMemberRepository)
	service := NewTenantInvitationService(mockInvitationRepo, mockMemberRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantInvitation{
			{ID: uuid.New(), Status: "PENDING"},
			{ID: uuid.New(), Status: "PENDING"},
		}

		mockInvitationRepo.On("ListByTenant", ctx, tenantID, "", 10, 0).Return(expected, int64(2), nil).Once()

		invitations, total, err := service.ListByTenant(ctx, tenantID, "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, invitations, 2)
		assert.Equal(t, int64(2), total)
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("with status filter", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantInvitation{
			{ID: uuid.New(), Status: "ACCEPTED"},
		}

		mockInvitationRepo.On("ListByTenant", ctx, tenantID, "ACCEPTED", 10, 0).Return(expected, int64(1), nil).Once()

		invitations, total, err := service.ListByTenant(ctx, tenantID, "ACCEPTED", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, invitations, 1)
		assert.Equal(t, int64(1), total)
		mockInvitationRepo.AssertExpectations(t)
	})
}

func TestTenantInvitationService_CleanupExpired(t *testing.T) {
	mockInvitationRepo := new(MockTenantInvitationRepository)
	mockMemberRepo := new(MockTenantMemberRepository)
	service := NewTenantInvitationService(mockInvitationRepo, mockMemberRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		mockInvitationRepo.On("MarkExpired", ctx).Return(nil).Once()

		err := service.CleanupExpired(ctx)

		assert.NoError(t, err)
		mockInvitationRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockInvitationRepo.On("MarkExpired", ctx).Return(errors.New("db error")).Once()

		err := service.CleanupExpired(ctx)

		assert.Error(t, err)
		mockInvitationRepo.AssertExpectations(t)
	})
}
