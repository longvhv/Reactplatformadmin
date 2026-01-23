package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type SystemSettingService struct {
	settingRepo  repository.SystemSettingRepository
	cacheService *CacheService
}

func NewSystemSettingService(settingRepo repository.SystemSettingRepository, cacheService *CacheService) *SystemSettingService {
	return &SystemSettingService{
		settingRepo:  settingRepo,
		cacheService: cacheService,
	}
}

type CreateSystemSettingRequest struct {
	Key         string      `json:"key" binding:"required"`
	Value       interface{} `json:"value" binding:"required"`
	DataType    string      `json:"data_type" binding:"required"`
	Category    string      `json:"category" binding:"required"`
	Description *string     `json:"description"`
	IsPublic    bool        `json:"is_public"`
	IsEditable  bool        `json:"is_editable"`
	CreatedBy   uuid.UUID   `json:"-"`
}

type UpdateSystemSettingRequest struct {
	Value       *interface{} `json:"value"`
	Description *string      `json:"description"`
	IsPublic    *bool        `json:"is_public"`
	IsEditable  *bool        `json:"is_editable"`
	UpdatedBy   uuid.UUID    `json:"-"`
}

// GetByKey gets setting by key
func (s *SystemSettingService) GetByKey(ctx context.Context, key string) (*models.SystemSetting, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("system_setting:%s", key)
	var cached models.SystemSetting
	if s.cacheService != nil && s.cacheService.Get(ctx, cacheKey, &cached) == nil {
		return &cached, nil
	}

	setting, err := s.settingRepo.GetByKey(ctx, key)
	if err != nil {
		return nil, err
	}

	// Cache for 10 minutes
	if s.cacheService != nil {
		_ = s.cacheService.Set(ctx, cacheKey, setting, 10*time.Minute)
	}

	return setting, nil
}

// GetAllSettings gets all settings
func (s *SystemSettingService) GetAllSettings(ctx context.Context, category string, isPublic bool) ([]*models.SystemSetting, error) {
	return s.settingRepo.GetAll(ctx, category, isPublic)
}

// GetByCategory gets settings by category
func (s *SystemSettingService) GetByCategory(ctx context.Context, category string) ([]*models.SystemSetting, error) {
	return s.settingRepo.GetByCategory(ctx, category)
}

// GetPublicSettings gets public settings
func (s *SystemSettingService) GetPublicSettings(ctx context.Context) (map[string]interface{}, error) {
	settings, err := s.settingRepo.GetAll(ctx, "", true)
	if err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	for _, setting := range settings {
		result[setting.Key] = setting.Value
	}

	return result, nil
}

// GetValue gets setting value by key
func (s *SystemSettingService) GetValue(ctx context.Context, key string) (interface{}, error) {
	setting, err := s.GetByKey(ctx, key)
	if err != nil {
		return nil, err
	}

	return setting.Value, nil
}

// SetValue sets setting value
func (s *SystemSettingService) SetValue(ctx context.Context, key string, value interface{}, updatedBy uuid.UUID) (*models.SystemSetting, error) {
	setting, err := s.settingRepo.GetByKey(ctx, key)
	if err != nil {
		// Create if not exists
		return s.CreateSetting(ctx, CreateSystemSettingRequest{
			Key:        key,
			Value:      value,
			DataType:   s.detectDataType(value),
			Category:   "general",
			IsPublic:   false,
			IsEditable: true,
			CreatedBy:  updatedBy,
		})
	}

	if !setting.IsEditable {
		return nil, fmt.Errorf("setting is not editable")
	}

	setting.Value = value
	setting.UpdatedAt = time.Now()
	setting.UpdatedBy = &updatedBy

	if err := s.settingRepo.Update(ctx, setting); err != nil {
		return nil, fmt.Errorf("failed to update setting: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, key)

	return setting, nil
}

// CreateSetting creates a new setting
func (s *SystemSettingService) CreateSetting(ctx context.Context, req CreateSystemSettingRequest) (*models.SystemSetting, error) {
	// Validate data type
	validTypes := []string{"string", "integer", "float", "boolean", "json", "array"}
	if !containsSettingType(validTypes, req.DataType) {
		return nil, fmt.Errorf("invalid data type, must be one of: %v", validTypes)
	}

	// Validate category
	validCategories := []string{"general", "app", "email", "sms", "payment", "security", "integration", "feature", "ui", "notification"}
	if !containsSettingType(validCategories, req.Category) {
		return nil, fmt.Errorf("invalid category, must be one of: %v", validCategories)
	}

	setting := &models.SystemSetting{
		ID:          uuid.New(),
		Key:         req.Key,
		Value:       req.Value,
		DataType:    req.DataType,
		Category:    req.Category,
		Description: req.Description,
		IsPublic:    req.IsPublic,
		IsEditable:  req.IsEditable,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		CreatedBy:   &req.CreatedBy,
	}

	if err := s.settingRepo.Create(ctx, setting); err != nil {
		return nil, fmt.Errorf("failed to create setting: %w", err)
	}

	return setting, nil
}

// UpdateSetting updates a setting
func (s *SystemSettingService) UpdateSetting(ctx context.Context, key string, req UpdateSystemSettingRequest) (*models.SystemSetting, error) {
	setting, err := s.settingRepo.GetByKey(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("setting not found: %w", err)
	}

	if !setting.IsEditable {
		return nil, fmt.Errorf("setting is not editable")
	}

	if req.Value != nil {
		setting.Value = *req.Value
	}
	if req.Description != nil {
		setting.Description = req.Description
	}
	if req.IsPublic != nil {
		setting.IsPublic = *req.IsPublic
	}
	if req.IsEditable != nil {
		setting.IsEditable = *req.IsEditable
	}

	setting.UpdatedAt = time.Now()
	setting.UpdatedBy = &req.UpdatedBy

	if err := s.settingRepo.Update(ctx, setting); err != nil {
		return nil, fmt.Errorf("failed to update setting: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, key)

	return setting, nil
}

// DeleteSetting deletes a setting
func (s *SystemSettingService) DeleteSetting(ctx context.Context, key string) error {
	setting, err := s.settingRepo.GetByKey(ctx, key)
	if err != nil {
		return err
	}

	if !setting.IsEditable {
		return fmt.Errorf("setting is not editable")
	}

	if err := s.settingRepo.Delete(ctx, setting.ID); err != nil {
		return err
	}

	// Invalidate cache
	s.invalidateCache(ctx, key)

	return nil
}

// BulkUpdate updates multiple settings
func (s *SystemSettingService) BulkUpdate(ctx context.Context, updates map[string]interface{}, updatedBy uuid.UUID) (int, error) {
	count := 0

	for key, value := range updates {
		_, err := s.SetValue(ctx, key, value, updatedBy)
		if err == nil {
			count++
		}
	}

	return count, nil
}

// ExportSettings exports all settings
func (s *SystemSettingService) ExportSettings(ctx context.Context) (map[string]interface{}, error) {
	settings, err := s.settingRepo.GetAll(ctx, "", false)
	if err != nil {
		return nil, err
	}

	export := make(map[string]interface{})
	for _, setting := range settings {
		export[setting.Key] = map[string]interface{}{
			"value":       setting.Value,
			"data_type":   setting.DataType,
			"category":    setting.Category,
			"description": setting.Description,
			"is_public":   setting.IsPublic,
			"is_editable": setting.IsEditable,
		}
	}

	return export, nil
}

// ImportSettings imports settings
func (s *SystemSettingService) ImportSettings(ctx context.Context, data map[string]interface{}, updatedBy uuid.UUID) (int, error) {
	count := 0

	for key, item := range data {
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}

		value, ok := itemMap["value"]
		if !ok {
			continue
		}

		_, err := s.SetValue(ctx, key, value, updatedBy)
		if err == nil {
			count++
		}
	}

	return count, nil
}

// ResetToDefaults resets settings to defaults
func (s *SystemSettingService) ResetToDefaults(ctx context.Context, category string, updatedBy uuid.UUID) (int, error) {
	defaults := s.getDefaultSettings()
	count := 0

	for _, def := range defaults {
		if category != "" && def.Category != category {
			continue
		}

		existing, err := s.settingRepo.GetByKey(ctx, def.Key)
		if err != nil {
			// Create if not exists
			_, err = s.CreateSetting(ctx, CreateSystemSettingRequest{
				Key:         def.Key,
				Value:       def.Value,
				DataType:    def.DataType,
				Category:    def.Category,
				Description: def.Description,
				IsPublic:    def.IsPublic,
				IsEditable:  def.IsEditable,
				CreatedBy:   updatedBy,
			})
			if err == nil {
				count++
			}
		} else {
			// Update to default
			existing.Value = def.Value
			existing.UpdatedAt = time.Now()
			existing.UpdatedBy = &updatedBy
			if err := s.settingRepo.Update(ctx, existing); err == nil {
				count++
				s.invalidateCache(ctx, def.Key)
			}
		}
	}

	return count, nil
}

// ValidateValue validates setting value against data type
func (s *SystemSettingService) ValidateValue(dataType string, value interface{}) error {
	switch dataType {
	case "string":
		if _, ok := value.(string); !ok {
			return fmt.Errorf("value must be a string")
		}
	case "integer":
		switch value.(type) {
		case int, int64, float64:
			return nil
		default:
			return fmt.Errorf("value must be an integer")
		}
	case "float":
		switch value.(type) {
		case float64, int, int64:
			return nil
		default:
			return fmt.Errorf("value must be a float")
		}
	case "boolean":
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("value must be a boolean")
		}
	case "json", "array":
		// Any value is acceptable for JSON/array
		return nil
	}

	return nil
}

// Helper functions
func (s *SystemSettingService) detectDataType(value interface{}) string {
	switch value.(type) {
	case string:
		return "string"
	case int, int64:
		return "integer"
	case float64:
		return "float"
	case bool:
		return "boolean"
	case []interface{}:
		return "array"
	default:
		return "json"
	}
}

func (s *SystemSettingService) invalidateCache(ctx context.Context, key string) {
	if s.cacheService != nil {
		cacheKey := fmt.Sprintf("system_setting:%s", key)
		_ = s.cacheService.Delete(ctx, cacheKey)
	}
}

func (s *SystemSettingService) getDefaultSettings() []models.SystemSetting {
	trueVal := true
	appName := "VHV Platform"
	maintenance := false
	maxUpload := 10485760 // 10MB
	timezone := "Asia/Ho_Chi_Minh"

	return []models.SystemSetting{
		{
			Key:         "app.name",
			Value:       appName,
			DataType:    "string",
			Category:    "app",
			Description: stringPtr("Application name"),
			IsPublic:    true,
			IsEditable:  true,
		},
		{
			Key:         "app.maintenance_mode",
			Value:       maintenance,
			DataType:    "boolean",
			Category:    "app",
			Description: stringPtr("Maintenance mode enabled"),
			IsPublic:    true,
			IsEditable:  true,
		},
		{
			Key:         "app.timezone",
			Value:       timezone,
			DataType:    "string",
			Category:    "app",
			Description: stringPtr("Default timezone"),
			IsPublic:    true,
			IsEditable:  true,
		},
		{
			Key:         "upload.max_file_size",
			Value:       maxUpload,
			DataType:    "integer",
			Category:    "app",
			Description: stringPtr("Maximum file upload size in bytes"),
			IsPublic:    false,
			IsEditable:  true,
		},
		{
			Key:         "email.enabled",
			Value:       trueVal,
			DataType:    "boolean",
			Category:    "email",
			Description: stringPtr("Email notifications enabled"),
			IsPublic:    false,
			IsEditable:  true,
		},
		{
			Key:         "security.session_timeout",
			Value:       3600,
			DataType:    "integer",
			Category:    "security",
			Description: stringPtr("Session timeout in seconds"),
			IsPublic:    false,
			IsEditable:  true,
		},
	}
}

// Serialize/Deserialize helpers
func (s *SystemSettingService) SerializeValue(value interface{}) ([]byte, error) {
	return json.Marshal(value)
}

func (s *SystemSettingService) DeserializeValue(data []byte, dataType string) (interface{}, error) {
	var value interface{}
	if err := json.Unmarshal(data, &value); err != nil {
		return nil, err
	}
	return value, nil
}

func containsSettingType(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func stringPtr(s string) *string {
	return &s
}
