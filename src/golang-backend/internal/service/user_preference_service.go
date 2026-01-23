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

type UserPreferenceService struct {
	preferenceRepo repository.UserPreferenceRepository
	cacheService   *CacheService
}

func NewUserPreferenceService(preferenceRepo repository.UserPreferenceRepository, cacheService *CacheService) *UserPreferenceService {
	return &UserPreferenceService{
		preferenceRepo: preferenceRepo,
		cacheService:   cacheService,
	}
}

type UpdatePreferencesRequest struct {
	Theme            *string                `json:"theme"`
	Language         *string                `json:"language"`
	Timezone         *string                `json:"timezone"`
	DateFormat       *string                `json:"date_format"`
	TimeFormat       *string                `json:"time_format"`
	Currency         *string                `json:"currency"`
	EmailNotifications *bool                `json:"email_notifications"`
	PushNotifications  *bool                `json:"push_notifications"`
	SMSNotifications   *bool                `json:"sms_notifications"`
	NotificationSettings map[string]interface{} `json:"notification_settings"`
	UISettings       map[string]interface{} `json:"ui_settings"`
	PrivacySettings  map[string]interface{} `json:"privacy_settings"`
	CustomSettings   map[string]interface{} `json:"custom_settings"`
}

// GetPreferences gets user preferences
func (s *UserPreferenceService) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.UserPreference, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("user_preferences:%s", userID)
	var cached models.UserPreference
	if s.cacheService != nil && s.cacheService.Get(ctx, cacheKey, &cached) == nil {
		return &cached, nil
	}

	preferences, err := s.preferenceRepo.GetByUserID(ctx, userID)
	if err != nil {
		// Create default preferences if not found
		preferences = s.createDefaultPreferences(userID)
		if err := s.preferenceRepo.Create(ctx, preferences); err != nil {
			return nil, fmt.Errorf("failed to create default preferences: %w", err)
		}
	}

	// Cache for 10 minutes
	if s.cacheService != nil {
		_ = s.cacheService.Set(ctx, cacheKey, preferences, 10*time.Minute)
	}

	return preferences, nil
}

// UpdatePreferences updates user preferences
func (s *UserPreferenceService) UpdatePreferences(ctx context.Context, userID uuid.UUID, req UpdatePreferencesRequest) (*models.UserPreference, error) {
	preferences, err := s.preferenceRepo.GetByUserID(ctx, userID)
	if err != nil {
		// Create if not exists
		preferences = s.createDefaultPreferences(userID)
	}

	if req.Theme != nil {
		preferences.Theme = req.Theme
	}
	if req.Language != nil {
		preferences.Language = req.Language
	}
	if req.Timezone != nil {
		preferences.Timezone = req.Timezone
	}
	if req.DateFormat != nil {
		preferences.DateFormat = req.DateFormat
	}
	if req.TimeFormat != nil {
		preferences.TimeFormat = req.TimeFormat
	}
	if req.Currency != nil {
		preferences.Currency = req.Currency
	}
	if req.EmailNotifications != nil {
		preferences.EmailNotifications = req.EmailNotifications
	}
	if req.PushNotifications != nil {
		preferences.PushNotifications = req.PushNotifications
	}
	if req.SMSNotifications != nil {
		preferences.SMSNotifications = req.SMSNotifications
	}
	if req.NotificationSettings != nil {
		preferences.NotificationSettings = req.NotificationSettings
	}
	if req.UISettings != nil {
		preferences.UISettings = req.UISettings
	}
	if req.PrivacySettings != nil {
		preferences.PrivacySettings = req.PrivacySettings
	}
	if req.CustomSettings != nil {
		preferences.CustomSettings = req.CustomSettings
	}

	preferences.UpdatedAt = time.Now()

	if preferences.ID == uuid.Nil {
		if err := s.preferenceRepo.Create(ctx, preferences); err != nil {
			return nil, fmt.Errorf("failed to create preferences: %w", err)
		}
	} else {
		if err := s.preferenceRepo.Update(ctx, preferences); err != nil {
			return nil, fmt.Errorf("failed to update preferences: %w", err)
		}
	}

	// Invalidate cache
	s.invalidateCache(ctx, userID)

	return preferences, nil
}

// GetValue gets a specific preference value
func (s *UserPreferenceService) GetValue(ctx context.Context, userID uuid.UUID, key string) (interface{}, error) {
	preferences, err := s.GetPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Check in custom settings first
	if val, ok := preferences.CustomSettings[key]; ok {
		return val, nil
	}

	// Check in UI settings
	if val, ok := preferences.UISettings[key]; ok {
		return val, nil
	}

	// Check in notification settings
	if val, ok := preferences.NotificationSettings[key]; ok {
		return val, nil
	}

	// Check in privacy settings
	if val, ok := preferences.PrivacySettings[key]; ok {
		return val, nil
	}

	// Check standard fields
	switch key {
	case "theme":
		return preferences.Theme, nil
	case "language":
		return preferences.Language, nil
	case "timezone":
		return preferences.Timezone, nil
	case "date_format":
		return preferences.DateFormat, nil
	case "time_format":
		return preferences.TimeFormat, nil
	case "currency":
		return preferences.Currency, nil
	case "email_notifications":
		return preferences.EmailNotifications, nil
	case "push_notifications":
		return preferences.PushNotifications, nil
	case "sms_notifications":
		return preferences.SMSNotifications, nil
	}

	return nil, fmt.Errorf("preference key not found: %s", key)
}

// SetValue sets a specific preference value
func (s *UserPreferenceService) SetValue(ctx context.Context, userID uuid.UUID, key string, value interface{}) error {
	preferences, err := s.preferenceRepo.GetByUserID(ctx, userID)
	if err != nil {
		preferences = s.createDefaultPreferences(userID)
	}

	// Set in custom settings
	if preferences.CustomSettings == nil {
		preferences.CustomSettings = make(map[string]interface{})
	}
	preferences.CustomSettings[key] = value
	preferences.UpdatedAt = time.Now()

	if preferences.ID == uuid.Nil {
		if err := s.preferenceRepo.Create(ctx, preferences); err != nil {
			return fmt.Errorf("failed to create preferences: %w", err)
		}
	} else {
		if err := s.preferenceRepo.Update(ctx, preferences); err != nil {
			return fmt.Errorf("failed to update preferences: %w", err)
		}
	}

	// Invalidate cache
	s.invalidateCache(ctx, userID)

	return nil
}

// DeleteValue deletes a specific preference value
func (s *UserPreferenceService) DeleteValue(ctx context.Context, userID uuid.UUID, key string) error {
	preferences, err := s.preferenceRepo.GetByUserID(ctx, userID)
	if err != nil {
		return err
	}

	delete(preferences.CustomSettings, key)
	delete(preferences.UISettings, key)
	delete(preferences.NotificationSettings, key)
	delete(preferences.PrivacySettings, key)

	preferences.UpdatedAt = time.Now()

	if err := s.preferenceRepo.Update(ctx, preferences); err != nil {
		return fmt.Errorf("failed to delete preference: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, userID)

	return nil
}

// ResetToDefaults resets all preferences to default
func (s *UserPreferenceService) ResetToDefaults(ctx context.Context, userID uuid.UUID) (*models.UserPreference, error) {
	preferences := s.createDefaultPreferences(userID)
	
	existing, err := s.preferenceRepo.GetByUserID(ctx, userID)
	if err == nil {
		preferences.ID = existing.ID
		if err := s.preferenceRepo.Update(ctx, preferences); err != nil {
			return nil, fmt.Errorf("failed to reset preferences: %w", err)
		}
	} else {
		if err := s.preferenceRepo.Create(ctx, preferences); err != nil {
			return nil, fmt.Errorf("failed to create default preferences: %w", err)
		}
	}

	// Invalidate cache
	s.invalidateCache(ctx, userID)

	return preferences, nil
}

// ExportPreferences exports user preferences
func (s *UserPreferenceService) ExportPreferences(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	preferences, err := s.GetPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}

	data := map[string]interface{}{
		"user_id":               preferences.UserID,
		"theme":                 preferences.Theme,
		"language":              preferences.Language,
		"timezone":              preferences.Timezone,
		"date_format":           preferences.DateFormat,
		"time_format":           preferences.TimeFormat,
		"currency":              preferences.Currency,
		"email_notifications":   preferences.EmailNotifications,
		"push_notifications":    preferences.PushNotifications,
		"sms_notifications":     preferences.SMSNotifications,
		"notification_settings": preferences.NotificationSettings,
		"ui_settings":           preferences.UISettings,
		"privacy_settings":      preferences.PrivacySettings,
		"custom_settings":       preferences.CustomSettings,
		"exported_at":           time.Now(),
	}

	return data, nil
}

// ImportPreferences imports user preferences
func (s *UserPreferenceService) ImportPreferences(ctx context.Context, userID uuid.UUID, data map[string]interface{}) (*models.UserPreference, error) {
	preferences, err := s.preferenceRepo.GetByUserID(ctx, userID)
	if err != nil {
		preferences = s.createDefaultPreferences(userID)
	}

	// Update from imported data
	if val, ok := data["theme"].(string); ok {
		preferences.Theme = &val
	}
	if val, ok := data["language"].(string); ok {
		preferences.Language = &val
	}
	if val, ok := data["timezone"].(string); ok {
		preferences.Timezone = &val
	}
	if val, ok := data["date_format"].(string); ok {
		preferences.DateFormat = &val
	}
	if val, ok := data["time_format"].(string); ok {
		preferences.TimeFormat = &val
	}
	if val, ok := data["currency"].(string); ok {
		preferences.Currency = &val
	}
	if val, ok := data["email_notifications"].(bool); ok {
		preferences.EmailNotifications = &val
	}
	if val, ok := data["push_notifications"].(bool); ok {
		preferences.PushNotifications = &val
	}
	if val, ok := data["sms_notifications"].(bool); ok {
		preferences.SMSNotifications = &val
	}
	if val, ok := data["notification_settings"].(map[string]interface{}); ok {
		preferences.NotificationSettings = val
	}
	if val, ok := data["ui_settings"].(map[string]interface{}); ok {
		preferences.UISettings = val
	}
	if val, ok := data["privacy_settings"].(map[string]interface{}); ok {
		preferences.PrivacySettings = val
	}
	if val, ok := data["custom_settings"].(map[string]interface{}); ok {
		preferences.CustomSettings = val
	}

	preferences.UpdatedAt = time.Now()

	if preferences.ID == uuid.Nil {
		if err := s.preferenceRepo.Create(ctx, preferences); err != nil {
			return nil, fmt.Errorf("failed to import preferences: %w", err)
		}
	} else {
		if err := s.preferenceRepo.Update(ctx, preferences); err != nil {
			return nil, fmt.Errorf("failed to import preferences: %w", err)
		}
	}

	// Invalidate cache
	s.invalidateCache(ctx, userID)

	return preferences, nil
}

// ValidatePreferences validates preference values
func (s *UserPreferenceService) ValidatePreferences(preferences *models.UserPreference) error {
	// Validate theme
	if preferences.Theme != nil {
		validThemes := []string{"light", "dark", "auto", "system"}
		if !containsPrefValue(validThemes, *preferences.Theme) {
			return fmt.Errorf("invalid theme, must be one of: %v", validThemes)
		}
	}

	// Validate language
	if preferences.Language != nil {
		validLanguages := []string{"en", "vi", "ja", "ko", "zh", "fr", "de", "es"}
		if !containsPrefValue(validLanguages, *preferences.Language) {
			return fmt.Errorf("invalid language, must be one of: %v", validLanguages)
		}
	}

	return nil
}

// Helper functions
func (s *UserPreferenceService) createDefaultPreferences(userID uuid.UUID) *models.UserPreference {
	theme := "light"
	language := "vi"
	timezone := "Asia/Ho_Chi_Minh"
	dateFormat := "DD/MM/YYYY"
	timeFormat := "24h"
	currency := "VND"
	emailNotif := true
	pushNotif := true
	smsNotif := false

	return &models.UserPreference{
		ID:                   uuid.New(),
		UserID:               userID,
		Theme:                &theme,
		Language:             &language,
		Timezone:             &timezone,
		DateFormat:           &dateFormat,
		TimeFormat:           &timeFormat,
		Currency:             &currency,
		EmailNotifications:   &emailNotif,
		PushNotifications:    &pushNotif,
		SMSNotifications:     &smsNotif,
		NotificationSettings: make(map[string]interface{}),
		UISettings:           make(map[string]interface{}),
		PrivacySettings:      make(map[string]interface{}),
		CustomSettings:       make(map[string]interface{}),
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}
}

func (s *UserPreferenceService) invalidateCache(ctx context.Context, userID uuid.UUID) {
	if s.cacheService != nil {
		cacheKey := fmt.Sprintf("user_preferences:%s", userID)
		_ = s.cacheService.Delete(ctx, cacheKey)
	}
}

// SerializePreferences serializes preferences to JSON
func (s *UserPreferenceService) SerializePreferences(preferences *models.UserPreference) ([]byte, error) {
	return json.Marshal(preferences)
}

// DeserializePreferences deserializes preferences from JSON
func (s *UserPreferenceService) DeserializePreferences(data []byte) (*models.UserPreference, error) {
	var preferences models.UserPreference
	if err := json.Unmarshal(data, &preferences); err != nil {
		return nil, err
	}
	return &preferences, nil
}

func containsPrefValue(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
