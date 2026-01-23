package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/vhv-platform/backend/internal/models"
)

type MockSystemSettingRepository struct {
	mock.Mock
}

func (m *MockSystemSettingRepository) GetByKey(ctx context.Context, key string) (*models.SystemSetting, error) {
	args := m.Called(ctx, key)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.SystemSetting), args.Error(1)
}

func (m *MockSystemSettingRepository) GetAll(ctx context.Context, category string, isPublic bool) ([]*models.SystemSetting, error) {
	args := m.Called(ctx, category, isPublic)
	return args.Get(0).([]*models.SystemSetting), args.Error(1)
}

func (m *MockSystemSettingRepository) GetByCategory(ctx context.Context, category string) ([]*models.SystemSetting, error) {
	args := m.Called(ctx, category)
	return args.Get(0).([]*models.SystemSetting), args.Error(1)
}

func (m *MockSystemSettingRepository) Create(ctx context.Context, setting *models.SystemSetting) error {
	args := m.Called(ctx, setting)
	return args.Error(0)
}

func (m *MockSystemSettingRepository) Update(ctx context.Context, setting *models.SystemSetting) error {
	args := m.Called(ctx, setting)
	return args.Error(0)
}

func (m *MockSystemSettingRepository) Delete(ctx context.Context, id uuid.UUID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestCreateSetting(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	userID := uuid.New()

	req := CreateSystemSettingRequest{
		Key:         "test.setting",
		Value:       "test value",
		DataType:    "string",
		Category:    "general",
		Description: strPtr("Test setting"),
		IsPublic:    false,
		IsEditable:  true,
		CreatedBy:   userID,
	}

	mockRepo.On("Create", mock.Anything, mock.AnythingOfType("*models.SystemSetting")).Return(nil)

	setting, err := service.CreateSetting(context.Background(), req)

	assert.NoError(t, err)
	assert.NotNil(t, setting)
	assert.Equal(t, "test.setting", setting.Key)
	assert.Equal(t, "test value", setting.Value)
	assert.Equal(t, "string", setting.DataType)
	mockRepo.AssertExpectations(t)
}

func TestCreateSetting_InvalidDataType(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	req := CreateSystemSettingRequest{
		Key:       "test.setting",
		Value:     "test",
		DataType:  "invalid-type",
		Category:  "general",
		CreatedBy: uuid.New(),
	}

	_, err := service.CreateSetting(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid data type")
}

func TestCreateSetting_InvalidCategory(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	req := CreateSystemSettingRequest{
		Key:       "test.setting",
		Value:     "test",
		DataType:  "string",
		Category:  "invalid-category",
		CreatedBy: uuid.New(),
	}

	_, err := service.CreateSetting(context.Background(), req)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid category")
}

func TestSetValue_ExistingSetting(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	userID := uuid.New()
	setting := &models.SystemSetting{
		ID:         uuid.New(),
		Key:        "test.setting",
		Value:      "old value",
		DataType:   "string",
		Category:   "general",
		IsEditable: true,
	}

	mockRepo.On("GetByKey", mock.Anything, "test.setting").Return(setting, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.SystemSetting")).Return(nil)

	result, err := service.SetValue(context.Background(), "test.setting", "new value", userID)

	assert.NoError(t, err)
	assert.Equal(t, "new value", result.Value)
	mockRepo.AssertExpectations(t)
}

func TestSetValue_NotEditable(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	setting := &models.SystemSetting{
		ID:         uuid.New(),
		Key:        "test.setting",
		Value:      "old value",
		IsEditable: false,
	}

	mockRepo.On("GetByKey", mock.Anything, "test.setting").Return(setting, nil)

	_, err := service.SetValue(context.Background(), "test.setting", "new value", uuid.New())

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not editable")
	mockRepo.AssertExpectations(t)
}

func TestGetPublicSettings(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	settings := []*models.SystemSetting{
		{Key: "app.name", Value: "VHV Platform", IsPublic: true},
		{Key: "app.version", Value: "1.0.0", IsPublic: true},
	}

	mockRepo.On("GetAll", mock.Anything, "", true).Return(settings, nil)

	result, err := service.GetPublicSettings(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "VHV Platform", result["app.name"])
	assert.Equal(t, "1.0.0", result["app.version"])
	mockRepo.AssertExpectations(t)
}

func TestBulkUpdate(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	userID := uuid.New()
	updates := map[string]interface{}{
		"setting1": "value1",
		"setting2": "value2",
	}

	setting1 := &models.SystemSetting{
		ID: uuid.New(), Key: "setting1", IsEditable: true,
	}
	setting2 := &models.SystemSetting{
		ID: uuid.New(), Key: "setting2", IsEditable: true,
	}

	mockRepo.On("GetByKey", mock.Anything, "setting1").Return(setting1, nil)
	mockRepo.On("GetByKey", mock.Anything, "setting2").Return(setting2, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.SystemSetting")).Return(nil).Times(2)

	count, err := service.BulkUpdate(context.Background(), updates, userID)

	assert.NoError(t, err)
	assert.Equal(t, 2, count)
	mockRepo.AssertExpectations(t)
}

func TestValidateValue(t *testing.T) {
	service := NewSystemSettingService(nil, nil)

	tests := []struct {
		name     string
		dataType string
		value    interface{}
		wantErr  bool
	}{
		{"String valid", "string", "test", false},
		{"String invalid", "string", 123, true},
		{"Integer valid", "integer", 123, false},
		{"Integer valid float", "integer", 123.0, false},
		{"Integer invalid", "integer", "test", true},
		{"Float valid", "float", 123.45, false},
		{"Float valid int", "float", 123, false},
		{"Boolean valid", "boolean", true, false},
		{"Boolean invalid", "boolean", "true", true},
		{"JSON valid", "json", map[string]interface{}{"key": "value"}, false},
		{"Array valid", "array", []interface{}{1, 2, 3}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.ValidateValue(tt.dataType, tt.value)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestDetectDataType(t *testing.T) {
	service := NewSystemSettingService(nil, nil)

	tests := []struct {
		name     string
		value    interface{}
		expected string
	}{
		{"String", "test", "string"},
		{"Integer", 123, "integer"},
		{"Integer64", int64(123), "integer"},
		{"Float", 123.45, "float"},
		{"Boolean", true, "boolean"},
		{"Array", []interface{}{1, 2, 3}, "array"},
		{"Object", map[string]interface{}{"key": "value"}, "json"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.detectDataType(tt.value)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestExportSettings(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	settings := []*models.SystemSetting{
		{
			Key:         "app.name",
			Value:       "VHV Platform",
			DataType:    "string",
			Category:    "app",
			Description: strPtr("App name"),
			IsPublic:    true,
			IsEditable:  true,
		},
		{
			Key:         "app.version",
			Value:       "1.0.0",
			DataType:    "string",
			Category:    "app",
			IsPublic:    true,
			IsEditable:  false,
		},
	}

	mockRepo.On("GetAll", mock.Anything, "", false).Return(settings, nil)

	result, err := service.ExportSettings(context.Background())

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Contains(t, result, "app.name")
	assert.Contains(t, result, "app.version")

	appNameData := result["app.name"].(map[string]interface{})
	assert.Equal(t, "VHV Platform", appNameData["value"])
	assert.Equal(t, "string", appNameData["data_type"])
	assert.Equal(t, true, appNameData["is_public"])
	mockRepo.AssertExpectations(t)
}

func TestImportSettings(t *testing.T) {
	mockRepo := new(MockSystemSettingRepository)
	service := NewSystemSettingService(mockRepo, nil)

	userID := uuid.New()
	data := map[string]interface{}{
		"setting1": map[string]interface{}{"value": "value1"},
		"setting2": map[string]interface{}{"value": "value2"},
	}

	setting1 := &models.SystemSetting{ID: uuid.New(), Key: "setting1", IsEditable: true}
	setting2 := &models.SystemSetting{ID: uuid.New(), Key: "setting2", IsEditable: true}

	mockRepo.On("GetByKey", mock.Anything, "setting1").Return(setting1, nil)
	mockRepo.On("GetByKey", mock.Anything, "setting2").Return(setting2, nil)
	mockRepo.On("Update", mock.Anything, mock.AnythingOfType("*models.SystemSetting")).Return(nil).Times(2)

	count, err := service.ImportSettings(context.Background(), data, userID)

	assert.NoError(t, err)
	assert.Equal(t, 2, count)
	mockRepo.AssertExpectations(t)
}

func strPtr(s string) *string {
	return &s
}
