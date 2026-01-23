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

// MockLegalDocumentRepository is a mock of LegalDocumentRepository
type MockLegalDocumentRepository struct {
	mock.Mock
}

func (m *MockLegalDocumentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.LegalDocument, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LegalDocument), args.Error(1)
}

func (m *MockLegalDocumentRepository) GetBySlug(ctx context.Context, slug string) (*models.LegalDocument, error) {
	args := m.Called(ctx, slug)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LegalDocument), args.Error(1)
}

func (m *MockLegalDocumentRepository) GetLatestByType(ctx context.Context, docType string) (*models.LegalDocument, error) {
	args := m.Called(ctx, docType)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.LegalDocument), args.Error(1)
}

func (m *MockLegalDocumentRepository) List(ctx context.Context, tenantID *uuid.UUID, docType, status string, limit, offset int) ([]*models.LegalDocument, int64, error) {
	args := m.Called(ctx, tenantID, docType, status, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.LegalDocument), args.Get(1).(int64), args.Error(2)
}

func (m *MockLegalDocumentRepository) Create(ctx context.Context, doc *models.LegalDocument) error {
	args := m.Called(ctx, doc)
	return args.Error(0)
}

func (m *MockLegalDocumentRepository) Update(ctx context.Context, doc *models.LegalDocument) error {
	args := m.Called(ctx, doc)
	return args.Error(0)
}

func (m *MockLegalDocumentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

// MockUserConsentRepository is a mock of UserConsentRepository
type MockUserConsentRepository struct {
	mock.Mock
}

func (m *MockUserConsentRepository) GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.UserConsent, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.UserConsent), args.Error(1)
}

func (m *MockUserConsentRepository) Create(ctx context.Context, consent *models.UserConsent) error {
	args := m.Called(ctx, consent)
	return args.Error(0)
}

func TestLegalDocumentService_GetByID(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		docID := uuid.New()
		expectedDoc := &models.LegalDocument{
			ID:    docID,
			Title: "Terms of Service",
			Slug:  "terms-of-service",
			Type:  "TOS",
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(expectedDoc, nil).Once()

		doc, err := service.GetByID(ctx, docID)

		assert.NoError(t, err)
		assert.NotNil(t, doc)
		assert.Equal(t, "Terms of Service", doc.Title)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		docID := uuid.New()
		mockDocRepo.On("GetByID", ctx, docID).Return(nil, errors.New("not found")).Once()

		doc, err := service.GetByID(ctx, docID)

		assert.Error(t, err)
		assert.Nil(t, doc)
		mockDocRepo.AssertExpectations(t)
	})
}

func TestLegalDocumentService_CreateDocument(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)
	ctx := context.Background()

	t.Run("success with defaults", func(t *testing.T) {
		userID := uuid.New()
		req := CreateLegalDocumentRequest{
			Title:     "Privacy Policy",
			Slug:      "privacy-policy",
			Type:      "PRIVACY",
			Content:   "Privacy policy content",
			CreatedBy: userID,
		}

		mockDocRepo.On("GetBySlug", ctx, "privacy-policy").Return(nil, errors.New("not found")).Once()
		mockDocRepo.On("Create", ctx, mock.AnythingOfType("*models.LegalDocument")).Return(nil).Once()

		doc, err := service.CreateDocument(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, doc)
		assert.Equal(t, "Privacy Policy", doc.Title)
		assert.Equal(t, "1.0", doc.Version)
		assert.Equal(t, "vi-VN", doc.Language)
		assert.Equal(t, "GLOBAL", doc.Scope)
		assert.Equal(t, "DRAFT", doc.Status)
		assert.False(t, doc.IsPublished)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("success with custom values", func(t *testing.T) {
		userID := uuid.New()
		tenantID := uuid.New()
		req := CreateLegalDocumentRequest{
			Title:     "Terms of Service",
			Slug:      "tos",
			Type:      "TOS",
			Version:   "2.0",
			Content:   "TOS content",
			Language:  "en-US",
			Scope:     "TENANT",
			TenantID:  &tenantID,
			CreatedBy: userID,
		}

		mockDocRepo.On("GetBySlug", ctx, "tos").Return(nil, errors.New("not found")).Once()
		mockDocRepo.On("Create", ctx, mock.AnythingOfType("*models.LegalDocument")).Return(nil).Once()

		doc, err := service.CreateDocument(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, doc)
		assert.Equal(t, "2.0", doc.Version)
		assert.Equal(t, "en-US", doc.Language)
		assert.Equal(t, "TENANT", doc.Scope)
		assert.Equal(t, &tenantID, doc.TenantID)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("duplicate slug", func(t *testing.T) {
		userID := uuid.New()
		req := CreateLegalDocumentRequest{
			Title:     "Privacy Policy",
			Slug:      "privacy-policy",
			Type:      "PRIVACY",
			Content:   "Content",
			CreatedBy: userID,
		}

		existingDoc := &models.LegalDocument{ID: uuid.New(), Slug: "privacy-policy"}
		mockDocRepo.On("GetBySlug", ctx, "privacy-policy").Return(existingDoc, nil).Once()

		doc, err := service.CreateDocument(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, doc)
		assert.Contains(t, err.Error(), "already exists")
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		userID := uuid.New()
		req := CreateLegalDocumentRequest{
			Title:     "Privacy Policy",
			Slug:      "privacy-policy",
			Type:      "PRIVACY",
			Content:   "Content",
			CreatedBy: userID,
		}

		mockDocRepo.On("GetBySlug", ctx, "privacy-policy").Return(nil, errors.New("not found")).Once()
		mockDocRepo.On("Create", ctx, mock.AnythingOfType("*models.LegalDocument")).Return(errors.New("db error")).Once()

		doc, err := service.CreateDocument(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, doc)
		mockDocRepo.AssertExpectations(t)
	})
}

func TestLegalDocumentService_UpdateDocument(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		docID := uuid.New()
		userID := uuid.New()
		existingDoc := &models.LegalDocument{
			ID:      docID,
			Title:   "Old Title",
			Status:  "DRAFT",
			Version: 1,
		}

		newTitle := "New Title"
		req := UpdateLegalDocumentRequest{
			Title:     &newTitle,
			UpdatedBy: userID,
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(existingDoc, nil).Once()
		mockDocRepo.On("Update", ctx, mock.AnythingOfType("*models.LegalDocument")).Return(nil).Once()

		doc, err := service.UpdateDocument(ctx, docID, req)

		assert.NoError(t, err)
		assert.NotNil(t, doc)
		assert.Equal(t, "New Title", doc.Title)
		assert.Equal(t, 2, doc.Version)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("document not found", func(t *testing.T) {
		docID := uuid.New()
		userID := uuid.New()
		req := UpdateLegalDocumentRequest{UpdatedBy: userID}

		mockDocRepo.On("GetByID", ctx, docID).Return(nil, errors.New("not found")).Once()

		doc, err := service.UpdateDocument(ctx, docID, req)

		assert.Error(t, err)
		assert.Nil(t, doc)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("cannot update published document", func(t *testing.T) {
		docID := uuid.New()
		userID := uuid.New()
		existingDoc := &models.LegalDocument{
			ID:     docID,
			Status: "PUBLISHED",
		}

		req := UpdateLegalDocumentRequest{UpdatedBy: userID}

		mockDocRepo.On("GetByID", ctx, docID).Return(existingDoc, nil).Once()

		doc, err := service.UpdateDocument(ctx, docID, req)

		assert.Error(t, err)
		assert.Nil(t, doc)
		assert.Contains(t, err.Error(), "cannot update published document")
		mockDocRepo.AssertExpectations(t)
	})
}

func TestLegalDocumentService_PublishDocument(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		docID := uuid.New()
		userID := uuid.New()
		existingDoc := &models.LegalDocument{
			ID:      docID,
			Title:   "Privacy Policy",
			Status:  "DRAFT",
			Version: 1,
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(existingDoc, nil).Once()
		mockDocRepo.On("Update", ctx, mock.AnythingOfType("*models.LegalDocument")).Return(nil).Once()

		doc, err := service.PublishDocument(ctx, docID, userID)

		assert.NoError(t, err)
		assert.NotNil(t, doc)
		assert.Equal(t, "PUBLISHED", doc.Status)
		assert.True(t, doc.IsPublished)
		assert.NotNil(t, doc.PublishedAt)
		assert.Equal(t, &userID, doc.PublishedBy)
		assert.Equal(t, 2, doc.Version)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("already published", func(t *testing.T) {
		docID := uuid.New()
		userID := uuid.New()
		now := time.Now()
		existingDoc := &models.LegalDocument{
			ID:          docID,
			Status:      "PUBLISHED",
			IsPublished: true,
			PublishedAt: &now,
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(existingDoc, nil).Once()

		doc, err := service.PublishDocument(ctx, docID, userID)

		assert.NoError(t, err)
		assert.NotNil(t, doc)
		assert.Equal(t, "PUBLISHED", doc.Status)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("document not found", func(t *testing.T) {
		docID := uuid.New()
		userID := uuid.New()

		mockDocRepo.On("GetByID", ctx, docID).Return(nil, errors.New("not found")).Once()

		doc, err := service.PublishDocument(ctx, docID, userID)

		assert.Error(t, err)
		assert.Nil(t, doc)
		mockDocRepo.AssertExpectations(t)
	})
}

func TestLegalDocumentService_DeleteDocument(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		docID := uuid.New()
		existingDoc := &models.LegalDocument{
			ID:     docID,
			Status: "DRAFT",
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(existingDoc, nil).Once()
		mockDocRepo.On("Delete", ctx, docID).Return(nil).Once()

		err := service.DeleteDocument(ctx, docID)

		assert.NoError(t, err)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("cannot delete published", func(t *testing.T) {
		docID := uuid.New()
		existingDoc := &models.LegalDocument{
			ID:     docID,
			Status: "PUBLISHED",
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(existingDoc, nil).Once()

		err := service.DeleteDocument(ctx, docID)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "cannot delete published document")
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("document not found", func(t *testing.T) {
		docID := uuid.New()

		mockDocRepo.On("GetByID", ctx, docID).Return(nil, errors.New("not found")).Once()

		err := service.DeleteDocument(ctx, docID)

		assert.Error(t, err)
		mockDocRepo.AssertExpectations(t)
	})
}

func TestLegalDocumentService_ArchiveDocument(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		docID := uuid.New()
		existingDoc := &models.LegalDocument{
			ID:          docID,
			Status:      "PUBLISHED",
			IsPublished: true,
			Version:     1,
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(existingDoc, nil).Once()
		mockDocRepo.On("Update", ctx, mock.AnythingOfType("*models.LegalDocument")).Return(nil).Once()

		doc, err := service.ArchiveDocument(ctx, docID)

		assert.NoError(t, err)
		assert.NotNil(t, doc)
		assert.Equal(t, "ARCHIVED", doc.Status)
		assert.False(t, doc.IsPublished)
		assert.Equal(t, 2, doc.Version)
		mockDocRepo.AssertExpectations(t)
	})

	t.Run("document not found", func(t *testing.T) {
		docID := uuid.New()

		mockDocRepo.On("GetByID", ctx, docID).Return(nil, errors.New("not found")).Once()

		doc, err := service.ArchiveDocument(ctx, docID)

		assert.Error(t, err)
		assert.Nil(t, doc)
		mockDocRepo.AssertExpectations(t)
	})
}

func TestLegalDocumentService_RecordConsent(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		userID := uuid.New()
		docID := uuid.New()
		doc := &models.LegalDocument{
			ID:      docID,
			Version: 1,
		}

		req := CreateUserConsentRequest{
			UserID:          userID,
			LegalDocumentID: docID,
			ConsentGiven:    true,
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(doc, nil).Once()
		mockConsentRepo.On("Create", ctx, mock.AnythingOfType("*models.UserConsent")).Return(nil).Once()

		consent, err := service.RecordConsent(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, consent)
		assert.True(t, consent.ConsentGiven)
		assert.Equal(t, userID, consent.UserID)
		assert.Equal(t, docID, consent.LegalDocumentID)
		mockDocRepo.AssertExpectations(t)
		mockConsentRepo.AssertExpectations(t)
	})

	t.Run("document not found", func(t *testing.T) {
		userID := uuid.New()
		docID := uuid.New()

		req := CreateUserConsentRequest{
			UserID:          userID,
			LegalDocumentID: docID,
			ConsentGiven:    true,
		}

		mockDocRepo.On("GetByID", ctx, docID).Return(nil, errors.New("not found")).Once()

		consent, err := service.RecordConsent(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, consent)
		mockDocRepo.AssertExpectations(t)
	})
}

func TestLegalDocumentService_CheckUserConsent(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)
	ctx := context.Background()

	t.Run("user has consented", func(t *testing.T) {
		userID := uuid.New()
		docID := uuid.New()

		doc := &models.LegalDocument{
			ID:   docID,
			Type: "TOS",
		}

		consents := []*models.UserConsent{
			{
				ID:              uuid.New(),
				UserID:          userID,
				LegalDocumentID: docID,
				ConsentGiven:    true,
				RevokedDate:     nil,
			},
		}

		mockDocRepo.On("GetLatestByType", ctx, "TOS").Return(doc, nil).Once()
		mockConsentRepo.On("GetByUser", ctx, userID).Return(consents, nil).Once()

		hasConsented, err := service.CheckUserConsent(ctx, userID, "TOS")

		assert.NoError(t, err)
		assert.True(t, hasConsented)
		mockDocRepo.AssertExpectations(t)
		mockConsentRepo.AssertExpectations(t)
	})

	t.Run("user has not consented", func(t *testing.T) {
		userID := uuid.New()
		docID := uuid.New()

		doc := &models.LegalDocument{
			ID:   docID,
			Type: "TOS",
		}

		consents := []*models.UserConsent{}

		mockDocRepo.On("GetLatestByType", ctx, "TOS").Return(doc, nil).Once()
		mockConsentRepo.On("GetByUser", ctx, userID).Return(consents, nil).Once()

		hasConsented, err := service.CheckUserConsent(ctx, userID, "TOS")

		assert.NoError(t, err)
		assert.False(t, hasConsented)
		mockDocRepo.AssertExpectations(t)
		mockConsentRepo.AssertExpectations(t)
	})

	t.Run("user revoked consent", func(t *testing.T) {
		userID := uuid.New()
		docID := uuid.New()
		revokedDate := time.Now()

		doc := &models.LegalDocument{
			ID:   docID,
			Type: "TOS",
		}

		consents := []*models.UserConsent{
			{
				ID:              uuid.New(),
				UserID:          userID,
				LegalDocumentID: docID,
				ConsentGiven:    true,
				RevokedDate:     &revokedDate,
			},
		}

		mockDocRepo.On("GetLatestByType", ctx, "TOS").Return(doc, nil).Once()
		mockConsentRepo.On("GetByUser", ctx, userID).Return(consents, nil).Once()

		hasConsented, err := service.CheckUserConsent(ctx, userID, "TOS")

		assert.NoError(t, err)
		assert.False(t, hasConsented)
		mockDocRepo.AssertExpectations(t)
		mockConsentRepo.AssertExpectations(t)
	})

	t.Run("document not found", func(t *testing.T) {
		userID := uuid.New()

		mockDocRepo.On("GetLatestByType", ctx, "TOS").Return(nil, errors.New("not found")).Once()

		hasConsented, err := service.CheckUserConsent(ctx, userID, "TOS")

		assert.Error(t, err)
		assert.False(t, hasConsented)
		mockDocRepo.AssertExpectations(t)
	})
}

func TestLegalDocumentService_GenerateSlug(t *testing.T) {
	mockDocRepo := new(MockLegalDocumentRepository)
	mockConsentRepo := new(MockUserConsentRepository)
	service := NewLegalDocumentService(mockDocRepo, mockConsentRepo)

	t.Run("generate slug from title", func(t *testing.T) {
		slug := service.GenerateSlug("Privacy Policy")
		assert.Equal(t, "privacy-policy", slug)
	})

	t.Run("replace underscores", func(t *testing.T) {
		slug := service.GenerateSlug("Terms_Of_Service")
		assert.Equal(t, "terms-of-service", slug)
	})

	t.Run("lowercase conversion", func(t *testing.T) {
		slug := service.GenerateSlug("PRIVACY POLICY")
		assert.Equal(t, "privacy-policy", slug)
	})
}
