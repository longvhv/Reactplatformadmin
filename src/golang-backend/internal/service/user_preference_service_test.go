package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

type MockUserPreferenceRepository struct {
	mock.Mock
}

func (m *MockUserPreferenceRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.UserPreference, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.UserPreference), args.Error(1)
}

func (m *MockUserPreferenceRepository) Create(ctx context.Context, preference *models.UserPreference) error {
	args := m.Called(ctx, preference)
	return args.Error(0)
}

func (m *MockUserPreferenceRepository) Update(ctx context.Context, preference *models.UserPreference) error {
	args := m.Called(ctx, preference)
	return args.Error(0)
}

func TestGetPreferences_Existing(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()
	theme := "dark"
	language := "en"

	preference := &models.UserPreference{
		ID:       uuid.New(),
		UserID:   userID,
		Theme:    &theme,
		Language: &language,
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(preference, nil)

	result, err := service.GetPreferences(context.Background(), userID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "dark", *result.Theme)
	assert.Equal(t, "en", *result.Language)
	mockRepo.AssertExpectations(t)
}

func TestGetPreferences_CreateDefault(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(nil, assert.AnError)
	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.UserPreference")).Return(nil)

	result, err := service.GetPreferences(context.Background(), userID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "light", *result.Theme)
	assert.Equal(t, "vi", *result.Language)
	mockRepo.AssertExpectations(t)
}

func TestUpdatePreferences(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()
	theme := "light"
	newTheme := "dark"
	newLanguage := "en"

	preference := &models.UserPreference{
		ID:     uuid.New(),
		UserID: userID,
		Theme:  &theme,
	}

	req := UpdatePreferencesRequest{
		Theme:    &newTheme,
		Language: &newLanguage,
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(preference, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.UserPreference")).Return(nil)

	result, err := service.UpdatePreferences(context.Background(), userID, req)

	assert.NoError(t, err)
	assert.Equal(t, "dark", *result.Theme)
	assert.Equal(t, "en", *result.Language)
	mockRepo.AssertExpectations(t)
}

func TestGetValue(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()
	theme := "dark"

	preference := &models.UserPreference{
		ID:             uuid.New(),
		UserID:         userID,
		Theme:          &theme,
		CustomSettings: map[string]interface{}{"custom_key": "custom_value"},
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(preference, nil)

	// Test standard field
	value, err := service.GetValue(context.Background(), userID, "theme")
	assert.NoError(t, err)
	assert.Equal(t, "dark", *value.(*string))

	// Test custom field
	value, err = service.GetValue(context.Background(), userID, "custom_key")
	assert.NoError(t, err)
	assert.Equal(t, "custom_value", value)

	mockRepo.AssertExpectations(t)
}

func TestGetValue_NotFound(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()

	preference := &models.UserPreference{
		ID:             uuid.New(),
		UserID:         userID,
		CustomSettings: map[string]interface{}{},
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(preference, nil)

	_, err := service.GetValue(context.Background(), userID, "nonexistent_key")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
	mockRepo.AssertExpectations(t)
}

func TestSetValue(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()

	preference := &models.UserPreference{
		ID:             uuid.New(),
		UserID:         userID,
		CustomSettings: map[string]interface{}{},
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(preference, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.UserPreference")).Return(nil)

	err := service.SetValue(context.Background(), userID, "my_key", "my_value")

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestDeleteValue(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()

	preference := &models.UserPreference{
		ID:             uuid.New(),
		UserID:         userID,
		CustomSettings: map[string]interface{}{"key_to_delete": "value"},
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(preference, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.UserPreference")).Return(nil)

	err := service.DeleteValue(context.Background(), userID, "key_to_delete")

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestResetToDefaults(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()
	theme := "dark"

	existing := &models.UserPreference{
		ID:     uuid.New(),
		UserID: userID,
		Theme:  &theme,
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(existing, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.UserPreference")).Return(nil)

	result, err := service.ResetToDefaults(context.Background(), userID)

	assert.NoError(t, err)
	assert.Equal(t, "light", *result.Theme)
	assert.Equal(t, "vi", *result.Language)
	mockRepo.AssertExpectations(t)
}

func TestExportPreferences(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()
	theme := "dark"
	language := "en"

	preference := &models.UserPreference{
		ID:       uuid.New(),
		UserID:   userID,
		Theme:    &theme,
		Language: &language,
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(preference, nil)

	result, err := service.ExportPreferences(context.Background(), userID)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, userID, result["user_id"])
	assert.Equal(t, "dark", result["theme"])
	assert.Equal(t, "en", result["language"])
	assert.Contains(t, result, "exported_at")
	mockRepo.AssertExpectations(t)
}

func TestImportPreferences(t *testing.T) {
	mockRepo := new(MockUserPreferenceRepository)
	service := NewUserPreferenceService(mockRepo, nil)

	userID := uuid.New()

	preference := &models.UserPreference{
		ID:     uuid.New(),
		UserID: userID,
	}

	data := map[string]interface{}{
		"theme":    "dark",
		"language": "en",
		"timezone": "America/New_York",
	}

	mockRepo.On("GetByUserID", mock.Anything, userID).Return(preference, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.UserPreference")).Return(nil)

	result, err := service.ImportPreferences(context.Background(), userID, data)

	assert.NoError(t, err)
	assert.Equal(t, "dark", *result.Theme)
	assert.Equal(t, "en", *result.Language)
	assert.Equal(t, "America/New_York", *result.Timezone)
	mockRepo.AssertExpectations(t)
}

func TestValidatePreferences_ValidTheme(t *testing.T) {
	service := NewUserPreferenceService(nil, nil)

	theme := "dark"
	preference := &models.UserPreference{Theme: &theme}

	err := service.ValidatePreferences(preference)
	assert.NoError(t, err)
}

func TestValidatePreferences_InvalidTheme(t *testing.T) {
	service := NewUserPreferenceService(nil, nil)

	theme := "invalid-theme"
	preference := &models.UserPreference{Theme: &theme}

	err := service.ValidatePreferences(preference)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid theme")
}

func TestValidatePreferences_ValidLanguage(t *testing.T) {
	service := NewUserPreferenceService(nil, nil)

	language := "vi"
	preference := &models.UserPreference{Language: &language}

	err := service.ValidatePreferences(preference)
	assert.NoError(t, err)
}

func TestValidatePreferences_InvalidLanguage(t *testing.T) {
	service := NewUserPreferenceService(nil, nil)

	language := "invalid-lang"
	preference := &models.UserPreference{Language: &language}

	err := service.ValidatePreferences(preference)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid language")
}
