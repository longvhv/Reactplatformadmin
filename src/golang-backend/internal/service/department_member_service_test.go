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

// MockDepartmentMemberRepository is a mock of DepartmentMemberRepository
type MockDepartmentMemberRepository struct {
	mock.Mock
}

func (m *MockDepartmentMemberRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.DepartmentMember, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.DepartmentMember), args.Error(1)
}

func (m *MockDepartmentMemberRepository) List(ctx context.Context, page, pageSize int, tenantID, departmentID, tenantMemberID *uuid.UUID) ([]*models.DepartmentMember, int, error) {
	args := m.Called(ctx, page, pageSize, tenantID, departmentID, tenantMemberID)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.DepartmentMember), args.Int(1), args.Error(2)
}

func (m *MockDepartmentMemberRepository) ListByDepartmentID(ctx context.Context, departmentID uuid.UUID) ([]*models.DepartmentMember, error) {
	args := m.Called(ctx, departmentID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.DepartmentMember), args.Error(1)
}

func (m *MockDepartmentMemberRepository) ListByTenantMemberID(ctx context.Context, tenantMemberID uuid.UUID) ([]*models.DepartmentMember, error) {
	args := m.Called(ctx, tenantMemberID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.DepartmentMember), args.Error(1)
}

func (m *MockDepartmentMemberRepository) GetByDepartmentAndMember(ctx context.Context, departmentID, tenantMemberID uuid.UUID) (*models.DepartmentMember, error) {
	args := m.Called(ctx, departmentID, tenantMemberID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.DepartmentMember), args.Error(1)
}

func (m *MockDepartmentMemberRepository) Create(ctx context.Context, member *models.DepartmentMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func (m *MockDepartmentMemberRepository) Update(ctx context.Context, member *models.DepartmentMember) error {
	args := m.Called(ctx, member)
	return args.Error(0)
}

func (m *MockDepartmentMemberRepository) RemoveFromDepartment(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockDepartmentMemberRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockDepartmentMemberRepository) SoftDelete(ctx context.Context, id uuid.UUID, deletedBy string) error {
	args := m.Called(ctx, id, deletedBy)
	return args.Error(0)
}

func (m *MockDepartmentMemberRepository) GetActiveCount(ctx context.Context, departmentID uuid.UUID) (int, error) {
	args := m.Called(ctx, departmentID)
	return args.Int(0), args.Error(1)
}

func TestDepartmentMemberService_AddMember(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success with minimal data", func(t *testing.T) {
		req := &models.CreateDepartmentMemberRequest{
			TenantID:       uuid.New(),
			DepartmentID:   uuid.New(),
			TenantMemberID: uuid.New(),
			IsPrimary:      false,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.DepartmentMember")).Return(nil).Once()

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
		req := &models.CreateDepartmentMemberRequest{
			TenantID:         uuid.New(),
			DepartmentID:     uuid.New(),
			TenantMemberID:   uuid.New(),
			IsPrimary:        true,
			RoleInDepartment: "Manager",
			CreatedBy:        &createdBy,
			Metadata: map[string]interface{}{
				"team":     "engineering",
				"location": "HQ",
			},
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.DepartmentMember")).Return(nil).Once()

		member, err := service.AddMember(ctx, req)

		assert.NoError(t, err)
		assert.True(t, member.IsPrimary)
		assert.True(t, member.RoleInDepartment.Valid)
		assert.Equal(t, "Manager", member.RoleInDepartment.String)
		assert.True(t, member.CreatedBy.Valid)
		assert.NotNil(t, member.Metadata)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateDepartmentMemberRequest{
			TenantID:       uuid.New(),
			DepartmentID:   uuid.New(),
			TenantMemberID: uuid.New(),
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.DepartmentMember")).Return(errors.New("db error")).Once()

		member, err := service.AddMember(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentMemberService_GetMember(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()
		expected := &models.DepartmentMember{
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

func TestDepartmentMemberService_ListMembers(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success - no filters", func(t *testing.T) {
		expected := []*models.DepartmentMember{
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

	t.Run("success - with department filter", func(t *testing.T) {
		departmentID := uuid.New()
		expected := []*models.DepartmentMember{
			{ID: uuid.New(), DepartmentID: departmentID},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), &departmentID, (*uuid.UUID)(nil)).
			Return(expected, 1, nil).Once()

		members, total, err := service.ListMembers(ctx, 1, 10, nil, &departmentID, nil)

		assert.NoError(t, err)
		assert.Len(t, members, 1)
		assert.Equal(t, 1, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("auto-correct page and page size", func(t *testing.T) {
		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*uuid.UUID)(nil)).
			Return([]*models.DepartmentMember{}, 0, nil).Once()

		_, _, err := service.ListMembers(ctx, 0, 200, nil, nil, nil)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentMemberService_ListMembersByDepartment(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		departmentID := uuid.New()
		expected := []*models.DepartmentMember{
			{ID: uuid.New(), DepartmentID: departmentID},
			{ID: uuid.New(), DepartmentID: departmentID},
		}

		mockRepo.On("ListByDepartmentID", ctx, departmentID).Return(expected, nil).Once()

		members, err := service.ListMembersByDepartment(ctx, departmentID)

		assert.NoError(t, err)
		assert.Len(t, members, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentMemberService_ListMembersByTenantMember(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantMemberID := uuid.New()
		expected := []*models.DepartmentMember{
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

func TestDepartmentMemberService_GetByDepartmentAndMember(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		departmentID := uuid.New()
		tenantMemberID := uuid.New()
		expected := &models.DepartmentMember{
			ID:             uuid.New(),
			DepartmentID:   departmentID,
			TenantMemberID: tenantMemberID,
		}

		mockRepo.On("GetByDepartmentAndMember", ctx, departmentID, tenantMemberID).Return(expected, nil).Once()

		member, err := service.GetByDepartmentAndMember(ctx, departmentID, tenantMemberID)

		assert.NoError(t, err)
		assert.NotNil(t, member)
		assert.Equal(t, departmentID, member.DepartmentID)
		assert.Equal(t, tenantMemberID, member.TenantMemberID)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentMemberService_UpdateMember(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()
		existing := &models.DepartmentMember{
			ID:        memberID,
			IsPrimary: false,
		}

		isPrimary := true
		role := "Lead"
		updatedBy := uuid.New()
		metadata := map[string]interface{}{"updated": true}
		req := &models.UpdateDepartmentMemberRequest{
			IsPrimary:        &isPrimary,
			RoleInDepartment: &role,
			UpdatedBy:        &updatedBy,
			Metadata:         &metadata,
		}

		mockRepo.On("GetByID", ctx, memberID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.DepartmentMember")).Return(nil).Once()

		member, err := service.UpdateMember(ctx, memberID, req)

		assert.NoError(t, err)
		assert.True(t, member.IsPrimary)
		assert.True(t, member.RoleInDepartment.Valid)
		assert.Equal(t, "Lead", member.RoleInDepartment.String)
		assert.True(t, member.UpdatedBy.Valid)
		mockRepo.AssertExpectations(t)
	})

	t.Run("clear role", func(t *testing.T) {
		memberID := uuid.New()
		existing := &models.DepartmentMember{
			ID: memberID,
			RoleInDepartment: models.NullString{
				String: "Manager",
				Valid:  true,
			},
		}

		emptyRole := ""
		req := &models.UpdateDepartmentMemberRequest{
			RoleInDepartment: &emptyRole,
		}

		mockRepo.On("GetByID", ctx, memberID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.DepartmentMember")).Return(nil).Once()

		member, err := service.UpdateMember(ctx, memberID, req)

		assert.NoError(t, err)
		assert.False(t, member.RoleInDepartment.Valid)
		mockRepo.AssertExpectations(t)
	})

	t.Run("member not found", func(t *testing.T) {
		memberID := uuid.New()
		req := &models.UpdateDepartmentMemberRequest{}

		mockRepo.On("GetByID", ctx, memberID).Return(nil, errors.New("not found")).Once()

		member, err := service.UpdateMember(ctx, memberID, req)

		assert.Error(t, err)
		assert.Nil(t, member)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentMemberService_RemoveMember(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()

		mockRepo.On("RemoveFromDepartment", ctx, memberID).Return(nil).Once()

		err := service.RemoveMember(ctx, memberID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentMemberService_DeleteMember(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		memberID := uuid.New()

		mockRepo.On("Delete", ctx, memberID).Return(nil).Once()

		err := service.DeleteMember(ctx, memberID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestDepartmentMemberService_SoftDeleteMember(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
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

func TestDepartmentMemberService_GetActiveCount(t *testing.T) {
	mockRepo := new(MockDepartmentMemberRepository)
	service := NewDepartmentMemberService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		departmentID := uuid.New()

		mockRepo.On("GetActiveCount", ctx, departmentID).Return(15, nil).Once()

		count, err := service.GetActiveCount(ctx, departmentID)

		assert.NoError(t, err)
		assert.Equal(t, 15, count)
		mockRepo.AssertExpectations(t)
	})
}
