package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang-backend/internal/models"
)

// MockUserConsentRepository is a mock of UserConsentRepository
type MockUserConsentRepository struct {
	mock.Mock
}

func (m *MockUserConsentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UserConsent, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserConsent), args.Error(1)
}

func (m *MockUserConsentRepository) List(ctx context.Context, page, pageSize int, userID *uuid.UUID, documentID *uuid.UUID, withdrawn *bool) ([]*models.UserConsent, int, error) {
	args := m.Called(ctx, page, pageSize, userID, documentID, withdrawn)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*models.UserConsent), args.Int(1), args.Error(2)
}

func (m *MockUserConsentRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]*models.UserConsent, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserConsent), args.Error(1)
}

func (m *MockUserConsentRepository) ListByDocumentID(ctx context.Context, documentID uuid.UUID) ([]*models.UserConsent, error) {
	args := m.Called(ctx, documentID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserConsent), args.Error(1)
}

func (m *MockUserConsentRepository) GetLatestConsent(ctx context.Context, userID, documentID uuid.UUID) (*models.UserConsent, error) {
	args := m.Called(ctx, userID, documentID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserConsent), args.Error(1)
}

func (m *MockUserConsentRepository) Create(ctx context.Context, consent *models.UserConsent) error {
	args := m.Called(ctx, consent)
	return args.Error(0)
}

func (m *MockUserConsentRepository) WithdrawConsent(ctx context.Context, id uuid.UUID, reason string) error {
	args := m.Called(ctx, id, reason)
	return args.Error(0)
}

func (m *MockUserConsentRepository) RenewConsent(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserConsentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserConsentRepository) GetExpiredConsents(ctx context.Context) ([]*models.UserConsent, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserConsent), args.Error(1)
}

func TestUserConsentService_CreateConsent(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success with minimal data", func(t *testing.T) {
		req := &models.CreateUserConsentRequest{
			UserID:          uuid.New(),
			LegalDocumentID: uuid.New(),
			ConsentGiven:    true,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserConsent")).Return(nil).Once()

		consent, err := service.CreateConsent(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, consent)
		assert.True(t, consent.ConsentGiven)
		assert.False(t, consent.Withdrawn)
		assert.False(t, consent.RenewalRequired)
		assert.NotNil(t, consent.ConsentDate)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with full data", func(t *testing.T) {
		expiresAt := time.Now().Add(365 * 24 * time.Hour)
		req := &models.CreateUserConsentRequest{
			UserID:            uuid.New(),
			LegalDocumentID:   uuid.New(),
			ConsentGiven:      true,
			ConsentIP:         "192.168.1.1",
			ConsentUserAgent:  "Mozilla/5.0",
			ConsentMethod:     "click",
			DocumentVersion:   "v1.0",
			DocumentTitle:     "Terms of Service",
			DocumentType:      "TOS",
			ExpiresAt:         &expiresAt,
			SourceApplication: "web",
			SourcePage:        "/signup",
			Metadata:          map[string]interface{}{"custom": "data"},
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserConsent")).Return(nil).Once()

		consent, err := service.CreateConsent(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, consent)
		assert.True(t, consent.ConsentIP.Valid)
		assert.Equal(t, "192.168.1.1", consent.ConsentIP.String)
		assert.True(t, consent.ConsentUserAgent.Valid)
		assert.True(t, consent.ConsentMethod.Valid)
		assert.True(t, consent.DocumentVersion.Valid)
		assert.True(t, consent.ExpiresAt.Valid)
		assert.NotNil(t, consent.Metadata)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - consent not given", func(t *testing.T) {
		req := &models.CreateUserConsentRequest{
			UserID:          uuid.New(),
			LegalDocumentID: uuid.New(),
			ConsentGiven:    false,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserConsent")).Return(nil).Once()

		consent, err := service.CreateConsent(ctx, req)

		assert.NoError(t, err)
		assert.False(t, consent.ConsentGiven)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		req := &models.CreateUserConsentRequest{
			UserID:          uuid.New(),
			LegalDocumentID: uuid.New(),
			ConsentGiven:    true,
		}

		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.UserConsent")).Return(errors.New("db error")).Once()

		consent, err := service.CreateConsent(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, consent)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_GetConsent(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		consentID := uuid.New()
		expected := &models.UserConsent{
			ID:           consentID,
			ConsentGiven: true,
			Withdrawn:    false,
		}

		mockRepo.On("GetByID", ctx, consentID).Return(expected, nil).Once()

		consent, err := service.GetConsent(ctx, consentID)

		assert.NoError(t, err)
		assert.NotNil(t, consent)
		assert.Equal(t, consentID, consent.ID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		consentID := uuid.New()
		mockRepo.On("GetByID", ctx, consentID).Return(nil, errors.New("not found")).Once()

		consent, err := service.GetConsent(ctx, consentID)

		assert.Error(t, err)
		assert.Nil(t, consent)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_ListConsents(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success - no filters", func(t *testing.T) {
		expected := []*models.UserConsent{
			{ID: uuid.New()},
			{ID: uuid.New()},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*bool)(nil)).
			Return(expected, 2, nil).Once()

		consents, total, err := service.ListConsents(ctx, 1, 10, nil, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, consents, 2)
		assert.Equal(t, 2, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with user filter", func(t *testing.T) {
		userID := uuid.New()
		expected := []*models.UserConsent{
			{ID: uuid.New(), UserID: userID},
		}

		mockRepo.On("List", ctx, 1, 10, &userID, (*uuid.UUID)(nil), (*bool)(nil)).
			Return(expected, 1, nil).Once()

		consents, total, err := service.ListConsents(ctx, 1, 10, &userID, nil, nil)

		assert.NoError(t, err)
		assert.Len(t, consents, 1)
		assert.Equal(t, 1, total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success - with withdrawn filter", func(t *testing.T) {
		withdrawn := false
		expected := []*models.UserConsent{
			{ID: uuid.New(), Withdrawn: false},
		}

		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), &withdrawn).
			Return(expected, 1, nil).Once()

		consents, total, err := service.ListConsents(ctx, 1, 10, nil, nil, &withdrawn)

		assert.NoError(t, err)
		assert.Len(t, consents, 1)
		mockRepo.AssertExpectations(t)
	})

	t.Run("auto-correct page and page size", func(t *testing.T) {
		mockRepo.On("List", ctx, 1, 10, (*uuid.UUID)(nil), (*uuid.UUID)(nil), (*bool)(nil)).
			Return([]*models.UserConsent{}, 0, nil).Once()

		// Invalid page/size should be corrected
		_, _, err := service.ListConsents(ctx, 0, 200, nil, nil, nil)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_ListConsentsByUser(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		expected := []*models.UserConsent{
			{ID: uuid.New(), UserID: userID},
			{ID: uuid.New(), UserID: userID},
		}

		mockRepo.On("ListByUserID", ctx, userID).Return(expected, nil).Once()

		consents, err := service.ListConsentsByUser(ctx, userID)

		assert.NoError(t, err)
		assert.Len(t, consents, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		userID := uuid.New()
		mockRepo.On("ListByUserID", ctx, userID).Return([]*models.UserConsent{}, nil).Once()

		consents, err := service.ListConsentsByUser(ctx, userID)

		assert.NoError(t, err)
		assert.Len(t, consents, 0)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_ListConsentsByDocument(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		documentID := uuid.New()
		expected := []*models.UserConsent{
			{ID: uuid.New(), LegalDocumentID: documentID},
			{ID: uuid.New(), LegalDocumentID: documentID},
		}

		mockRepo.On("ListByDocumentID", ctx, documentID).Return(expected, nil).Once()

		consents, err := service.ListConsentsByDocument(ctx, documentID)

		assert.NoError(t, err)
		assert.Len(t, consents, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_GetLatestConsent(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		documentID := uuid.New()
		expected := &models.UserConsent{
			ID:              uuid.New(),
			UserID:          userID,
			LegalDocumentID: documentID,
			ConsentDate:     time.Now(),
		}

		mockRepo.On("GetLatestConsent", ctx, userID, documentID).Return(expected, nil).Once()

		consent, err := service.GetLatestConsent(ctx, userID, documentID)

		assert.NoError(t, err)
		assert.NotNil(t, consent)
		assert.Equal(t, userID, consent.UserID)
		assert.Equal(t, documentID, consent.LegalDocumentID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		userID := uuid.New()
		documentID := uuid.New()

		mockRepo.On("GetLatestConsent", ctx, userID, documentID).Return(nil, errors.New("not found")).Once()

		consent, err := service.GetLatestConsent(ctx, userID, documentID)

		assert.Error(t, err)
		assert.Nil(t, consent)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_WithdrawConsent(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success with reason", func(t *testing.T) {
		consentID := uuid.New()
		reason := "User requested deletion"

		mockRepo.On("WithdrawConsent", ctx, consentID, reason).Return(nil).Once()

		err := service.WithdrawConsent(ctx, consentID, reason)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success without reason", func(t *testing.T) {
		consentID := uuid.New()

		mockRepo.On("WithdrawConsent", ctx, consentID, "").Return(nil).Once()

		err := service.WithdrawConsent(ctx, consentID, "")

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		consentID := uuid.New()

		mockRepo.On("WithdrawConsent", ctx, consentID, "").Return(errors.New("db error")).Once()

		err := service.WithdrawConsent(ctx, consentID, "")

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_RenewConsent(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		consentID := uuid.New()

		mockRepo.On("RenewConsent", ctx, consentID).Return(nil).Once()

		err := service.RenewConsent(ctx, consentID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		consentID := uuid.New()

		mockRepo.On("RenewConsent", ctx, consentID).Return(errors.New("db error")).Once()

		err := service.RenewConsent(ctx, consentID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_DeleteConsent(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		consentID := uuid.New()

		mockRepo.On("Delete", ctx, consentID).Return(nil).Once()

		err := service.DeleteConsent(ctx, consentID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		consentID := uuid.New()

		mockRepo.On("Delete", ctx, consentID).Return(errors.New("db error")).Once()

		err := service.DeleteConsent(ctx, consentID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestUserConsentService_GetExpiredConsents(t *testing.T) {
	mockRepo := new(MockUserConsentRepository)
	service := NewUserConsentService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		pastTime := time.Now().Add(-1 * time.Hour)
		expected := []*models.UserConsent{
			{ID: uuid.New(), ExpiresAt: models.NullTime{Time: pastTime, Valid: true}},
			{ID: uuid.New(), ExpiresAt: models.NullTime{Time: pastTime, Valid: true}},
		}

		mockRepo.On("GetExpiredConsents", ctx).Return(expected, nil).Once()

		consents, err := service.GetExpiredConsents(ctx)

		assert.NoError(t, err)
		assert.Len(t, consents, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("empty result", func(t *testing.T) {
		mockRepo.On("GetExpiredConsents", ctx).Return([]*models.UserConsent{}, nil).Once()

		consents, err := service.GetExpiredConsents(ctx)

		assert.NoError(t, err)
		assert.Len(t, consents, 0)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.On("GetExpiredConsents", ctx).Return(nil, errors.New("db error")).Once()

		consents, err := service.GetExpiredConsents(ctx)

		assert.Error(t, err)
		assert.Nil(t, consents)
		mockRepo.AssertExpectations(t)
	})
}
