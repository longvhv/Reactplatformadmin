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

// MockUserGroupRepository is a mock of UserGroupRepository
type MockUserGroupRepository struct {
	mock.Mock
}

func (m *MockUserGroupRepository) Create(ctx context.Context, group *models.UserGroup) error {
	args := m.Called(ctx, group)
	return args.Error(0)
}

func (m *MockUserGroupRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserGroup, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserGroup), args.Error(1)
}

func (m *MockUserGroupRepository) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.UserGroup, error) {
	args := m.Called(ctx, tenantID, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserGroup), args.Error(1)
}

func (m *MockUserGroupRepository) Update(ctx context.Context, group *models.UserGroup) error {
	args := m.Called(ctx, group)
	return args.Error(0)
}

func (m *MockUserGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserGroupRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, status, groupType string, limit, offset int) ([]*models.UserGroup, int64, error) {
	args := m.Called(ctx, tenantID, status, groupType, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.UserGroup), args.Get(1).(int64), args.Error(2)
}

// MockGroupMemberRepository is a mock of GroupMemberRepository
type MockGroupMemberRepository struct {
	mock.Mock
}

func (m *MockGroupMemberRepository) Create(ctx context.Context, member *models.GroupMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func (m *MockGroupMemberRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestUserGroupService_CreateGroup(t *testing.T) {
	mockGroupRepo := new(MockUserGroupRepository)
	mockMemberRepo := new(MockGroupMemberRepository)
	service := NewUserGroupService(mockGroupRepo, mockMemberRepo)

	ctx := context.Background()
	tenantID := uuid.New()
	createdBy := uuid.New()
	code := "TEAM001"
	name := "Development Team"

	t.Run("success", func(t *testing.T) {
		description := "Main development team"
		groupType := "TEAM"

		mockGroupRepo.On("GetByCode", ctx, tenantID, code).Return(nil, errors.New("not found")).Once()
		mockGroupRepo.On("Create", ctx, mock.AnythingOfType("*models.UserGroup")).Return(nil).Once()

		req := CreateUserGroupRequest{
			TenantID:    tenantID,
			Code:        code,
			Name:        name,
			Description: &description,
			GroupType:   &groupType,
			Status:      "ACTIVE",
			Order:       1,
			CreatedBy:   createdBy,
		}

		group, err := service.CreateGroup(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, group)
		assert.Equal(t, code, group.Code)
		assert.Equal(t, name, group.Name)
		assert.Equal(t, "ACTIVE", group.Status)
		assert.Equal(t, 1, group.Version)
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("success - default status", func(t *testing.T) {
		mockGroupRepo.On("GetByCode", ctx, tenantID, code).Return(nil, errors.New("not found")).Once()
		mockGroupRepo.On("Create", ctx, mock.AnythingOfType("*models.UserGroup")).Return(nil).Once()

		req := CreateUserGroupRequest{
			TenantID:  tenantID,
			Code:      code,
			Name:      name,
			Status:    "", // Should default to ACTIVE
			CreatedBy: createdBy,
		}

		group, err := service.CreateGroup(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, group)
		assert.Equal(t, "ACTIVE", group.Status)
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("code already exists", func(t *testing.T) {
		existingGroup := &models.UserGroup{
			ID:       uuid.New(),
			TenantID: tenantID,
			Code:     code,
			Name:     "Existing Group",
		}

		mockGroupRepo.On("GetByCode", ctx, tenantID, code).Return(existingGroup, nil).Once()

		req := CreateUserGroupRequest{
			TenantID:  tenantID,
			Code:      code,
			Name:      name,
			CreatedBy: createdBy,
		}

		group, err := service.CreateGroup(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, group)
		assert.Contains(t, err.Error(), "already exists")
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		mockGroupRepo.On("GetByCode", ctx, tenantID, code).Return(nil, errors.New("not found")).Once()
		mockGroupRepo.On("Create", ctx, mock.AnythingOfType("*models.UserGroup")).Return(errors.New("db error")).Once()

		req := CreateUserGroupRequest{
			TenantID:  tenantID,
			Code:      code,
			Name:      name,
			CreatedBy: createdBy,
		}

		group, err := service.CreateGroup(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, group)
		assert.Contains(t, err.Error(), "failed to create group")
		mockGroupRepo.AssertExpectations(t)
	})
}

func TestUserGroupService_GetByID(t *testing.T) {
	mockGroupRepo := new(MockUserGroupRepository)
	mockMemberRepo := new(MockGroupMemberRepository)
	service := NewUserGroupService(mockGroupRepo, mockMemberRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		expectedGroup := &models.UserGroup{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "TEAM001",
			Name:     "Development Team",
			Status:   "ACTIVE",
			Version:  1,
		}

		mockGroupRepo.On("GetByID", ctx, id).Return(expectedGroup, nil).Once()

		group, err := service.GetByID(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, group)
		assert.Equal(t, id, group.ID)
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockGroupRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		group, err := service.GetByID(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, group)
		mockGroupRepo.AssertExpectations(t)
	})
}

func TestUserGroupService_GetByCode(t *testing.T) {
	mockGroupRepo := new(MockUserGroupRepository)
	mockMemberRepo := new(MockGroupMemberRepository)
	service := NewUserGroupService(mockGroupRepo, mockMemberRepo)

	ctx := context.Background()
	tenantID := uuid.New()
	code := "TEAM001"

	t.Run("success", func(t *testing.T) {
		expectedGroup := &models.UserGroup{
			ID:       uuid.New(),
			TenantID: tenantID,
			Code:     code,
			Name:     "Development Team",
			Status:   "ACTIVE",
		}

		mockGroupRepo.On("GetByCode", ctx, tenantID, code).Return(expectedGroup, nil).Once()

		group, err := service.GetByCode(ctx, tenantID, code)

		assert.NoError(t, err)
		assert.NotNil(t, group)
		assert.Equal(t, code, group.Code)
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockGroupRepo.On("GetByCode", ctx, tenantID, code).Return(nil, errors.New("not found")).Once()

		group, err := service.GetByCode(ctx, tenantID, code)

		assert.Error(t, err)
		assert.Nil(t, group)
		mockGroupRepo.AssertExpectations(t)
	})
}

func TestUserGroupService_ListByTenant(t *testing.T) {
	mockGroupRepo := new(MockUserGroupRepository)
	mockMemberRepo := new(MockGroupMemberRepository)
	service := NewUserGroupService(mockGroupRepo, mockMemberRepo)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success - all groups", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0
		status := ""
		groupType := ""

		expectedGroups := []*models.UserGroup{
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "TEAM001",
				Name:     "Dev Team",
				Status:   "ACTIVE",
			},
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "TEAM002",
				Name:     "QA Team",
				Status:   "ACTIVE",
			},
		}

		mockGroupRepo.On("ListByTenant", ctx, tenantID, status, groupType, limit, offset).Return(expectedGroups, int64(2), nil).Once()

		groups, total, err := service.ListByTenant(ctx, tenantID, status, groupType, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, groups)
		assert.Len(t, groups, 2)
		assert.Equal(t, int64(2), total)
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("success - filtered by status", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0
		status := "ACTIVE"
		groupType := ""

		expectedGroups := []*models.UserGroup{
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "TEAM001",
				Name:     "Dev Team",
				Status:   "ACTIVE",
			},
		}

		mockGroupRepo.On("ListByTenant", ctx, tenantID, status, groupType, limit, offset).Return(expectedGroups, int64(1), nil).Once()

		groups, total, err := service.ListByTenant(ctx, tenantID, status, groupType, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, groups)
		assert.Len(t, groups, 1)
		assert.Equal(t, int64(1), total)
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 10
		offset := 0
		status := ""
		groupType := ""

		mockGroupRepo.On("ListByTenant", ctx, tenantID, status, groupType, limit, offset).Return(nil, int64(0), errors.New("db error")).Once()

		groups, total, err := service.ListByTenant(ctx, tenantID, status, groupType, page, limit)

		assert.Error(t, err)
		assert.Nil(t, groups)
		assert.Equal(t, int64(0), total)
		mockGroupRepo.AssertExpectations(t)
	})
}

func TestUserGroupService_UpdateGroup(t *testing.T) {
	mockGroupRepo := new(MockUserGroupRepository)
	mockMemberRepo := new(MockGroupMemberRepository)
	service := NewUserGroupService(mockGroupRepo, mockMemberRepo)

	ctx := context.Background()
	id := uuid.New()
	updatedBy := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingGroup := &models.UserGroup{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "TEAM001",
			Name:     "Old Name",
			Status:   "ACTIVE",
			Version:  1,
		}

		newName := "New Team Name"
		newStatus := "INACTIVE"

		mockGroupRepo.On("GetByID", ctx, id).Return(existingGroup, nil).Once()
		mockGroupRepo.On("Update", ctx, mock.AnythingOfType("*models.UserGroup")).Return(nil).Once()

		req := UpdateUserGroupRequest{
			Name:      &newName,
			Status:    &newStatus,
			UpdatedBy: updatedBy,
		}

		group, err := service.UpdateGroup(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, group)
		assert.Equal(t, newName, group.Name)
		assert.Equal(t, newStatus, group.Status)
		assert.Equal(t, 2, group.Version)
		assert.Equal(t, &updatedBy, group.UpdatedBy)
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("group not found", func(t *testing.T) {
		mockGroupRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newName := "New Name"
		req := UpdateUserGroupRequest{
			Name:      &newName,
			UpdatedBy: updatedBy,
		}

		group, err := service.UpdateGroup(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, group)
		assert.Contains(t, err.Error(), "not found")
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		existingGroup := &models.UserGroup{
			ID:      id,
			Code:    "TEAM001",
			Name:    "Old Name",
			Version: 1,
		}

		newName := "New Name"

		mockGroupRepo.On("GetByID", ctx, id).Return(existingGroup, nil).Once()
		mockGroupRepo.On("Update", ctx, mock.AnythingOfType("*models.UserGroup")).Return(errors.New("db error")).Once()

		req := UpdateUserGroupRequest{
			Name:      &newName,
			UpdatedBy: updatedBy,
		}

		group, err := service.UpdateGroup(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, group)
		assert.Contains(t, err.Error(), "failed to update group")
		mockGroupRepo.AssertExpectations(t)
	})

	t.Run("update all fields", func(t *testing.T) {
		existingGroup := &models.UserGroup{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "TEAM001",
			Name:     "Old Name",
			Status:   "ACTIVE",
			Order:    1,
			Version:  1,
		}

		newName := "New Name"
		newDesc := "New Description"
		newGroupType := "DEPARTMENT"
		newStatus := "INACTIVE"
		newOrder := 5

		mockGroupRepo.On("GetByID", ctx, id).Return(existingGroup, nil).Once()
		mockGroupRepo.On("Update", ctx, mock.AnythingOfType("*models.UserGroup")).Return(nil).Once()

		req := UpdateUserGroupRequest{
			Name:        &newName,
			Description: &newDesc,
			GroupType:   &newGroupType,
			Status:      &newStatus,
			Order:       &newOrder,
			UpdatedBy:   updatedBy,
		}

		group, err := service.UpdateGroup(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, group)
		assert.Equal(t, newName, group.Name)
		assert.Equal(t, &newDesc, group.Description)
		assert.Equal(t, &newGroupType, group.GroupType)
		assert.Equal(t, newStatus, group.Status)
		assert.Equal(t, newOrder, group.Order)
		mockGroupRepo.AssertExpectations(t)
	})
}
