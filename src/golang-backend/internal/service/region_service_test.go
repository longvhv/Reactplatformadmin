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

// MockRegionRepository is a mock of RegionRepository
type MockRegionRepository struct {
	mock.Mock
}

func (m *MockRegionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Region, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Region), args.Error(1)
}

func (m *MockRegionRepository) GetByCode(ctx context.Context, code string) (*models.Region, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Region), args.Error(1)
}

func (m *MockRegionRepository) List(ctx context.Context, regionType string, parentID *uuid.UUID, status *int, limit, offset int) ([]*models.Region, int64, error) {
	args := m.Called(ctx, regionType, parentID, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.Region), args.Get(1).(int64), args.Error(2)
}

func (m *MockRegionRepository) GetChildren(ctx context.Context, parentID uuid.UUID) ([]*models.Region, error) {
	args := m.Called(ctx, parentID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Region), args.Error(1)
}

func (m *MockRegionRepository) Create(ctx context.Context, region *models.Region) error {
	args := m.Called(ctx, region)
	return args.Error(0)
}

func (m *MockRegionRepository) Update(ctx context.Context, region *models.Region) error {
	args := m.Called(ctx, region)
	return args.Error(0)
}

func (m *MockRegionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestRegionService_GetByID(t *testing.T) {
	mockRepo := new(MockRegionRepository)
	service := NewRegionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		regionID := uuid.New()
		expectedRegion := &models.Region{
			ID:     regionID,
			Code:   "VN",
			Name:   "Vietnam",
			Type:   "country",
			Status: 1,
		}

		mockRepo.On("GetByID", ctx, regionID).Return(expectedRegion, nil).Once()

		region, err := service.GetByID(ctx, regionID)

		assert.NoError(t, err)
		assert.NotNil(t, region)
		assert.Equal(t, regionID, region.ID)
		assert.Equal(t, "VN", region.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		regionID := uuid.New()
		mockRepo.On("GetByID", ctx, regionID).Return(nil, errors.New("not found")).Once()

		region, err := service.GetByID(ctx, regionID)

		assert.Error(t, err)
		assert.Nil(t, region)
		mockRepo.AssertExpectations(t)
	})
}

func TestRegionService_GetByCode(t *testing.T) {
	mockRepo := new(MockRegionRepository)
	service := NewRegionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		expectedRegion := &models.Region{
			ID:     uuid.New(),
			Code:   "VN",
			Name:   "Vietnam",
			Type:   "country",
			Status: 1,
		}

		mockRepo.On("GetByCode", ctx, "VN").Return(expectedRegion, nil).Once()

		region, err := service.GetByCode(ctx, "VN")

		assert.NoError(t, err)
		assert.NotNil(t, region)
		assert.Equal(t, "VN", region.Code)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, "XX").Return(nil, errors.New("not found")).Once()

		region, err := service.GetByCode(ctx, "XX")

		assert.Error(t, err)
		assert.Nil(t, region)
		mockRepo.AssertExpectations(t)
	})
}

func TestRegionService_ListRegions(t *testing.T) {
	mockRepo := new(MockRegionRepository)
	service := NewRegionService(mockRepo)
	ctx := context.Background()

	t.Run("success with pagination", func(t *testing.T) {
		expectedRegions := []*models.Region{
			{ID: uuid.New(), Code: "VN", Name: "Vietnam", Type: "country"},
			{ID: uuid.New(), Code: "US", Name: "United States", Type: "country"},
		}
		var total int64 = 2

		mockRepo.On("List", ctx, "country", (*uuid.UUID)(nil), (*int)(nil), 10, 0).
			Return(expectedRegions, total, nil).Once()

		regions, count, err := service.ListRegions(ctx, "country", nil, nil, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, regions, 2)
		assert.Equal(t, total, count)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with parent filter", func(t *testing.T) {
		parentID := uuid.New()
		expectedRegions := []*models.Region{
			{ID: uuid.New(), Code: "HN", Name: "Hanoi", Type: "city", ParentID: &parentID},
		}
		var total int64 = 1

		mockRepo.On("List", ctx, "city", &parentID, (*int)(nil), 10, 0).
			Return(expectedRegions, total, nil).Once()

		regions, count, err := service.ListRegions(ctx, "city", &parentID, nil, 1, 10)

		assert.NoError(t, err)
		assert.Len(t, regions, 1)
		assert.Equal(t, total, count)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("List", ctx, "country", (*uuid.UUID)(nil), (*int)(nil), 10, 0).
			Return(nil, int64(0), errors.New("db error")).Once()

		regions, count, err := service.ListRegions(ctx, "country", nil, nil, 1, 10)

		assert.Error(t, err)
		assert.Nil(t, regions)
		assert.Equal(t, int64(0), count)
		mockRepo.AssertExpectations(t)
	})
}

func TestRegionService_CreateRegion(t *testing.T) {
	mockRepo := new(MockRegionRepository)
	service := NewRegionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		req := CreateRegionRequest{
			Code:       "VN",
			Name:       "Vietnam",
			Type:       "country",
			Order:      1,
			Status:     1,
			IsEditable: true,
		}

		mockRepo.On("GetByCode", ctx, "VN").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Region")).Return(nil).Once()

		region, err := service.CreateRegion(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, region)
		assert.Equal(t, "VN", region.Code)
		assert.Equal(t, "Vietnam", region.Name)
		assert.Equal(t, 1, region.Status)
		mockRepo.AssertExpectations(t)
	})

	t.Run("duplicate code", func(t *testing.T) {
		req := CreateRegionRequest{
			Code:   "VN",
			Name:   "Vietnam",
			Type:   "country",
			Status: 1,
		}

		existingRegion := &models.Region{ID: uuid.New(), Code: "VN", Name: "Vietnam"}
		mockRepo.On("GetByCode", ctx, "VN").Return(existingRegion, nil).Once()

		region, err := service.CreateRegion(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, region)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("with parent", func(t *testing.T) {
		parentID := uuid.New()
		req := CreateRegionRequest{
			Code:     "HN",
			Name:     "Hanoi",
			Type:     "city",
			ParentID: &parentID,
			Status:   1,
		}

		mockRepo.On("GetByCode", ctx, "HN").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Region")).Return(nil).Once()

		region, err := service.CreateRegion(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, region)
		assert.Equal(t, &parentID, region.ParentID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateRegionRequest{
			Code:   "VN",
			Name:   "Vietnam",
			Type:   "country",
			Status: 1,
		}

		mockRepo.On("GetByCode", ctx, "VN").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.Region")).Return(errors.New("db error")).Once()

		region, err := service.CreateRegion(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, region)
		assert.Contains(t, err.Error(), "failed to create region")
		mockRepo.AssertExpectations(t)
	})
}

func TestRegionService_UpdateRegion(t *testing.T) {
	mockRepo := new(MockRegionRepository)
	service := NewRegionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		regionID := uuid.New()
		existingRegion := &models.Region{
			ID:         regionID,
			Code:       "VN",
			Name:       "Vietnam",
			Type:       "country",
			Status:     1,
			IsEditable: true,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
			Version:    1,
		}

		newName := "Socialist Republic of Vietnam"
		req := UpdateRegionRequest{
			Name: &newName,
		}

		mockRepo.On("GetByID", ctx, regionID).Return(existingRegion, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.Region")).Return(nil).Once()

		region, err := service.UpdateRegion(ctx, regionID, req)

		assert.NoError(t, err)
		assert.NotNil(t, region)
		assert.Equal(t, newName, region.Name)
		assert.Equal(t, 2, region.Version)
		mockRepo.AssertExpectations(t)
	})

	t.Run("region not found", func(t *testing.T) {
		regionID := uuid.New()
		req := UpdateRegionRequest{}

		mockRepo.On("GetByID", ctx, regionID).Return(nil, errors.New("not found")).Once()

		region, err := service.UpdateRegion(ctx, regionID, req)

		assert.Error(t, err)
		assert.Nil(t, region)
		assert.Contains(t, err.Error(), "region not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("not editable", func(t *testing.T) {
		regionID := uuid.New()
		existingRegion := &models.Region{
			ID:         regionID,
			Code:       "VN",
			Name:       "Vietnam",
			IsEditable: false,
		}

		req := UpdateRegionRequest{}

		mockRepo.On("GetByID", ctx, regionID).Return(existingRegion, nil).Once()

		region, err := service.UpdateRegion(ctx, regionID, req)

		assert.Error(t, err)
		assert.Nil(t, region)
		assert.Contains(t, err.Error(), "not editable")
		mockRepo.AssertExpectations(t)
	})
}

func TestRegionService_DeleteRegion(t *testing.T) {
	mockRepo := new(MockRegionRepository)
	service := NewRegionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		regionID := uuid.New()
		existingRegion := &models.Region{
			ID:         regionID,
			Code:       "VN",
			Name:       "Vietnam",
			IsSystem:   false,
			IsEditable: true,
		}

		mockRepo.On("GetByID", ctx, regionID).Return(existingRegion, nil).Once()
		mockRepo.On("GetChildren", ctx, regionID).Return([]*models.Region{}, nil).Once()
		mockRepo.On("Delete", ctx, regionID).Return(nil).Once()

		err := service.DeleteRegion(ctx, regionID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("region not found", func(t *testing.T) {
		regionID := uuid.New()
		mockRepo.On("GetByID", ctx, regionID).Return(nil, errors.New("not found")).Once()

		err := service.DeleteRegion(ctx, regionID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "region not found")
		mockRepo.AssertExpectations(t)
	})

	t.Run("system region", func(t *testing.T) {
		regionID := uuid.New()
		existingRegion := &models.Region{
			ID:       regionID,
			Code:     "VN",
			IsSystem: true,
		}

		mockRepo.On("GetByID", ctx, regionID).Return(existingRegion, nil).Once()

		err := service.DeleteRegion(ctx, regionID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete system region")
		mockRepo.AssertExpectations(t)
	})

	t.Run("not editable", func(t *testing.T) {
		regionID := uuid.New()
		existingRegion := &models.Region{
			ID:         regionID,
			Code:       "VN",
			IsSystem:   false,
			IsEditable: false,
		}

		mockRepo.On("GetByID", ctx, regionID).Return(existingRegion, nil).Once()

		err := service.DeleteRegion(ctx, regionID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "not editable")
		mockRepo.AssertExpectations(t)
	})

	t.Run("has children", func(t *testing.T) {
		regionID := uuid.New()
		existingRegion := &models.Region{
			ID:         regionID,
			Code:       "VN",
			IsSystem:   false,
			IsEditable: true,
		}
		children := []*models.Region{
			{ID: uuid.New(), Code: "HN", ParentID: &regionID},
		}

		mockRepo.On("GetByID", ctx, regionID).Return(existingRegion, nil).Once()
		mockRepo.On("GetChildren", ctx, regionID).Return(children, nil).Once()

		err := service.DeleteRegion(ctx, regionID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete region with children")
		mockRepo.AssertExpectations(t)
	})
}

func TestRegionService_GetChildren(t *testing.T) {
	mockRepo := new(MockRegionRepository)
	service := NewRegionService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		parentID := uuid.New()
		expectedChildren := []*models.Region{
			{ID: uuid.New(), Code: "HN", Name: "Hanoi", ParentID: &parentID},
			{ID: uuid.New(), Code: "HCM", Name: "Ho Chi Minh", ParentID: &parentID},
		}

		mockRepo.On("GetChildren", ctx, parentID).Return(expectedChildren, nil).Once()

		children, err := service.GetChildren(ctx, parentID)

		assert.NoError(t, err)
		assert.Len(t, children, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("no children", func(t *testing.T) {
		parentID := uuid.New()
		mockRepo.On("GetChildren", ctx, parentID).Return([]*models.Region{}, nil).Once()

		children, err := service.GetChildren(ctx, parentID)

		assert.NoError(t, err)
		assert.Len(t, children, 0)
		mockRepo.AssertExpectations(t)
	})
}

func TestRegionService_GetHierarchy(t *testing.T) {
	mockRepo := new(MockRegionRepository)
	service := NewRegionService(mockRepo)
	ctx := context.Background()

	t.Run("success - simple hierarchy", func(t *testing.T) {
		countryID := uuid.New()
		rootRegions := []*models.Region{
			{ID: countryID, Code: "VN", Name: "Vietnam", Type: "country"},
		}

		mockRepo.On("List", ctx, "country", (*uuid.UUID)(nil), (*int)(nil), 100, 0).
			Return(rootRegions, int64(1), nil).Once()
		mockRepo.On("GetChildren", ctx, countryID).Return([]*models.Region{}, nil).Once()

		hierarchy, err := service.GetHierarchy(ctx, "country")

		assert.NoError(t, err)
		assert.Len(t, hierarchy, 1)
		assert.Equal(t, "VN", hierarchy[0]["code"])
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with children", func(t *testing.T) {
		countryID := uuid.New()
		cityID := uuid.New()

		rootRegions := []*models.Region{
			{ID: countryID, Code: "VN", Name: "Vietnam", Type: "country"},
		}
		cityRegions := []*models.Region{
			{ID: cityID, Code: "HN", Name: "Hanoi", Type: "city", ParentID: &countryID},
		}

		mockRepo.On("List", ctx, "country", (*uuid.UUID)(nil), (*int)(nil), 100, 0).
			Return(rootRegions, int64(1), nil).Once()
		mockRepo.On("GetChildren", ctx, countryID).Return(cityRegions, nil).Once()
		mockRepo.On("GetChildren", ctx, cityID).Return([]*models.Region{}, nil).Once()

		hierarchy, err := service.GetHierarchy(ctx, "country")

		assert.NoError(t, err)
		assert.Len(t, hierarchy, 1)
		children := hierarchy[0]["children"].([]map[string]interface{})
		assert.Len(t, children, 1)
		assert.Equal(t, "HN", children[0]["code"])
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("List", ctx, "country", (*uuid.UUID)(nil), (*int)(nil), 100, 0).
			Return(nil, int64(0), errors.New("db error")).Once()

		hierarchy, err := service.GetHierarchy(ctx, "country")

		assert.Error(t, err)
		assert.Nil(t, hierarchy)
		mockRepo.AssertExpectations(t)
	})
}
