package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockTenantRepository is a mock of TenantRepository
type MockTenantRepository struct {
	mock.Mock
}

func (m *MockTenantRepository) Create(ctx context.Context, tenant *models.Tenant) error {
	args := m.Called(ctx, tenant)
	return args.Error(0)
}

func (m *MockTenantRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockTenantRepository) GetByCode(ctx context.Context, code string) (*models.Tenant, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockTenantRepository) Update(ctx context.Context, tenant *models.Tenant) error {
	args := m.Called(ctx, tenant)
	return args.Error(0)
}

func (m *MockTenantRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockTenantRepository) List(ctx context.Context, page, limit int) ([]*models.Tenant, int64, error) {
	args := m.Called(ctx, page, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Tenant), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantRepository) ExistsByCode(ctx context.Context, code string) (bool, error) {
	args := m.Called(ctx, code)
	return args.Bool(0), args.Error(1)
}

func TestTenantService_CreateTenant(t *testing.T) {
	mockRepo := new(MockTenantRepository)
	mockSlugRepo := new(MockReservedSlugRepository)
	
	service := &TenantService{
		tenantRepo:       mockRepo,
		reservedSlugRepo: mockSlugRepo,
	}

	ctx := context.Background()

	t.Run("success - create tenant with valid code", func(t *testing.T) {
		code := "test-tenant"
		name := "Test Tenant"

		mockSlugRepo.On("IsReserved", ctx, code).Return(false, nil).Once()
		mockRepo.On("ExistsByCode", ctx, code).Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Tenant")).Return(nil).Once()

		req := CreateTenantRequest{
			Code: code,
			Name: name,
		}

		tenant, err := service.CreateTenant(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, tenant)
		assert.Equal(t, code, tenant.Code)
		assert.Equal(t, name, tenant.Name)
		assert.Equal(t, "FREE", tenant.Tier)
		assert.Equal(t, "TRIAL", tenant.Status)
		mockRepo.AssertExpectations(t)
		mockSlugRepo.AssertExpectations(t)
	})

	t.Run("error - reserved code", func(t *testing.T) {
		code := "admin"

		mockSlugRepo.On("IsReserved", ctx, code).Return(true, nil).Once()

		req := CreateTenantRequest{
			Code: code,
			Name: "Admin Tenant",
		}

		tenant, err := service.CreateTenant(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, tenant)
		assert.Contains(t, err.Error(), "reserved")
		mockSlugRepo.AssertExpectations(t)
	})

	t.Run("error - code already exists", func(t *testing.T) {
		code := "existing-tenant"

		mockSlugRepo.On("IsReserved", ctx, code).Return(false, nil).Once()
		mockRepo.On("ExistsByCode", ctx, code).Return(true, nil).Once()

		req := CreateTenantRequest{
			Code: code,
			Name: "Existing Tenant",
		}

		tenant, err := service.CreateTenant(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, tenant)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
		mockSlugRepo.AssertExpectations(t)
	})
}

func TestTenantService_GetTenantByID(t *testing.T) {
	mockRepo := new(MockTenantRepository)
	service := &TenantService{
		tenantRepo: mockRepo,
	}

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		expectedTenant := &models.Tenant{
			ID:     tenantID,
			Code:   "test-tenant",
			Name:   "Test Tenant",
			Tier:   "FREE",
			Status: "ACTIVE",
		}

		mockRepo.On("GetByID", ctx, tenantID).Return(expectedTenant, nil).Once()

		tenant, err := service.GetTenantByID(ctx, tenantID)

		assert.NoError(t, err)
		assert.NotNil(t, tenant)
		assert.Equal(t, tenantID, tenant.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByID", ctx, tenantID).Return(nil, ErrNotFound).Once()

		tenant, err := service.GetTenantByID(ctx, tenantID)

		assert.Error(t, err)
		assert.Nil(t, tenant)
		mockRepo.AssertExpectations(t)
	})
}

// MockReservedSlugRepository is a mock
type MockReservedSlugRepository struct {
	mock.Mock
}

func (m *MockReservedSlugRepository) IsReserved(ctx context.Context, slug string) (bool, error) {
	args := m.Called(ctx, slug)
	return args.Bool(0), args.Error(1)
}

func (m *MockReservedSlugRepository) Create(ctx context.Context, slug *models.ReservedSlug) error {
	args := m.Called(ctx, slug)
	return args.Error(0)
}

func (m *MockReservedSlugRepository) GetBySlug(ctx context.Context, slug string) (*models.ReservedSlug, error) {
	args := m.Called(ctx, slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.ReservedSlug), args.Error(1)
}
