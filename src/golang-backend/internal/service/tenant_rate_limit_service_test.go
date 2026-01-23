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

// MockTenantRateLimitRepository is a mock of TenantRateLimitRepository
type MockTenantRateLimitRepository struct {
	mock.Mock
}

func (m *MockTenantRateLimitRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.TenantRateLimit, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantRateLimit), args.Error(1)
}

func (m *MockTenantRateLimitRepository) GetByKey(ctx context.Context, tenantID uuid.UUID, limitKey string) (*models.TenantRateLimit, error) {
	args := m.Called(ctx, tenantID, limitKey)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.TenantRateLimit), args.Error(1)
}

func (m *MockTenantRateLimitRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, resourceType string, limit, offset int) ([]*models.TenantRateLimit, int64, error) {
	args := m.Called(ctx, tenantID, resourceType, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.TenantRateLimit), args.Get(1).(int64), args.Error(2)
}

func (m *MockTenantRateLimitRepository) ExistsByKey(ctx context.Context, tenantID uuid.UUID, limitKey string) (bool, error) {
	args := m.Called(ctx, tenantID, limitKey)
	return args.Bool(0), args.Error(1)
}

func (m *MockTenantRateLimitRepository) Create(ctx context.Context, rateLimit *models.TenantRateLimit) error {
	args := m.Called(ctx, rateLimit)
	return args.Error(0)
}

func (m *MockTenantRateLimitRepository) Update(ctx context.Context, rateLimit *models.TenantRateLimit) error {
	args := m.Called(ctx, rateLimit)
	return args.Error(0)
}

func (m *MockTenantRateLimitRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockCache is a mock of Cache
type MockCache struct {
	mock.Mock
}

func (m *MockCache) GetJSON(ctx context.Context, key string, dest interface{}) error {
	args := m.Called(ctx, key, dest)
	return args.Error(0)
}

func (m *MockCache) SetJSON(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	args := m.Called(ctx, key, value, ttl)
	return args.Error(0)
}

func (m *MockCache) Delete(ctx context.Context, key string) error {
	args := m.Called(ctx, key)
	return args.Error(0)
}

func (m *MockCache) Increment(ctx context.Context, key string, delta int64) (int64, error) {
	args := m.Called(ctx, key, delta)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockCache) SetExpiration(ctx context.Context, key string, expiration time.Duration) error {
	args := m.Called(ctx, key, expiration)
	return args.Error(0)
}

func (m *MockCache) GetTTL(ctx context.Context, key string) (time.Duration, error) {
	args := m.Called(ctx, key)
	return args.Get(0).(time.Duration), args.Error(1)
}

func TestTenantRateLimitService_CreateRateLimit(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantRateLimitRequest{
			TenantID:    tenantID,
			LimitName:   "API Rate Limit",
			LimitKey:    "api_limit",
			MaxRequests: 1000,
			TimeWindow:  60,
			IsEnabled:   true,
			IsStrict:    false,
			CreatedBy:   uuid.New(),
		}

		mockRepo.On("ExistsByKey", ctx, tenantID, "api_limit").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantRateLimit")).Return(nil).Once()

		rateLimit, err := service.CreateRateLimit(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, rateLimit)
		assert.Equal(t, "API Rate Limit", rateLimit.LimitName)
		assert.Equal(t, "api_limit", rateLimit.LimitKey)
		assert.Equal(t, "second", rateLimit.WindowUnit)
		assert.Equal(t, "sliding_window", rateLimit.LimitType)
		assert.Equal(t, "tenant", rateLimit.LimitScope)
		assert.Equal(t, 0, rateLimit.CurrentUsage)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full details", func(t *testing.T) {
		tenantID := uuid.New()
		packageID := uuid.New()
		resourceType := "api"
		endpointPattern := "/api/v1/*"
		burstLimit := 50
		concurrentLimit := 10
		blockDuration := 300
		retryAfter := 60
		customMsg := "Rate limit exceeded"
		customCode := "RATE_LIMIT_EXCEEDED"
		alertThreshold := 80

		req := CreateTenantRateLimitRequest{
			TenantID:         tenantID,
			ServicePackageID: &packageID,
			LimitName:        "Premium API Limit",
			LimitKey:         "premium_api",
			ResourceType:     &resourceType,
			EndpointPattern:  &endpointPattern,
			MaxRequests:      10000,
			TimeWindow:       1,
			WindowUnit:       "hour",
			BurstLimit:       &burstLimit,
			ConcurrentLimit:  &concurrentLimit,
			LimitType:        "fixed_window",
			LimitScope:       "user",
			IsEnabled:        true,
			IsStrict:         true,
			BlockDuration:    &blockDuration,
			RetryAfter:       &retryAfter,
			CustomErrorMsg:   &customMsg,
			CustomErrorCode:  &customCode,
			AlertThreshold:   &alertThreshold,
			CreatedBy:        uuid.New(),
		}

		mockRepo.On("ExistsByKey", ctx, tenantID, "premium_api").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantRateLimit")).Return(nil).Once()

		rateLimit, err := service.CreateRateLimit(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "hour", rateLimit.WindowUnit)
		assert.Equal(t, "fixed_window", rateLimit.LimitType)
		assert.Equal(t, "user", rateLimit.LimitScope)
		assert.Equal(t, &packageID, rateLimit.ServicePackageID)
		assert.Equal(t, &burstLimit, rateLimit.BurstLimit)
		assert.Equal(t, &concurrentLimit, rateLimit.ConcurrentLimit)
		mockRepo.AssertExpectations(t)
	})

	t.Run("duplicate key", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantRateLimitRequest{
			TenantID:    tenantID,
			LimitName:   "Test",
			LimitKey:    "existing_key",
			MaxRequests: 100,
			TimeWindow:  60,
			CreatedBy:   uuid.New(),
		}

		mockRepo.On("ExistsByKey", ctx, tenantID, "existing_key").Return(true, nil).Once()

		rateLimit, err := service.CreateRateLimit(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, rateLimit)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateTenantRateLimitRequest{
			TenantID:    tenantID,
			LimitName:   "Test",
			LimitKey:    "test_key",
			MaxRequests: 100,
			TimeWindow:  60,
			CreatedBy:   uuid.New(),
		}

		mockRepo.On("ExistsByKey", ctx, tenantID, "test_key").Return(false, nil).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.TenantRateLimit")).Return(errors.New("db error")).Once()

		rateLimit, err := service.CreateRateLimit(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, rateLimit)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantRateLimitService_UpdateRateLimit(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		limitID := uuid.New()
		existing := &models.TenantRateLimit{
			ID:          limitID,
			TenantID:    uuid.New(),
			LimitKey:    "test_key",
			LimitName:   "Old Name",
			MaxRequests: 100,
			IsEnabled:   true,
		}

		newName := "Updated Name"
		newMax := 500
		isEnabled := false
		req := UpdateTenantRateLimitRequest{
			LimitName:   &newName,
			MaxRequests: &newMax,
			IsEnabled:   &isEnabled,
			UpdatedBy:   uuid.New(),
		}

		mockRepo.On("GetByID", ctx, limitID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantRateLimit")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		rateLimit, err := service.UpdateRateLimit(ctx, limitID, req)

		assert.NoError(t, err)
		assert.NotNil(t, rateLimit)
		assert.Equal(t, "Updated Name", rateLimit.LimitName)
		assert.Equal(t, 500, rateLimit.MaxRequests)
		assert.False(t, rateLimit.IsEnabled)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("rate limit not found", func(t *testing.T) {
		limitID := uuid.New()
		req := UpdateTenantRateLimitRequest{UpdatedBy: uuid.New()}

		mockRepo.On("GetByID", ctx, limitID).Return(nil, errors.New("not found")).Once()

		rateLimit, err := service.UpdateRateLimit(ctx, limitID, req)

		assert.Error(t, err)
		assert.Nil(t, rateLimit)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantRateLimitService_GetByID(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		limitID := uuid.New()
		expected := &models.TenantRateLimit{
			ID:       limitID,
			LimitKey: "test_key",
		}

		mockRepo.On("GetByID", ctx, limitID).Return(expected, nil).Once()

		rateLimit, err := service.GetByID(ctx, limitID)

		assert.NoError(t, err)
		assert.NotNil(t, rateLimit)
		assert.Equal(t, limitID, rateLimit.ID)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantRateLimitService_GetByKey(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("cache hit", func(t *testing.T) {
		tenantID := uuid.New()
		limitKey := "api_limit"
		cacheKey := "ratelimit:" + tenantID.String() + ":" + limitKey

		mockCache.On("GetJSON", ctx, cacheKey, mock.AnythingOfType("*models.TenantRateLimit")).Return(nil).Once()

		rateLimit, err := service.GetByKey(ctx, tenantID, limitKey)

		assert.NoError(t, err)
		assert.NotNil(t, rateLimit)
		mockCache.AssertExpectations(t)
	})

	t.Run("cache miss - load from db", func(t *testing.T) {
		tenantID := uuid.New()
		limitKey := "api_limit"
		expected := &models.TenantRateLimit{
			ID:       uuid.New(),
			LimitKey: limitKey,
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("GetByKey", ctx, tenantID, limitKey).Return(expected, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, expected, mock.Anything).Return(nil).Once()

		rateLimit, err := service.GetByKey(ctx, tenantID, limitKey)

		assert.NoError(t, err)
		assert.NotNil(t, rateLimit)
		assert.Equal(t, limitKey, rateLimit.LimitKey)
		mockCache.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantRateLimitService_CheckLimit(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("within limit", func(t *testing.T) {
		tenantID := uuid.New()
		limitKey := "api_limit"
		rateLimit := &models.TenantRateLimit{
			ID:          uuid.New(),
			TenantID:    tenantID,
			LimitKey:    limitKey,
			MaxRequests: 100,
			TimeWindow:  60,
			WindowUnit:  "second",
			LimitScope:  "tenant",
			IsEnabled:   true,
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("miss")).Once()
		mockRepo.On("GetByKey", ctx, tenantID, limitKey).Return(rateLimit, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, rateLimit, mock.Anything).Return(nil).Once()
		mockCache.On("Increment", ctx, mock.Anything, int64(1)).Return(int64(50), nil).Once()
		mockCache.On("GetTTL", ctx, mock.Anything).Return(30*time.Second, nil).Once()

		allowed, remaining, resetAt, err := service.CheckLimit(ctx, tenantID, limitKey, nil)

		assert.NoError(t, err)
		assert.True(t, allowed)
		assert.Equal(t, 50, remaining)
		assert.True(t, resetAt.After(time.Now()))
		mockCache.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
	})

	t.Run("exceeded limit", func(t *testing.T) {
		tenantID := uuid.New()
		limitKey := "api_limit"
		limitID := uuid.New()
		rateLimit := &models.TenantRateLimit{
			ID:          limitID,
			TenantID:    tenantID,
			LimitKey:    limitKey,
			MaxRequests: 100,
			TimeWindow:  60,
			WindowUnit:  "second",
			LimitScope:  "tenant",
			IsEnabled:   true,
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("miss")).Once()
		mockRepo.On("GetByKey", ctx, tenantID, limitKey).Return(rateLimit, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, rateLimit, mock.Anything).Return(nil).Once()
		mockCache.On("Increment", ctx, mock.Anything, int64(1)).Return(int64(101), nil).Once()
		mockCache.On("GetTTL", ctx, mock.Anything).Return(30*time.Second, nil).Once()
		mockRepo.On("GetByID", ctx, limitID).Return(rateLimit, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantRateLimit")).Return(nil).Once()

		allowed, remaining, _, err := service.CheckLimit(ctx, tenantID, limitKey, nil)

		assert.NoError(t, err)
		assert.False(t, allowed)
		assert.Equal(t, 0, remaining)
		mockCache.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
	})

	t.Run("disabled limit", func(t *testing.T) {
		tenantID := uuid.New()
		limitKey := "disabled_limit"
		rateLimit := &models.TenantRateLimit{
			ID:          uuid.New(),
			LimitKey:    limitKey,
			MaxRequests: 100,
			IsEnabled:   false,
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("miss")).Once()
		mockRepo.On("GetByKey", ctx, tenantID, limitKey).Return(rateLimit, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, rateLimit, mock.Anything).Return(nil).Once()

		allowed, remaining, _, err := service.CheckLimit(ctx, tenantID, limitKey, nil)

		assert.NoError(t, err)
		assert.True(t, allowed)
		assert.Equal(t, 100, remaining)
		mockCache.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
	})

	t.Run("first increment sets expiration", func(t *testing.T) {
		tenantID := uuid.New()
		limitKey := "api_limit"
		rateLimit := &models.TenantRateLimit{
			ID:          uuid.New(),
			TenantID:    tenantID,
			LimitKey:    limitKey,
			MaxRequests: 100,
			TimeWindow:  60,
			WindowUnit:  "second",
			LimitScope:  "tenant",
			IsEnabled:   true,
		}

		mockCache.On("GetJSON", ctx, mock.Anything, mock.Anything).Return(errors.New("miss")).Once()
		mockRepo.On("GetByKey", ctx, tenantID, limitKey).Return(rateLimit, nil).Once()
		mockCache.On("SetJSON", ctx, mock.Anything, rateLimit, mock.Anything).Return(nil).Once()
		mockCache.On("Increment", ctx, mock.Anything, int64(1)).Return(int64(1), nil).Once()
		mockCache.On("SetExpiration", ctx, mock.Anything, 60*time.Second).Return(nil).Once()
		mockCache.On("GetTTL", ctx, mock.Anything).Return(60*time.Second, nil).Once()

		allowed, remaining, _, err := service.CheckLimit(ctx, tenantID, limitKey, nil)

		assert.NoError(t, err)
		assert.True(t, allowed)
		assert.Equal(t, 99, remaining)
		mockCache.AssertExpectations(t)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantRateLimitService_ResetUsage(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		limitID := uuid.New()
		existing := &models.TenantRateLimit{
			ID:           limitID,
			CurrentUsage: 50,
		}

		mockRepo.On("GetByID", ctx, limitID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.TenantRateLimit")).Return(nil).Once()

		err := service.ResetUsage(ctx, limitID)

		assert.NoError(t, err)
		assert.Equal(t, 0, existing.CurrentUsage)
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantRateLimitService_GetStats(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		limitID := uuid.New()
		now := time.Now()
		rateLimit := &models.TenantRateLimit{
			ID:              limitID,
			LimitKey:        "api_limit",
			MaxRequests:     100,
			CurrentUsage:    75,
			PeakUsage:       90,
			ExceededCount:   5,
			LastExceededAt:  &now,
		}

		mockRepo.On("GetByID", ctx, limitID).Return(rateLimit, nil).Once()

		stats, err := service.GetStats(ctx, limitID)

		assert.NoError(t, err)
		assert.NotNil(t, stats)
		assert.Equal(t, "api_limit", stats["limit_key"])
		assert.Equal(t, 100, stats["max_requests"])
		assert.Equal(t, 75, stats["current_usage"])
		assert.Equal(t, 90, stats["peak_usage"])
		assert.Equal(t, 5, stats["exceeded_count"])
		assert.Equal(t, 75.0, stats["usage_percentage"])
		mockRepo.AssertExpectations(t)
	})
}

func TestTenantRateLimitService_DeleteRateLimit(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		limitID := uuid.New()
		existing := &models.TenantRateLimit{
			ID:       limitID,
			TenantID: uuid.New(),
			LimitKey: "test_key",
		}

		mockRepo.On("GetByID", ctx, limitID).Return(existing, nil).Once()
		mockRepo.On("Delete", ctx, limitID).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		err := service.DeleteRateLimit(ctx, limitID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})
}

func TestTenantRateLimitService_ListByTenant(t *testing.T) {
	mockRepo := new(MockTenantRateLimitRepository)
	mockCache := new(MockCache)
	service := NewTenantRateLimitService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.TenantRateLimit{
			{ID: uuid.New(), LimitKey: "api_limit"},
			{ID: uuid.New(), LimitKey: "upload_limit"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", 10, 0).Return(expected, int64(2), nil).Once()

		limits, total, err := service.ListByTenant(ctx, tenantID, "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, limits, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})
}
