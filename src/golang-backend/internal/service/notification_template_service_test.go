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

// MockNotificationTemplateRepository is a mock of NotificationTemplateRepository
type MockNotificationTemplateRepository struct {
	mock.Mock
}

func (m *MockNotificationTemplateRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.NotificationTemplate, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.NotificationTemplate), args.Error(1)
}

func (m *MockNotificationTemplateRepository) GetByCode(ctx context.Context, code string) (*models.NotificationTemplate, error) {
	args := m.Called(ctx, code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.NotificationTemplate), args.Error(1)
}

func (m *MockNotificationTemplateRepository) ListByTenant(ctx context.Context, tenantID uuid.UUID, channel string, limit, offset int) ([]*models.NotificationTemplate, int64, error) {
	args := m.Called(ctx, tenantID, channel, limit, offset)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]*models.NotificationTemplate), args.Get(1).(int64), args.Error(2)
}

func (m *MockNotificationTemplateRepository) Create(ctx context.Context, template *models.NotificationTemplate) error {
	args := m.Called(ctx, template)
	return args.Error(0)
}

func (m *MockNotificationTemplateRepository) Update(ctx context.Context, template *models.NotificationTemplate) error {
	args := m.Called(ctx, template)
	return args.Error(0)
}

func (m *MockNotificationTemplateRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestNotificationTemplateService_GetByID(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		templateID := uuid.New()
		expectedTemplate := &models.NotificationTemplate{
			ID:           templateID,
			TemplateCode: "WELCOME_EMAIL",
			TemplateName: "Welcome Email",
			Channel:      "EMAIL",
		}

		mockRepo.On("GetByID", ctx, templateID).Return(expectedTemplate, nil).Once()

		template, err := service.GetByID(ctx, templateID)

		assert.NoError(t, err)
		assert.NotNil(t, template)
		assert.Equal(t, "WELCOME_EMAIL", template.TemplateCode)
		mockRepo.AssertExpectations(t)
	})

	t.Run("not found", func(t *testing.T) {
		templateID := uuid.New()
		mockRepo.On("GetByID", ctx, templateID).Return(nil, errors.New("not found")).Once()

		template, err := service.GetByID(ctx, templateID)

		assert.Error(t, err)
		assert.Nil(t, template)
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationTemplateService_CreateTemplate(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)
	ctx := context.Background()

	t.Run("success with email channel", func(t *testing.T) {
		tenantID := uuid.New()
		subject := "Welcome to {{company}}"
		req := CreateNotificationTemplateRequest{
			TenantID:     tenantID,
			TemplateCode: "WELCOME_EMAIL",
			TemplateName: "Welcome Email",
			Channel:      "EMAIL",
			Subject:      &subject,
			BodyTemplate: "Hello {{name}}, welcome to {{company}}!",
			Variables:    []string{"name", "company"},
			IsActive:     true,
			CreatedBy:    "admin",
		}

		mockRepo.On("GetByCode", ctx, "WELCOME_EMAIL").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.NotificationTemplate")).Return(nil).Once()

		template, err := service.CreateTemplate(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, template)
		assert.Equal(t, "WELCOME_EMAIL", template.TemplateCode)
		assert.Equal(t, "EMAIL", template.Channel)
		assert.Equal(t, "vi-VN", template.Language)
		assert.Equal(t, "normal", template.Priority)
		assert.Equal(t, 1, template.VersionNumber)
		mockRepo.AssertExpectations(t)
	})

	t.Run("success with sms channel", func(t *testing.T) {
		tenantID := uuid.New()
		smsTemplate := "Your OTP is {{code}}"
		req := CreateNotificationTemplateRequest{
			TenantID:     tenantID,
			TemplateCode: "OTP_SMS",
			TemplateName: "OTP SMS",
			Channel:      "SMS",
			BodyTemplate: "Verification",
			SMSTemplate:  &smsTemplate,
			IsActive:     true,
			CreatedBy:    "admin",
		}

		mockRepo.On("GetByCode", ctx, "OTP_SMS").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.NotificationTemplate")).Return(nil).Once()

		template, err := service.CreateTemplate(ctx, req)

		assert.NoError(t, err)
		assert.NotNil(t, template)
		assert.Equal(t, "SMS", template.Channel)
		mockRepo.AssertExpectations(t)
	})

	t.Run("invalid channel", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateNotificationTemplateRequest{
			TenantID:     tenantID,
			TemplateCode: "TEST",
			TemplateName: "Test",
			Channel:      "INVALID",
			BodyTemplate: "Test",
			CreatedBy:    "admin",
		}

		template, err := service.CreateTemplate(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, template)
		assert.Contains(t, err.Error(), "invalid channel")
		mockRepo.AssertExpectations(t)
	})

	t.Run("duplicate code", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateNotificationTemplateRequest{
			TenantID:     tenantID,
			TemplateCode: "WELCOME_EMAIL",
			TemplateName: "Welcome",
			Channel:      "EMAIL",
			BodyTemplate: "Welcome",
			CreatedBy:    "admin",
		}

		existing := &models.NotificationTemplate{ID: uuid.New(), TemplateCode: "WELCOME_EMAIL"}
		mockRepo.On("GetByCode", ctx, "WELCOME_EMAIL").Return(existing, nil).Once()

		template, err := service.CreateTemplate(ctx, req)

		assert.Error(t, err)
		assert.Nil(t, template)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})

	t.Run("with custom values", func(t *testing.T) {
		tenantID := uuid.New()
		req := CreateNotificationTemplateRequest{
			TenantID:      tenantID,
			TemplateCode:  "TEST",
			TemplateName:  "Test",
			Channel:       "EMAIL",
			BodyTemplate:  "Test",
			Language:      "en-US",
			Priority:      "high",
			VersionNumber: 2,
			IsActive:      true,
			CreatedBy:     "admin",
		}

		mockRepo.On("GetByCode", ctx, "TEST").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.NotificationTemplate")).Return(nil).Once()

		template, err := service.CreateTemplate(ctx, req)

		assert.NoError(t, err)
		assert.Equal(t, "en-US", template.Language)
		assert.Equal(t, "high", template.Priority)
		assert.Equal(t, 2, template.VersionNumber)
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationTemplateService_UpdateTemplate(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		templateID := uuid.New()
		existing := &models.NotificationTemplate{
			ID:           templateID,
			TemplateCode: "WELCOME_EMAIL",
			TemplateName: "Old Name",
			Channel:      "EMAIL",
			IsActive:     true,
		}

		newName := "New Welcome Email"
		isActive := false
		req := UpdateNotificationTemplateRequest{
			TemplateName: &newName,
			IsActive:     &isActive,
			UpdatedBy:    "admin",
		}

		mockRepo.On("GetByID", ctx, templateID).Return(existing, nil).Once()
		mockRepo.On("Update", ctx, mock.AnythingOfType("*models.NotificationTemplate")).Return(nil).Once()

		template, err := service.UpdateTemplate(ctx, templateID, req)

		assert.NoError(t, err)
		assert.NotNil(t, template)
		assert.Equal(t, "New Welcome Email", template.TemplateName)
		assert.False(t, template.IsActive)
		mockRepo.AssertExpectations(t)
	})

	t.Run("template not found", func(t *testing.T) {
		templateID := uuid.New()
		req := UpdateNotificationTemplateRequest{UpdatedBy: "admin"}

		mockRepo.On("GetByID", ctx, templateID).Return(nil, errors.New("not found")).Once()

		template, err := service.UpdateTemplate(ctx, templateID, req)

		assert.Error(t, err)
		assert.Nil(t, template)
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationTemplateService_RenderTemplate(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)
	ctx := context.Background()

	t.Run("success - render email template", func(t *testing.T) {
		subject := "Welcome {{name}}"
		template := &models.NotificationTemplate{
			ID:           uuid.New(),
			TemplateCode: "WELCOME_EMAIL",
			Channel:      "EMAIL",
			Subject:      &subject,
			BodyTemplate: "Hello {{name}}, welcome to {{company}}!",
			DefaultValues: map[string]interface{}{
				"company": "VHV Platform",
			},
			IsActive: true,
		}

		mockRepo.On("GetByCode", ctx, "WELCOME_EMAIL").Return(template, nil).Once()

		result, err := service.RenderTemplate(ctx, "WELCOME_EMAIL", map[string]interface{}{
			"name": "John",
		}, "vi-VN")

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "Welcome John", result["subject"])
		assert.Equal(t, "Hello John, welcome to VHV Platform!", result["body"])
		mockRepo.AssertExpectations(t)
	})

	t.Run("inactive template", func(t *testing.T) {
		template := &models.NotificationTemplate{
			ID:           uuid.New(),
			TemplateCode: "INACTIVE",
			BodyTemplate: "Test",
			IsActive:     false,
		}

		mockRepo.On("GetByCode", ctx, "INACTIVE").Return(template, nil).Once()

		result, err := service.RenderTemplate(ctx, "INACTIVE", nil, "vi-VN")

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "not active")
		mockRepo.AssertExpectations(t)
	})

	t.Run("template not found", func(t *testing.T) {
		mockRepo.On("GetByCode", ctx, "UNKNOWN").Return(nil, errors.New("not found")).Once()

		result, err := service.RenderTemplate(ctx, "UNKNOWN", nil, "vi-VN")

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})

	t.Run("render with default values", func(t *testing.T) {
		template := &models.NotificationTemplate{
			ID:           uuid.New(),
			TemplateCode: "TEST",
			BodyTemplate: "Hello {{name}}, {{greeting}}",
			DefaultValues: map[string]interface{}{
				"greeting": "Welcome!",
			},
			IsActive: true,
		}

		mockRepo.On("GetByCode", ctx, "TEST").Return(template, nil).Once()

		result, err := service.RenderTemplate(ctx, "TEST", map[string]interface{}{
			"name": "Alice",
		}, "vi-VN")

		assert.NoError(t, err)
		assert.Contains(t, result["body"], "Alice")
		assert.Contains(t, result["body"], "Welcome!")
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationTemplateService_PreviewTemplate(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		templateID := uuid.New()
		template := &models.NotificationTemplate{
			ID:           templateID,
			TemplateCode: "WELCOME",
			TemplateeName: "Welcome",
			BodyTemplate: "Hello {{name}}",
			Language:     "vi-VN",
			IsActive:     true,
		}

		mockRepo.On("GetByID", ctx, templateID).Return(template, nil).Once()
		mockRepo.On("GetByCode", ctx, "WELCOME").Return(template, nil).Once()

		result, err := service.PreviewTemplate(ctx, templateID, map[string]interface{}{
			"name": "Test User",
		})

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result["body"], "Test User")
		mockRepo.AssertExpectations(t)
	})

	t.Run("template not found", func(t *testing.T) {
		templateID := uuid.New()
		mockRepo.On("GetByID", ctx, templateID).Return(nil, errors.New("not found")).Once()

		result, err := service.PreviewTemplate(ctx, templateID, nil)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationTemplateService_CloneTemplate(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		originalID := uuid.New()
		original := &models.NotificationTemplate{
			ID:           originalID,
			TenantID:     uuid.New(),
			TemplateCode: "ORIGINAL",
			TemplateName: "Original Template",
			Channel:      "EMAIL",
			BodyTemplate: "Original body",
			IsActive:     true,
		}

		mockRepo.On("GetByID", ctx, originalID).Return(original, nil).Once()
		mockRepo.On("GetByCode", ctx, "CLONED").Return(nil, errors.New("not found")).Once()
		mockRepo.On("Create", ctx, mock.AnythingOfType("*models.NotificationTemplate")).Return(nil).Once()

		clone, err := service.CloneTemplate(ctx, originalID, "CLONED", "Cloned Template", "admin")

		assert.NoError(t, err)
		assert.NotNil(t, clone)
		assert.Equal(t, "CLONED", clone.TemplateCode)
		assert.Equal(t, "Cloned Template", clone.TemplateName)
		assert.Equal(t, original.Channel, clone.Channel)
		assert.Equal(t, original.BodyTemplate, clone.BodyTemplate)
		assert.Equal(t, &originalID, clone.ParentTemplateID)
		assert.False(t, clone.IsActive)
		assert.Equal(t, 1, clone.VersionNumber)
		mockRepo.AssertExpectations(t)
	})

	t.Run("original not found", func(t *testing.T) {
		originalID := uuid.New()
		mockRepo.On("GetByID", ctx, originalID).Return(nil, errors.New("not found")).Once()

		clone, err := service.CloneTemplate(ctx, originalID, "CLONED", "Cloned", "admin")

		assert.Error(t, err)
		assert.Nil(t, clone)
		mockRepo.AssertExpectations(t)
	})

	t.Run("new code already exists", func(t *testing.T) {
		originalID := uuid.New()
		original := &models.NotificationTemplate{ID: originalID, TemplateCode: "ORIGINAL"}
		existing := &models.NotificationTemplate{ID: uuid.New(), TemplateCode: "CLONED"}

		mockRepo.On("GetByID", ctx, originalID).Return(original, nil).Once()
		mockRepo.On("GetByCode", ctx, "CLONED").Return(existing, nil).Once()

		clone, err := service.CloneTemplate(ctx, originalID, "CLONED", "Cloned", "admin")

		assert.Error(t, err)
		assert.Nil(t, clone)
		assert.Contains(t, err.Error(), "already exists")
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationTemplateService_DeleteTemplate(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		templateID := uuid.New()
		mockRepo.On("Delete", ctx, templateID).Return(nil).Once()

		err := service.DeleteTemplate(ctx, templateID)

		assert.NoError(t, err)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		templateID := uuid.New()
		mockRepo.On("Delete", ctx, templateID).Return(errors.New("db error")).Once()

		err := service.DeleteTemplate(ctx, templateID)

		assert.Error(t, err)
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationTemplateService_ListByTenant(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)
	ctx := context.Background()

	t.Run("success", func(t *testing.T) {
		tenantID := uuid.New()
		expected := []*models.NotificationTemplate{
			{ID: uuid.New(), TemplateCode: "TPL1", Channel: "EMAIL"},
			{ID: uuid.New(), TemplateCode: "TPL2", Channel: "EMAIL"},
		}

		mockRepo.On("ListByTenant", ctx, tenantID, "EMAIL", 10, 0).Return(expected, int64(2), nil).Once()

		templates, total, err := service.ListByTenant(ctx, tenantID, "EMAIL", 1, 10)

		assert.NoError(t, err)
		assert.Len(t, templates, 2)
		assert.Equal(t, int64(2), total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("repository error", func(t *testing.T) {
		tenantID := uuid.New()
		mockRepo.On("ListByTenant", ctx, tenantID, "", 10, 0).Return(nil, int64(0), errors.New("db error")).Once()

		templates, total, err := service.ListByTenant(ctx, tenantID, "", 1, 10)

		assert.Error(t, err)
		assert.Nil(t, templates)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

func TestNotificationTemplateService_RenderString(t *testing.T) {
	mockRepo := new(MockNotificationTemplateRepository)
	service := NewNotificationTemplateService(mockRepo)

	t.Run("simple substitution", func(t *testing.T) {
		template := "Hello {{name}}"
		vars := map[string]interface{}{
			"name": "John",
		}

		result := service.renderString(template, vars)

		assert.Equal(t, "Hello John", result)
	})

	t.Run("multiple substitutions", func(t *testing.T) {
		template := "Hello {{name}}, welcome to {{company}}!"
		vars := map[string]interface{}{
			"name":    "Alice",
			"company": "VHV",
		}

		result := service.renderString(template, vars)

		assert.Equal(t, "Hello Alice, welcome to VHV!", result)
	})

	t.Run("no variables", func(t *testing.T) {
		template := "Hello World"
		vars := map[string]interface{}{}

		result := service.renderString(template, vars)

		assert.Equal(t, "Hello World", result)
	})

	t.Run("unused variables", func(t *testing.T) {
		template := "Hello {{name}}"
		vars := map[string]interface{}{
			"name":  "Bob",
			"extra": "ignored",
		}

		result := service.renderString(template, vars)

		assert.Equal(t, "Hello Bob", result)
	})
}
