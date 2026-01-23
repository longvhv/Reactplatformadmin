package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang-backend/internal/models"
)

// MockGroupMemberRepository is a mock of GroupMemberRepository
type MockGroupMemberRepository struct {
	mock.Mock
}

func (m *MockGroupMemberRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.GroupMember, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.GroupMember), args.Error(1)
}

func (m *MockGroupMemberRepository) List(ctx context.Context, page, pageSize int, tenantID, userGroupID, tenantMemberID *uuid.UUID) ([]*models.GroupMember, int, error) {
	args := m.Called(ctx, page, pageSize, tenantID, userGroupID, tenantMemberID)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.GroupMember), args.Int(1), args.Error(2)
}

func (m *MockGroupMemberRepository) ListByUserGroupID(ctx context.Context, userGroupID uuid.UUID) ([]*models.GroupMember, error) {
	args := m.Called(ctx, userGroupID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.GroupMember), args.Error(1)
}

func (m *MockGroupMemberRepository) ListByTenantMemberID(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.GroupMember, error) {
	args := m.Called(ctx, tenantMemberID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.GroupMember), args.Error(1)
}

func (m *MockGroupMemberRepository) GetByGroupAndMember(ctx context.Context, userGroupID, tenantMemberID uuid.UUID) (*models.GroupMember, error) {
	args := m.Called(ctx, userGroupID, tenantMemberID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.GroupMember), args.Error(1)
}

func (m *MockGroupMemberRepository) Create(ctx context.Context, member *models.GroupMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func (m *MockGroupMemberRepository) Update(ctx context.Context, member *models.GroupMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func (m *MockGroupMemberRepository) RemoveFromGroup(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockGroupMemberRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockGroupMemberRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error {
	args := m.Called(ctx, id, deletedBy)
	return args.Error(0)
}

func (m *MockGroupMemberRepository) GetActiveCount(ctx context.Context, userGroupID uuid.UUID) (int, error) {
	args := m.Called(ctx, userGroupID)
	return args.Int(0), args.Error(1)
}

func TestGroupMemberService_AddMember(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success with minimal data", func(t *testing.T) {
		req := &models.CreateGroupMemberRequest{
			TenantID:       uuid.New(),
			UserGroupID:    uuid.New(),
			TenantMemberID: uuid.New(),
			IsPrimary:      false,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.GroupMember")).Return(nil).Once()

		member, err := service.AddMember(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, member)
		assert.False(t, member.IsPrimary)
		assert.True(t, member.JoinedAt.Valid)
		assert.Equal(t, 1, member.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full data", func(t *testing.T) {
		createdBy := uuid.New()
		req := &models.CreateGroupMemberRequest{
			TenantID:       uuid.New(),
			UserGroupID:    uuid.New(),
			TenantMemberID: uuid.New(),
			IsPrimary:      true,
			RoleInGroup:    "Admin",
			CreatedBy:      &createdBy,
			Metadata: map[string]interface{}{
				"team":    "sales",
				"region":  "west",
			},
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.GroupMember")).Return(nil).Once()

		member, err := service.AddMember(ctx, req)

		assert.NoError(t, err)
		assert.True(t, member.IsPrimary)
		assert.True(t, member.RoleInGroup.Valid)
		assert.Equal(t, "Admin", member.RoleInGroup.String)
		assert.True(t, member.CreatedBy.Valid)
		assert.NotNil(t, member.Metadata)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateGroupMemberRequest{
			TenantID:       uuid.New(),
			UserGroupID:    uuid.New(),
			TenantMemberID: uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.GroupMember")).Return(errors.New("db error")).Once()

		member, err := service.AddMember(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_GetMember(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()
		expected := &models.GroupMember{
			ID: memberID,
		}

		mockRepo.On("GetByID", ctx, memberID).Return(expected, nil).Once()

		member, err := service.GetMember(ctx, memberID)

		assert.NoError(t, err)
		assert.NotNil(t, member)
		assert.Equal(t, memberID, member.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		memberID := uuid.New()
		mockRepo.On("GetByID", ctx, memberID).Return(nil, errors.New("not found")).Once()

		member, err := service.GetMember(ctx, memberID)

		assert.Error(t, err)
		assert.Nil(t, member)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_ListMembers(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success - no filters", func(t *testing.T) {
		expected := []*models.GroupMember{
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*uuid.UUID)(nil)).
			Return(expected, 2, nil).Once()

		members, total, err := service.ListMembers(ctx, 1, 10, nil, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, members, 2)
		assert.Equal(t, 2, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with group filter", func(t *testing.T) {
		groupID := uuid.New()
		expected := []*models.GroupMember{
			{ID: uuid.New(), UserGroupID: groupID},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), &groupID, (*uuid.UUID)(nil)).
			Return(expected, 1, nil).Once()

		members, total, err := service.ListMembers(ctx, 1, 10, nil, &groupID, nil)

		assert.NoError(t, err)
		assert.Len(t, members, 1)
		assert.Equal(t, 1, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("auto-correct page and page size", func(t *testing.T) {
		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*uuid.UUID)(nil)).
			Return([]*models.GroupMember{}, 0, nil).Once()

		_, _, err := service.ListMembers(ctx, 0, 200, nil, nil, nil)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_ListMembersByGroup(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		groupID := uuid.New()
		expected := []*models.GroupMember{
			{ID: uuid.New(), UserGroupID: groupID},
			{ID: uuid.New(), UserGroupID: groupID},
		}

		mockRepo.On("ListByUserGroupID", ctx, groupID).Return(expected, nil).Once()

		members, err := service.ListMembersByGroup(ctx, groupID)

		assert.NoError(t, err)
		assert.Len(t, members, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_ListMembersByTenantMember(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantMemberID := uuid.New()
		expected := []*models.GroupMember{
			{ID: uuid.New(), TenantMemberID: tenantMemberID},
			{ID: uuid.New(), TenantMemberID: tenantMemberID},
		}

		mockRepo.On("ListByTenantMemberID", ctx, tenantMemberID).Return(expected, nil).Once()

		members, err := service.ListMembersByTenantMember(ctx, tenantMemberID)

		assert.NoError(t, err)
		assert.Len(t, members, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_GetByGroupAndMember(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		groupID := uuid.New()
		tenantMemberID := uuid.New()
		expected := &models.GroupMember{
			ID:             uuid.New(),
			UserGroupID:    groupID,
			TenantMemberID: tenantMemberID,
		}

		mockRepo.On("GetByGroupAndMember", ctx, groupID, tenantMemberID).Return(expected, nil).Once()

		member, err := service.GetByGroupAndMember(ctx, groupID, tenantMemberID)

		assert.NoError(t, err)
		assert.NotNil(t, member)
		assert.Equal(t, groupID, member.UserGroupID)
		assert.Equal(t, tenantMemberID, member.TenantMemberID)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_UpdateMember(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()
		existing := &models.GroupMember{
			ID:        memberID,
			IsPrimary: false,
		}

		isPrimary := true
		role := "Moderator"
		updatedBy := uuid.New()
		metadata := map[string]interface{}{"updated": true}
		req := &models.UpdateGroupMemberRequest{
			IsPrimary:   &isPrimary,
			RoleInGroup: &role,
			UpdatedBy:   &updatedBy,
			Metadata:    &metadata,
		}

		mockRepo.On("GetByID", ctx, memberID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.GroupMember")).Return(nil).Once()

		member, err := service.UpdateMember(ctx, memberID, req)

		assert.NoError(t, err)
		assert.True(t, member.IsPrimary)
		assert.True(t, member.RoleInGroup.Valid)
		assert.Equal(t, "Moderator", member.RoleInGroup.String)
		assert.True(t, member.UpdatedBy.Valid)
		mockRepo.AssertExpectations(t)
	})

	t.Run("clear role", func(t *testing.T) {
		memberID := uuid.New()
		existing := &models.GroupMember{
			ID: memberID,
			RoleInGroup: models.NullString{
				String: "Admin",
				Valid:  true,
			},
		}

		emptyRole := ""
		req := &models.UpdateGroupMemberRequest{
			RoleInGroup: &emptyRole,
		}

		mockRepo.On("GetByID", ctx, memberID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.GroupMember")).Return(nil).Once()

		member, err := service.UpdateMember(ctx, memberID, req)

		assert.NoError(t, err)
		assert.False(t, member.RoleInGroup.Valid)
		mockRepo.AssertExpectations(t)
	})

	t.Run("member not found", func(t *testing.T) {
		memberID := uuid.New()
		req := &models.UpdateGroupMemberRequest{}

		mockRepo.On("GetByID", ctx, memberID).Return(nil, errors.New("not found")).Once()

		member, err := service.UpdateMember(ctx, memberID, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_RemoveMember(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()

		mockRepo.On("RemoveFromGroup", ctx, memberID).Return(nil).Once()

		err := service.RemoveMember(ctx, memberID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_DeleteMember(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()

		mockRepo.On("Delete", ctx, memberID).Return(nil).Once()

		err := service.DeleteMember(ctx, memberID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_SoftDeleteMember(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()
		deletedBy := "admin-user"

		mockRepo.On("SoftDelete", ctx, memberID, deletedBy).Return(nil).Once()

		err := service.SoftDeleteMember(ctx, memberID, deletedBy)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestGroupMemberService_GetActiveCount(t *testing.T) {
	mockRepo := new(MockGroupMemberRepository)
	service := NewGroupMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		groupID := uuid.New()

		mockRepo.On("GetActiveCount", ctx, groupID).Return(25, nil).Once()

		count, err := service.GetActiveCount(ctx, groupID)

		assert.NoError(t, err)
		assert.Equal(t, 25, count)
		mockRepo.AssertExpectations(t)
	})
}
