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

// MockSystemAnnouncementRepository is a mock of SystemAnnouncementRepository
type MockSystemAnnouncementRepository struct {
	mock.Mock
}

func (m *MockSystemAnnouncementRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SystemAnnouncement, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SystemAnnouncement), args.Error(1)
}

func (m *MockSystemAnnouncementRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, announcementType, status string, limit, offset int) ([]*models.SystemAnnouncement, int64, error) {
	args := m.Called(ctx, tenantID, announcementType, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.SystemAnnouncement), args.Get(1).(int64), args.Error(2)
}

func (m *MockSystemAnnouncementRepository) Create(ctx context.Context, announcement *models.SystemAnnouncement) error {
	args := m.Called(ctx, announcement)
	return args.Error(0)
}

func (m *MockSystemAnnouncementRepository) Update(ctx context.Context, announcement *models.SystemAnnouncement) error {
	args := m.Called(ctx, announcement)
	return args.Error(0)
}

func (m *MockSystemAnnouncementRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockCacheService is a mock of CacheService
type MockCacheService struct {
	mock.Mock
}

func (m *MockCacheService) Get(ctx context.Context, key string, dest interface{}) error {
	args := m.Called(ctx, key, dest)
	return args.Error(0)
}

func (m *MockCacheService) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	args := m.Called(ctx, key, value, ttl)
	return args.Error(0)
}

func (m *MockCacheService) Delete(ctx context.Context, key string) error {
	args := m.Called(ctx, key)
	return args.Error(0)
}

func TestSystemAnnouncementService_GetByID(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		announcementID := uuid.New()
		expected := &models.SystemAnnouncement{
			ID:      announcementID,
			Title:   "System Maintenance",
			Content: "Scheduled maintenance tonight",
			Status:  "PUBLISHED",
		}

		mockRepo.On("GetByID", ctx, announcementID).Return(expected, nil).Once()

		announcement, err := service.GetByID(ctx, announcementID)

		assert.NoError(t, err)
		assert.NotNil(t, announcement)
		assert.Equal(t, "System Maintenance", announcement.Title)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		announcementID := uuid.New()
		mockRepo.On("GetByID", ctx, announcementID).Return(nil, errors.New("not found")).Once()

		announcement, err := service.GetByID(ctx, announcementID)

		assert.Error(t, err)
		assert.Nil(t, announcement)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_CreateAnnouncement(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateSystemAnnouncementRequest{
			TenantID:  tenantID,
			Title:     "New Feature",
			Content:   "We've released a new feature!",
			CreatedBy: "admin",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(nil).Once()

		announcement, err := service.CreateAnnouncement(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, announcement)
		assert.Equal(t, "New Feature", announcement.Title)
		assert.Equal(t, "info", announcement.Type)
		assert.Equal(t, "normal", announcement.Severity)
		assert.Equal(t, "all", announcement.TargetAudience)
		assert.Equal(t, "DRAFT", announcement.Status)
		assert.Equal(t, 0, announcement.ReadCount)
		assert.Equal(t, 0, announcement.ViewCount)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with custom values", func(t *testing.T) {
		tenantID := uuid.New()
		startDate := time.Now().Add(24 * time.Hour).Format(time.RFC3339)
		endDate := time.Now().Add(72 * time.Hour).Format(time.RFC3339)

		req := CreateSystemAnnouncementRequest{
			TenantID:       tenantID,
			Title:          "Urgent Maintenance",
			Content:        "Critical system update",
			Type:           "maintenance",
			Severity:       "high",
			TargetAudience: "admins",
			StartDate:      &startDate,
			EndDate:        &endDate,
			IsPinned:       true,
			IsGlobal:       true,
			Tags:           []string{"maintenance", "urgent"},
			CreatedBy:      "admin",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(nil).Once()

		announcement, err := service.CreateAnnouncement(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "maintenance", announcement.Type)
		assert.Equal(t, "high", announcement.Severity)
		assert.Equal(t, "admins", announcement.TargetAudience)
		assert.True(t, announcement.IsPinned)
		assert.True(t, announcement.IsGlobal)
		assert.Len(t, announcement.Tags, 2)
		assert.NotNil(t, announcement.StartDate)
		assert.NotNil(t, announcement.EndDate)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := CreateSystemAnnouncementRequest{
			TenantID:  uuid.New(),
			Title:     "Test",
			Content:   "Test content",
			CreatedBy: "admin",
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(errors.New("db error")).Once()

		announcement, err := service.CreateAnnouncement(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, announcement)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_UpdateAnnouncement(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		announcementID := uuid.New()
		tenantID := uuid.New()
		existing := &models.SystemAnnouncement{
			ID:       announcementID,
			TenantID: tenantID,
			Title:    "Old Title",
			Content:  "Old Content",
			Status:   "DRAFT",
			Version:  1,
		}

		newTitle := "Updated Title"
		newContent := "Updated Content"
		req := UpdateSystemAnnouncementRequest{
			Title:     &newTitle,
			Content:   &newContent,
			UpdatedBy: "admin",
		}

		mockRepo.On("GetByID", ctx, announcementID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		announcement, err := service.UpdateAnnouncement(ctx, announcementID, req)

		assert.NoError(t, err)
		assert.NotNil(t, announcement)
		assert.Equal(t, "Updated Title", announcement.Title)
		assert.Equal(t, "Updated Content", announcement.Content)
		assert.Equal(t, 2, announcement.Version)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("update severity and pinned", func(t *testing.T) {
		announcementID := uuid.New()
		existing := &models.SystemAnnouncement{
			ID:       announcementID,
			TenantID: uuid.New(),
			Severity: "normal",
			IsPinned: false,
		}

		newSeverity := "high"
		isPinned := true
		req := UpdateSystemAnnouncementRequest{
			Severity:  &newSeverity,
			IsPinned:  &isPinned,
			UpdatedBy: "admin",
		}

		mockRepo.On("GetByID", ctx, announcementID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		announcement, err := service.UpdateAnnouncement(ctx, announcementID, req)

		assert.NoError(t, err)
		assert.Equal(t, "high", announcement.Severity)
		assert.True(t, announcement.IsPinned)
		mockRepo.AssertExpectations(t)
	})

	t.Run("announcement not found", func(t *testing.T) {
		announcementID := uuid.New()
		req := UpdateSystemAnnouncementRequest{UpdatedBy: "admin"}

		mockRepo.On("GetByID", ctx, announcementID).Return(nil, errors.New("not found")).Once()

		announcement, err := service.UpdateAnnouncement(ctx, announcementID, req)

		assert.Error(t, err)
		assert.Nil(t, announcement)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_PublishAnnouncement(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		announcementID := uuid.New()
		tenantID := uuid.New()
		existing := &models.SystemAnnouncement{
			ID:       announcementID,
			TenantID: tenantID,
			Title:    "Test",
			Status:   "DRAFT",
			Version:  1,
		}

		mockRepo.On("GetByID", ctx, announcementID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		announcement, err := service.PublishAnnouncement(ctx, announcementID)

		assert.NoError(t, err)
		assert.NotNil(t, announcement)
		assert.Equal(t, "PUBLISHED", announcement.Status)
		assert.NotNil(t, announcement.PublishedAt)
		assert.Equal(t, 2, announcement.Version)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("announcement not found", func(t *testing.T) {
		announcementID := uuid.New()
		mockRepo.On("GetByID", ctx, announcementID).Return(nil, errors.New("not found")).Once()

		announcement, err := service.PublishAnnouncement(ctx, announcementID)

		assert.Error(t, err)
		assert.Nil(t, announcement)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_ArchiveAnnouncement(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		announcementID := uuid.New()
		tenantID := uuid.New()
		existing := &models.SystemAnnouncement{
			ID:       announcementID,
			TenantID: tenantID,
			Title:    "Test",
			Status:   "PUBLISHED",
			Version:  1,
		}

		mockRepo.On("GetByID", ctx, announcementID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		announcement, err := service.ArchiveAnnouncement(ctx, announcementID)

		assert.NoError(t, err)
		assert.NotNil(t, announcement)
		assert.Equal(t, "ARCHIVED", announcement.Status)
		assert.NotNil(t, announcement.ArchivedAt)
		assert.Equal(t, 2, announcement.Version)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("announcement not found", func(t *testing.T) {
		announcementID := uuid.New()
		mockRepo.On("GetByID", ctx, announcementID).Return(nil, errors.New("not found")).Once()

		announcement, err := service.ArchiveAnnouncement(ctx, announcementID)

		assert.Error(t, err)
		assert.Nil(t, announcement)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_DeleteAnnouncement(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		announcementID := uuid.New()
		tenantID := uuid.New()
		existing := &models.SystemAnnouncement{
			ID:       announcementID,
			TenantID: tenantID,
		}

		mockRepo.On("GetByID", ctx, announcementID).Return(existing, nil).Once()
		mockRepo.On("Delete", ctx, announcementID).Return(nil).Once()
		mockCache.On("Delete", ctx, mock.Anything).Return(nil).Once()

		err := service.DeleteAnnouncement(ctx, announcementID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("announcement not found", func(t *testing.T) {
		announcementID := uuid.New()
		mockRepo.On("GetByID", ctx, announcementID).Return(nil, errors.New("not found")).Once()

		err := service.DeleteAnnouncement(ctx, announcementID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_GetActiveAnnouncements(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success - cache miss", func(t *testing.T) {
		tenantID := uuid.New()
		now := time.Now()
		startDate := now.Add(-1 * time.Hour)
		endDate := now.Add(1 * time.Hour)

		announcements := []*models.SystemAnnouncement{
			{
				ID:        uuid.New(),
				Title:     "Active 1",
				Status:    "PUBLISHED",
				StartDate: &startDate,
				EndDate:   &endDate,
			},
			{
				ID:     uuid.New(),
				Title:  "Active 2",
				Status: "PUBLISHED",
			},
		}

		mockCache.On("Get", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("ListByTenant", ctx, tenantID, "", "PUBLISHED", 1000, 0).
			Return(announcements, int64(2), nil).Once()
		mockCache.On("Set", ctx, mock.Anything, mock.Anything, 5*time.Minute).Return(nil).Once()

		result, err := service.GetActiveAnnouncements(ctx, tenantID)

		assert.NoError(t, err)
		assert.Len(t, result, 2)
		mockRepo.AssertExpectations(t)
		mockCache.AssertExpectations(t)
	})

	t.Run("filter by date range", func(t *testing.T) {
		tenantID := uuid.New()
		now := time.Now()
		pastDate := now.Add(-2 * time.Hour)
		futureDate := now.Add(2 * time.Hour)

		announcements := []*models.SystemAnnouncement{
			{
				ID:        uuid.New(),
				Title:     "Future",
				Status:    "PUBLISHED",
				StartDate: &futureDate, // Not started yet
			},
			{
				ID:      uuid.New(),
				Title:   "Expired",
				Status:  "PUBLISHED",
				EndDate: &pastDate, // Already ended
			},
			{
				ID:     uuid.New(),
				Title:  "Active",
				Status: "PUBLISHED",
			},
		}

		mockCache.On("Get", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("ListByTenant", ctx, tenantID, "", "PUBLISHED", 1000, 0).
			Return(announcements, int64(3), nil).Once()
		mockCache.On("Set", ctx, mock.Anything, mock.Anything, 5*time.Minute).Return(nil).Once()

		result, err := service.GetActiveAnnouncements(ctx, tenantID)

		assert.NoError(t, err)
		assert.Len(t, result, 1) // Only the "Active" one
		assert.Equal(t, "Active", result[0].Title)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()

		mockCache.On("Get", ctx, mock.Anything, mock.Anything).Return(errors.New("cache miss")).Once()
		mockRepo.On("ListByTenant", ctx, tenantID, "", "PUBLISHED", 1000, 0).
			Return(nil, int64(0), errors.New("db error")).Once()

		result, err := service.GetActiveAnnouncements(ctx, tenantID)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_MarkAsRead(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		announcementID := uuid.New()
		userID := uuid.New()
		existing := &models.SystemAnnouncement{
			ID:        announcementID,
			ReadCount: 5,
		}

		mockRepo.On("GetByID", ctx, announcementID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(nil).Once()

		err := service.MarkAsRead(ctx, announcementID, userID)

		assert.NoError(t, err)
		assert.Equal(t, 6, existing.ReadCount)
		mockRepo.AssertExpectations(t)
	})

	t.Run("announcement not found", func(t *testing.T) {
		announcementID := uuid.New()
		userID := uuid.New()

		mockRepo.On("GetByID", ctx, announcementID).Return(nil, errors.New("not found")).Once()

		err := service.MarkAsRead(ctx, announcementID, userID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_IncrementViewCount(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		announcementID := uuid.New()
		existing := &models.SystemAnnouncement{
			ID:        announcementID,
			ViewCount: 100,
		}

		mockRepo.On("GetByID", ctx, announcementID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.SystemAnnouncement")).Return(nil).Once()

		err := service.IncrementViewCount(ctx, announcementID)

		assert.NoError(t, err)
		assert.Equal(t, 101, existing.ViewCount)
		mockRepo.AssertExpectations(t)
	})

	t.Run("announcement not found", func(t *testing.T) {
		announcementID := uuid.New()

		mockRepo.On("GetByID", ctx, announcementID).Return(nil, errors.New("not found")).Once()

		err := service.IncrementViewCount(ctx, announcementID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestSystemAnnouncementService_ListByTenant(t *testing.T) {
	mockRepo := new(MockSystemAnnouncementRepository)
	mockCache := new(MockCacheService)
	service := NewSystemAnnouncementService(mockRepo, mockCache)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.SystemAnnouncement{
			{ID: uuid.New(), Title: "Announcement 1"},
			{ID: uuid.New(), Title: "Announcement 2"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "", "", 10, 0).
			Return(expected, int64(2), nil).Once()

		announcements, total, err := service.ListByTenant(ctx, tenantID, "", "", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, announcements, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("with filters", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.SystemAnnouncement{
			{ID: uuid.New(), Type: "maintenance", Status: "PUBLISHED"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "maintenance", "PUBLISHED", 10, 0).
			Return(expected, int64(1), nil).Once()

		announcements, total, err := service.ListByTenant(ctx, tenantID, "maintenance", "PUBLISHED", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, announcements, 1)
		assert.Equal(t, int64(1), total)
		mockRepo.AssertExpectations(t)
	})
}
