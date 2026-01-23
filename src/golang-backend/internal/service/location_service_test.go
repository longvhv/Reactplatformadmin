package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

// MockLocationRepository is a mock of LocationRepository
type MockLocationRepository struct {
	mock.Mock
}

func (m *MockLocationRepository) Create(ctx context.Context, location *models.Location) error {
	args := m.Called(ctx, location)
	return args.Error(0)
}

func (m *MockLocationRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Location, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Location), args.Error(1)
}

func (m *MockLocationRepository) GetByCode(ctx context.Context, tenantID uuid.UUID, code string) (*models.Location, error) {
	args := m.Called(ctx, tenantID, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Location), args.Error(1)
}

func (m *MockLocationRepository) Update(ctx context.Context, location *models.Location) error {
	args := m.Called(ctx, location)
	return args.Error(0)
}

func (m *MockLocationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockLocationRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, page, limit int) ([]*models.Location, int64, error) {
	args := m.Called(ctx, tenantID, page, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Location), args.Get(1).(int64), args.Error(2)
}

func (m *MockLocationRepository) ListByType(ctx context.Context, tenantID, typeID uuid.UUID, page, limit int) ([]*models.Location, int64, error) {
	args := m.Called(ctx, tenantID, typeID, page, limit)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Location), args.Get(1).(int64), args.Error(2)
}

func (m *MockLocationRepository) ExistsByCode(ctx context.Context, tenantID uuid.UUID, code string) (bool, error) {
	args := m.Called(ctx, tenantID, code)
	return args.Bool(0), args.Error(1)
}

// MockTenantRepository is a mock of TenantRepository
type MockTenantRepository struct {
	mock.Mock
}

func (m *MockTenantRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Tenant, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockTenantRepository) Create(ctx context.Context, tenant *models.Tenant) error {
	args := m.Called(ctx, tenant)
	return args.Error(0)
}

func (m *MockTenantRepository) Update(ctx context.Context, tenant *models.Tenant) error {
	args := m.Called(ctx, tenant)
	return args.Error(0)
}

func (m *MockTenantRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestLocationService_CreateLocation(t *testing.T) {
	mockLocationRepo := new(MockLocationRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewLocationService(mockLocationRepo, mockTenantRepo)

	ctx := context.Background()
	tenantID := uuid.New()
	typeID := uuid.New()
	code := "LOC001"
	name := "Headquarters"

	t.Run("success", func(t *testing.T) {
		tenant := &models.Tenant{ID: tenantID}
		timezone := "Asia/Ho_Chi_Minh"
		isHQ := true

		mockTenantRepo.On("GetByID", ctx, tenantID).Return(tenant, nil).Once()
		mockLocationRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, nil).Once()
		mockLocationRepo.On("Create", ctx, mock.AnythingOfType("*models.Location")).Return(nil).Once()

		req := CreateLocationRequest{
			TenantID:      tenantID,
			Code:          code,
			Name:          name,
			TypeID:        typeID,
			Timezone:      &timezone,
			IsHeadquarter: &isHQ,
		}

		location, err := service.CreateLocation(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, location)
		assert.Equal(t, code, location.Code)
		assert.Equal(t, name, location.Name)
		assert.Equal(t, tenantID, location.TenantID)
		assert.Equal(t, typeID, location.TypeID)
		assert.Equal(t, timezone, location.Timezone)
		assert.True(t, location.IsHeadquarter)
		mockTenantRepo.AssertExpectations(t)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("tenant not found", func(t *testing.T) {
		mockTenantRepo.On("GetByID", ctx, tenantID).Return(nil, errors.New("not found")).Once()

		req := CreateLocationRequest{
			TenantID: tenantID,
			Code:     code,
			Name:     name,
			TypeID:   typeID,
		}

		location, err := service.CreateLocation(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, location)
		assert.Contains(t, err.Error(), "tenant not found")
		mockTenantRepo.AssertExpectations(t)
	})

	t.Run("code already exists", func(t *testing.T) {
		tenant := &models.Tenant{ID: tenantID}

		mockTenantRepo.On("GetByID", ctx, tenantID).Return(tenant, nil).Once()
		mockLocationRepo.On("ExistsByCode", ctx, tenantID, code).Return(true, nil).Once()

		req := CreateLocationRequest{
			TenantID: tenantID,
			Code:     code,
			Name:     name,
			TypeID:   typeID,
		}

		location, err := service.CreateLocation(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, location)
		assert.Contains(t, err.Error(), "already exists")
		mockTenantRepo.AssertExpectations(t)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("repository error on exists check", func(t *testing.T) {
		tenant := &models.Tenant{ID: tenantID}

		mockTenantRepo.On("GetByID", ctx, tenantID).Return(tenant, nil).Once()
		mockLocationRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, errors.New("db error")).Once()

		req := CreateLocationRequest{
			TenantID: tenantID,
			Code:     code,
			Name:     name,
			TypeID:   typeID,
		}

		location, err := service.CreateLocation(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, location)
		mockTenantRepo.AssertExpectations(t)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("repository error on create", func(t *testing.T) {
		tenant := &models.Tenant{ID: tenantID}

		mockTenantRepo.On("GetByID", ctx, tenantID).Return(tenant, nil).Once()
		mockLocationRepo.On("ExistsByCode", ctx, tenantID, code).Return(false, nil).Once()
		mockLocationRepo.On("Create", ctx, mock.AnythingOfType("*models.Location")).Return(errors.New("db error")).Once()

		req := CreateLocationRequest{
			TenantID: tenantID,
			Code:     code,
			Name:     name,
			TypeID:   typeID,
		}

		location, err := service.CreateLocation(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, location)
		assert.Contains(t, err.Error(), "failed to create location")
		mockTenantRepo.AssertExpectations(t)
		mockLocationRepo.AssertExpectations(t)
	})
}

func TestLocationService_GetLocation(t *testing.T) {
	mockLocationRepo := new(MockLocationRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewLocationService(mockLocationRepo, mockTenantRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		expectedLocation := &models.Location{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "LOC001",
			Name:     "Headquarters",
			TypeID:   uuid.New(),
		}

		mockLocationRepo.On("GetByID", ctx, id).Return(expectedLocation, nil).Once()

		location, err := service.GetLocation(ctx, id)

		assert.NoError(t, err)
		assert.NotNil(t, location)
		assert.Equal(t, id, location.ID)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockLocationRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		location, err := service.GetLocation(ctx, id)

		assert.Error(t, err)
		assert.Nil(t, location)
		mockLocationRepo.AssertExpectations(t)
	})
}

func TestLocationService_GetLocationByCode(t *testing.T) {
	mockLocationRepo := new(MockLocationRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewLocationService(mockLocationRepo, mockTenantRepo)

	ctx := context.Background()
	tenantID := uuid.New()
	code := "LOC001"

	t.Run("success", func(t *testing.T) {
		expectedLocation := &models.Location{
			ID:       uuid.New(),
			TenantID: tenantID,
			Code:     code,
			Name:     "Headquarters",
			TypeID:   uuid.New(),
		}

		mockLocationRepo.On("GetByCode", ctx, tenantID, code).Return(expectedLocation, nil).Once()

		location, err := service.GetLocationByCode(ctx, tenantID, code)

		assert.NoError(t, err)
		assert.NotNil(t, location)
		assert.Equal(t, code, location.Code)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockLocationRepo.On("GetByCode", ctx, tenantID, code).Return(nil, errors.New("not found")).Once()

		location, err := service.GetLocationByCode(ctx, tenantID, code)

		assert.Error(t, err)
		assert.Nil(t, location)
		mockLocationRepo.AssertExpectations(t)
	})
}

func TestLocationService_ListLocations(t *testing.T) {
	mockLocationRepo := new(MockLocationRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewLocationService(mockLocationRepo, mockTenantRepo)

	ctx := context.Background()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 20

		expectedLocations := []*models.Location{
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "LOC001",
				Name:     "Headquarters",
				TypeID:   uuid.New(),
			},
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "LOC002",
				Name:     "Branch Office",
				TypeID:   uuid.New(),
			},
		}

		mockLocationRepo.On("ListByTenant", ctx, tenantID, page, limit).Return(expectedLocations, int64(2), nil).Once()

		locations, meta, err := service.ListLocations(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, locations)
		assert.Len(t, locations, 2)
		assert.NotNil(t, meta)
		assert.Equal(t, page, meta.Page)
		assert.Equal(t, limit, meta.Limit)
		assert.Equal(t, int64(2), meta.Total)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("default pagination values", func(t *testing.T) {
		page := 0    // Should default to 1
		limit := 200 // Should default to 20 (max 100)

		mockLocationRepo.On("ListByTenant", ctx, tenantID, 1, 20).Return([]*models.Location{}, int64(0), nil).Once()

		locations, meta, err := service.ListLocations(ctx, tenantID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, locations)
		assert.NotNil(t, meta)
		assert.Equal(t, 1, meta.Page)
		assert.Equal(t, 20, meta.Limit)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 20

		mockLocationRepo.On("ListByTenant", ctx, tenantID, page, limit).Return(nil, int64(0), errors.New("db error")).Once()

		locations, meta, err := service.ListLocations(ctx, tenantID, page, limit)

		assert.Error(t, err)
		assert.Nil(t, locations)
		assert.Nil(t, meta)
		mockLocationRepo.AssertExpectations(t)
	})
}

func TestLocationService_ListLocationsByType(t *testing.T) {
	mockLocationRepo := new(MockLocationRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewLocationService(mockLocationRepo, mockTenantRepo)

	ctx := context.Background()
	tenantID := uuid.New()
	typeID := uuid.New()

	t.Run("success", func(t *testing.T) {
		page := 1
		limit := 20

		expectedLocations := []*models.Location{
			{
				ID:       uuid.New(),
				TenantID: tenantID,
				Code:     "LOC001",
				Name:     "Office 1",
				TypeID:   typeID,
			},
		}

		mockLocationRepo.On("ListByType", ctx, tenantID, typeID, page, limit).Return(expectedLocations, int64(1), nil).Once()

		locations, meta, err := service.ListLocationsByType(ctx, tenantID, typeID, page, limit)

		assert.NoError(t, err)
		assert.NotNil(t, locations)
		assert.Len(t, locations, 1)
		assert.NotNil(t, meta)
		assert.Equal(t, typeID, locations[0].TypeID)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		page := 1
		limit := 20

		mockLocationRepo.On("ListByType", ctx, tenantID, typeID, page, limit).Return(nil, int64(0), errors.New("db error")).Once()

		locations, meta, err := service.ListLocationsByType(ctx, tenantID, typeID, page, limit)

		assert.Error(t, err)
		assert.Nil(t, locations)
		assert.Nil(t, meta)
		mockLocationRepo.AssertExpectations(t)
	})
}

func TestLocationService_UpdateLocation(t *testing.T) {
	mockLocationRepo := new(MockLocationRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewLocationService(mockLocationRepo, mockTenantRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingLocation := &models.Location{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "LOC001",
			Name:     "Old Name",
			TypeID:   uuid.New(),
			Status:   "ACTIVE",
		}

		newName := "New Name"
		newStatus := "INACTIVE"
		newTimezone := "America/New_York"

		mockLocationRepo.On("GetByID", ctx, id).Return(existingLocation, nil).Once()
		mockLocationRepo.On("Update", ctx, mock.AnythingOfType("*models.Location")).Return(nil).Once()

		req := UpdateLocationRequest{
			Name:     &newName,
			Status:   &newStatus,
			Timezone: &newTimezone,
		}

		location, err := service.UpdateLocation(ctx, id, req)

		assert.NoError(t, err)
		assert.NotNil(t, location)
		assert.Equal(t, newName, location.Name)
		assert.Equal(t, newStatus, location.Status)
		assert.Equal(t, newTimezone, location.Timezone)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("location not found", func(t *testing.T) {
		mockLocationRepo.On("GetByID", ctx, id).Return(nil, errors.New("not found")).Once()

		newName := "New Name"
		req := UpdateLocationRequest{
			Name: &newName,
		}

		location, err := service.UpdateLocation(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, location)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("repository error on update", func(t *testing.T) {
		existingLocation := &models.Location{
			ID:       id,
			TenantID: uuid.New(),
			Code:     "LOC001",
			Name:     "Old Name",
			TypeID:   uuid.New(),
		}

		newName := "New Name"

		mockLocationRepo.On("GetByID", ctx, id).Return(existingLocation, nil).Once()
		mockLocationRepo.On("Update", ctx, mock.AnythingOfType("*models.Location")).Return(errors.New("db error")).Once()

		req := UpdateLocationRequest{
			Name: &newName,
		}

		location, err := service.UpdateLocation(ctx, id, req)

		assert.Error(t, err)
		assert.Nil(t, location)
		mockLocationRepo.AssertExpectations(t)
	})
}

func TestLocationService_DeleteLocation(t *testing.T) {
	mockLocationRepo := new(MockLocationRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewLocationService(mockLocationRepo, mockTenantRepo)

	ctx := context.Background()
	id := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockLocationRepo.On("Delete", ctx, id).Return(nil).Once()

		err := service.DeleteLocation(ctx, id)

		assert.NoError(t, err)
		mockLocationRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockLocationRepo.On("Delete", ctx, id).Return(errors.New("db error")).Once()

		err := service.DeleteLocation(ctx, id)

		assert.Error(t, err)
		mockLocationRepo.AssertExpectations(t)
	})
}
