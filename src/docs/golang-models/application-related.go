package models

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// APPLICATION API KEY - API Key Management
// ============================================================================
// Purpose: Manage API keys for applications
// Table: application_api_keys
// Primary Key: _id (UUID)
// Features: Scopes, Expiration, Rate Limiting, Last Used Tracking
// ============================================================================

// APIKeyStatus represents the status of an API key
type APIKeyStatus string

const (
	APIKeyStatusActive   APIKeyStatus = "ACTIVE"
	APIKeyStatusRevoked  APIKeyStatus = "REVOKED"
	APIKeyStatusExpired  APIKeyStatus = "EXPIRED"
	APIKeyStatusSuspended APIKeyStatus = "SUSPENDED"
)

type ApplicationAPIKey struct {
	// Identity & Relationships (2 fields)
	ID            uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ApplicationID uuid.UUID `gorm:"column:application_id;type:uuid;not null;index" json:"application_id"`

	// Key Information (4 fields)
	Name        string       `gorm:"column:name;type:varchar(255);not null" json:"name"`
	KeyPrefix   string       `gorm:"column:key_prefix;type:varchar(20);not null" json:"key_prefix"` // First 8 chars for display
	KeyHash     string       `gorm:"column:key_hash;type:varchar(255);not null" json:"-"`            // SHA-256 hash
	Status      APIKeyStatus `gorm:"column:status;type:varchar(20);default:'ACTIVE'" json:"status"`

	// Permissions & Scopes (2 fields)
	Scopes      StringArray `gorm:"column:scopes;type:text[]" json:"scopes,omitempty"`
	Permissions JSONB       `gorm:"column:permissions;type:jsonb" json:"permissions,omitempty"`

	// Expiration & Limits (3 fields)
	ExpiresAt      *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`
	RateLimitRPM   int        `gorm:"column:rate_limit_rpm;default:60" json:"rate_limit_rpm"`   // Requests per minute
	RateLimitDaily int        `gorm:"column:rate_limit_daily;default:10000" json:"rate_limit_daily"` // Daily limit

	// Usage Tracking (4 fields)
	LastUsedAt       *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`
	LastUsedIP       *string    `gorm:"column:last_used_ip;type:varchar(45)" json:"last_used_ip,omitempty"`
	TotalRequests    int64      `gorm:"column:total_requests;default:0" json:"total_requests"`
	RequestsToday    int64      `gorm:"column:requests_today;default:0" json:"requests_today"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	RevokedAt *time.Time `gorm:"column:revoked_at" json:"revoked_at,omitempty"`
	RevokedBy *uuid.UUID `gorm:"column:revoked_by;type:uuid" json:"revoked_by,omitempty"`

	// Soft Delete & Versioning (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`
}

func (ApplicationAPIKey) TableName() string {
	return "application_api_keys"
}

// IsActive checks if the API key is active and not expired
func (k *ApplicationAPIKey) IsActive() bool {
	if k.Status != APIKeyStatusActive {
		return false
	}
	if k.ExpiresAt != nil && time.Now().After(*k.ExpiresAt) {
		return false
	}
	if k.DeletedAt != nil {
		return false
	}
	return true
}

// IsExpired checks if the API key is expired
func (k *ApplicationAPIKey) IsExpired() bool {
	return k.ExpiresAt != nil && time.Now().After(*k.ExpiresAt)
}

// Revoke revokes the API key
func (k *ApplicationAPIKey) Revoke(revokedBy uuid.UUID) {
	now := time.Now()
	k.Status = APIKeyStatusRevoked
	k.RevokedAt = &now
	k.RevokedBy = &revokedBy
}

// RecordUsage records API key usage
func (k *ApplicationAPIKey) RecordUsage(ipAddress string) {
	now := time.Now()
	k.LastUsedAt = &now
	k.LastUsedIP = &ipAddress
	k.TotalRequests++
	k.RequestsToday++
}

// IsRateLimited checks if the API key has exceeded rate limits
func (k *ApplicationAPIKey) IsRateLimited() bool {
	return k.RequestsToday >= int64(k.RateLimitDaily)
}

// ResetDailyCounter resets the daily request counter
func (k *ApplicationAPIKey) ResetDailyCounter() {
	k.RequestsToday = 0
}

// GenerateAPIKey generates a new random API key
func GenerateAPIKey() (string, string, error) {
	// Generate 32 random bytes
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}

	// Encode to base64
	key := base64.URLEncoding.EncodeToString(b)

	// Prefix for identification (e.g., "sk_live_")
	prefix := key[:8]

	return key, prefix, nil
}

// ============================================================================
// APPLICATION STATS - Application Statistics
// ============================================================================
// Purpose: Aggregated statistics for applications
// Type: Computed/View (not a table)
// ============================================================================

type ApplicationStats struct {
	// Identity (3 fields)
	ApplicationID   uuid.UUID `json:"application_id"`
	ApplicationCode string    `json:"application_code"`
	ApplicationName string    `json:"application_name"`

	// Usage Metrics (6 fields)
	TotalInstalls    int64   `json:"total_installs"`
	ActiveUsers      int64   `json:"active_users"`
	TotalAPIRequests int64   `json:"total_api_requests"`
	TotalRevenue     float64 `json:"total_revenue"`
	AverageRating    float64 `json:"average_rating"`
	ReviewCount      int64   `json:"review_count"`

	// API Metrics (5 fields)
	APICallsToday     int64   `json:"api_calls_today"`
	APICallsThisMonth int64   `json:"api_calls_month"`
	SuccessRate       float64 `json:"success_rate"` // %
	AverageResponseMS int     `json:"average_response_ms"`
	ErrorCount        int64   `json:"error_count"`

	// Webhook Metrics (4 fields)
	WebhookCount         int     `json:"webhook_count"`
	WebhookSuccessRate   float64 `json:"webhook_success_rate"`
	WebhookAverageTimeMS int     `json:"webhook_average_time_ms"`
	WebhookFailureCount  int64   `json:"webhook_failure_count"`

	// User Metrics (3 fields)
	NewUsersToday     int64 `json:"new_users_today"`
	NewUsersThisMonth int64 `json:"new_users_month"`
	ChurnRate         float64 `json:"churn_rate"` // %

	// Time Info (2 fields)
	LastActivityAt *time.Time `json:"last_activity_at,omitempty"`
	CalculatedAt   time.Time  `json:"calculated_at"`
}

// CalculateApplicationStats calculates statistics for an application
func CalculateApplicationStats(db *gorm.DB, applicationID uuid.UUID) (*ApplicationStats, error) {
	var stats ApplicationStats

	// Get application info
	var app Application
	if err := db.First(&app, applicationID).Error; err != nil {
		return nil, err
	}

	stats.ApplicationID = app.ID
	stats.ApplicationCode = app.Code
	stats.ApplicationName = app.Name
	stats.TotalInstalls = app.InstallCount
	stats.ActiveUsers = app.ActiveUserCount
	stats.TotalAPIRequests = app.TotalAPIRequests
	stats.TotalRevenue = app.TotalRevenue
	stats.CalculatedAt = time.Now()

	// Count API keys
	var apiKeyCount int64
	db.Model(&ApplicationAPIKey{}).
		Where("application_id = ? AND status = ?", applicationID, APIKeyStatusActive).
		Count(&apiKeyCount)

	// Get last activity
	var lastKey ApplicationAPIKey
	if err := db.Where("application_id = ?", applicationID).
		Order("last_used_at DESC").
		First(&lastKey).Error; err == nil {
		stats.LastActivityAt = lastKey.LastUsedAt
	}

	// Calculate success rate (placeholder - would use actual metrics)
	if stats.TotalAPIRequests > 0 {
		stats.SuccessRate = 99.5 // Example
	}

	return &stats, nil
}

// ============================================================================
// APPLICATION ACTIVITY - Activity Log
// ============================================================================
// Purpose: Track activities related to applications
// Table: application_activities
// Primary Key: _id (UUID)
// ============================================================================

// ActivityAction represents the type of activity
type ActivityAction string

const (
	ActivityActionCreated   ActivityAction = "CREATED"
	ActivityActionUpdated   ActivityAction = "UPDATED"
	ActivityActionDeleted   ActivityAction = "DELETED"
	ActivityActionPublished ActivityAction = "PUBLISHED"
	ActivityActionSuspended ActivityAction = "SUSPENDED"
	ActivityActionArchived  ActivityAction = "ARCHIVED"
	ActivityActionInstalled ActivityAction = "INSTALLED"
	ActivityActionUninstalled ActivityAction = "UNINSTALLED"
	ActivityActionAPIKeyCreated ActivityAction = "API_KEY_CREATED"
	ActivityActionAPIKeyRevoked ActivityAction = "API_KEY_REVOKED"
)

type ApplicationActivity struct {
	// Identity (2 fields)
	ID            uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ApplicationID uuid.UUID `gorm:"column:application_id;type:uuid;not null;index" json:"application_id"`

	// Activity Info (5 fields)
	Action      ActivityAction `gorm:"column:action;type:varchar(50);not null;index" json:"action"`
	Description *string        `gorm:"column:description;type:text" json:"description,omitempty"`
	IPAddress   *string        `gorm:"column:ip_address;type:varchar(45)" json:"ip_address,omitempty"`
	UserAgent   *string        `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	Metadata    JSONB          `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Actor (2 fields)
	ActorID    *uuid.UUID `gorm:"column:actor_id;type:uuid;index" json:"actor_id,omitempty"`
	ActorType  *string    `gorm:"column:actor_type;type:varchar(50)" json:"actor_type,omitempty"` // USER, SYSTEM, API

	// Timestamp (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
}

func (ApplicationActivity) TableName() string {
	return "application_activities"
}

// ============================================================================
// APPLICATION SETTINGS - Application Settings
// ============================================================================
// Purpose: Store application-specific settings
// Table: application_settings
// Primary Key: _id (UUID)
// ============================================================================

// SettingCategory categorizes settings
type SettingCategory string

const (
	SettingCategoryGeneral      SettingCategory = "GENERAL"
	SettingCategorySecurity     SettingCategory = "SECURITY"
	SettingCategoryNotification SettingCategory = "NOTIFICATION"
	SettingCategoryIntegration  SettingCategory = "INTEGRATION"
	SettingCategoryBilling      SettingCategory = "BILLING"
	SettingCategoryAdvanced     SettingCategory = "ADVANCED"
)

type ApplicationSetting struct {
	// Identity (3 fields)
	ID            uuid.UUID       `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ApplicationID uuid.UUID       `gorm:"column:application_id;type:uuid;not null;index" json:"application_id"`
	Category      SettingCategory `gorm:"column:category;type:varchar(50);not null;index" json:"category"`

	// Setting Info (4 fields)
	Key         string  `gorm:"column:key;type:varchar(255);not null;uniqueIndex:idx_app_setting" json:"key"`
	Value       JSONB   `gorm:"column:value;type:jsonb;not null" json:"value"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	IsEncrypted bool    `gorm:"column:is_encrypted;default:false" json:"is_encrypted"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
}

func (ApplicationSetting) TableName() string {
	return "application_settings"
}

// GetValue returns the setting value as a specific type
func (s *ApplicationSetting) GetValue() interface{} {
	return s.Value
}

// SetValue sets the setting value
func (s *ApplicationSetting) SetValue(value interface{}) error {
	s.Value = JSONB{"value": value}
	return nil
}

// ============================================================================
// APPLICATION WEBHOOK - Webhook Management
// ============================================================================
// Purpose: Manage webhooks for applications
// Table: application_webhooks
// Primary Key: _id (UUID)
// Features: Event subscription, Retry mechanism, Secret verification
// ============================================================================

// WebhookEvent represents the type of webhook event
type WebhookEvent string

const (
	WebhookEventInstalled     WebhookEvent = "app.installed"
	WebhookEventUninstalled   WebhookEvent = "app.uninstalled"
	WebhookEventUserCreated   WebhookEvent = "user.created"
	WebhookEventUserUpdated   WebhookEvent = "user.updated"
	WebhookEventUserDeleted   WebhookEvent = "user.deleted"
	WebhookEventDataCreated   WebhookEvent = "data.created"
	WebhookEventDataUpdated   WebhookEvent = "data.updated"
	WebhookEventDataDeleted   WebhookEvent = "data.deleted"
	WebhookEventPaymentSuccess WebhookEvent = "payment.success"
	WebhookEventPaymentFailed  WebhookEvent = "payment.failed"
)

type ApplicationWebhook struct {
	// Identity (2 fields)
	ID            uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ApplicationID uuid.UUID `gorm:"column:application_id;type:uuid;not null;index" json:"application_id"`

	// Webhook Configuration (5 fields)
	Name        string      `gorm:"column:name;type:varchar(255);not null" json:"name"`
	URL         string      `gorm:"column:url;type:text;not null" json:"url"`
	Events      StringArray `gorm:"column:events;type:text[];not null" json:"events"`
	SecretKey   string      `gorm:"column:secret_key;type:varchar(255)" json:"-"` // For HMAC verification
	Description *string     `gorm:"column:description;type:text" json:"description,omitempty"`

	// Status & Control (3 fields)
	IsActive     bool `gorm:"column:is_active;default:true" json:"is_active"`
	RetryEnabled bool `gorm:"column:retry_enabled;default:true" json:"retry_enabled"`
	MaxRetries   int  `gorm:"column:max_retries;default:3" json:"max_retries"`

	// Performance Tracking (8 fields)
	LastTriggeredAt     *time.Time `gorm:"column:last_triggered_at" json:"last_triggered_at,omitempty"`
	LastSuccessAt       *time.Time `gorm:"column:last_success_at" json:"last_success_at,omitempty"`
	LastFailureAt       *time.Time `gorm:"column:last_failure_at" json:"last_failure_at,omitempty"`
	SuccessCount        int64      `gorm:"column:success_count;default:0" json:"success_count"`
	FailureCount        int64      `gorm:"column:failure_count;default:0" json:"failure_count"`
	TotalTriggers       int64      `gorm:"column:total_triggers;default:0" json:"total_triggers"`
	AverageResponseMS   int        `gorm:"column:average_response_ms;default:0" json:"average_response_ms"`
	ConsecutiveFailures int        `gorm:"column:consecutive_failures;default:0" json:"consecutive_failures"`

	// Metadata & Audit (5 fields)
	Metadata  JSONB      `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete & Versioning (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`
}

func (ApplicationWebhook) TableName() string {
	return "application_webhooks"
}

// RecordSuccess records a successful webhook delivery
func (w *ApplicationWebhook) RecordSuccess(responseTimeMS int) {
	now := time.Now()
	w.SuccessCount++
	w.TotalTriggers++
	w.ConsecutiveFailures = 0
	w.LastTriggeredAt = &now
	w.LastSuccessAt = &now

	// Update average response time
	if w.AverageResponseMS == 0 {
		w.AverageResponseMS = responseTimeMS
	} else {
		w.AverageResponseMS = (w.AverageResponseMS + responseTimeMS) / 2
	}
}

// RecordFailure records a failed webhook delivery
func (w *ApplicationWebhook) RecordFailure() {
	now := time.Now()
	w.FailureCount++
	w.TotalTriggers++
	w.ConsecutiveFailures++
	w.LastTriggeredAt = &now
	w.LastFailureAt = &now
}

// GetSuccessRate returns the success rate percentage
func (w *ApplicationWebhook) GetSuccessRate() float64 {
	if w.TotalTriggers == 0 {
		return 0
	}
	return (float64(w.SuccessCount) / float64(w.TotalTriggers)) * 100
}

// IsHealthy checks if the webhook is healthy
func (w *ApplicationWebhook) IsHealthy() bool {
	return w.GetSuccessRate() >= 90.0 && w.ConsecutiveFailures < 5
}

// ShouldDisable checks if the webhook should be auto-disabled
func (w *ApplicationWebhook) ShouldDisable() bool {
	return w.ConsecutiveFailures >= w.MaxRetries*3
}

// ============================================================================
// APPLICATION INSTALLATION - Track App Installations
// ============================================================================
// Purpose: Track which users/tenants have installed the application
// Table: application_installations
// Primary Key: _id (UUID)
// ============================================================================

// InstallationStatus represents the installation status
type InstallationStatus string

const (
	InstallationStatusActive      InstallationStatus = "ACTIVE"
	InstallationStatusUninstalled InstallationStatus = "UNINSTALLED"
	InstallationStatusSuspended   InstallationStatus = "SUSPENDED"
	InstallationStatusTrial       InstallationStatus = "TRIAL"
)

type ApplicationInstallation struct {
	// Identity (3 fields)
	ID            uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	ApplicationID uuid.UUID `gorm:"column:application_id;type:uuid;not null;index" json:"application_id"`
	TenantID      uuid.UUID `gorm:"column:tenant_id;type:uuid;not null;index" json:"tenant_id"`

	// Installation Info (4 fields)
	InstalledBy uuid.UUID          `gorm:"column:installed_by;type:uuid;not null" json:"installed_by"`
	Status      InstallationStatus `gorm:"column:status;type:varchar(20);default:'ACTIVE'" json:"status"`
	Version     string             `gorm:"column:version;type:varchar(50)" json:"version"`
	Settings    JSONB              `gorm:"column:settings;type:jsonb" json:"settings,omitempty"`

	// Trial Info (2 fields)
	TrialEndsAt    *time.Time `gorm:"column:trial_ends_at" json:"trial_ends_at,omitempty"`
	IsTrialExpired bool       `gorm:"column:is_trial_expired;default:false" json:"is_trial_expired"`

	// Timestamps (4 fields)
	InstalledAt   time.Time  `gorm:"column:installed_at;autoCreateTime" json:"installed_at"`
	UninstalledAt *time.Time `gorm:"column:uninstalled_at" json:"uninstalled_at,omitempty"`
	LastUsedAt    *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`
	UpdatedAt     time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
}

func (ApplicationInstallation) TableName() string {
	return "application_installations"
}

// IsActive checks if the installation is active
func (i *ApplicationInstallation) IsActive() bool {
	return i.Status == InstallationStatusActive && i.DeletedAt == nil
}

// IsTrial checks if the installation is in trial period
func (i *ApplicationInstallation) IsTrial() bool {
	return i.Status == InstallationStatusTrial && !i.IsTrialExpired
}

// CheckTrialExpiration checks if the trial has expired
func (i *ApplicationInstallation) CheckTrialExpiration() {
	if i.Status == InstallationStatusTrial && i.TrialEndsAt != nil {
		if time.Now().After(*i.TrialEndsAt) {
			i.IsTrialExpired = true
		}
	}
}

// Uninstall marks the installation as uninstalled
func (i *ApplicationInstallation) Uninstall() {
	now := time.Now()
	i.Status = InstallationStatusUninstalled
	i.UninstalledAt = &now
}

// RecordUsage records usage of the installation
func (i *ApplicationInstallation) RecordUsage() {
	now := time.Now()
	i.LastUsedAt = &now
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateApplicationActivity creates an activity log entry
func CreateApplicationActivity(db *gorm.DB, applicationID uuid.UUID, action ActivityAction, actorID *uuid.UUID, description string) error {
	activity := &ApplicationActivity{
		ApplicationID: applicationID,
		Action:        action,
		Description:   &description,
		ActorID:       actorID,
	}

	if actorID != nil {
		actorType := "USER"
		activity.ActorType = &actorType
	}

	return db.Create(activity).Error
}

// GetApplicationSettings retrieves all settings for an application
func GetApplicationSettings(db *gorm.DB, applicationID uuid.UUID) (map[string]interface{}, error) {
	var settings []ApplicationSetting
	if err := db.Where("application_id = ?", applicationID).Find(&settings).Error; err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	for _, setting := range settings {
		result[setting.Key] = setting.Value
	}

	return result, nil
}

// GetApplicationSetting retrieves a specific setting
func GetApplicationSetting(db *gorm.DB, applicationID uuid.UUID, key string) (*ApplicationSetting, error) {
	var setting ApplicationSetting
	if err := db.Where("application_id = ? AND key = ?", applicationID, key).First(&setting).Error; err != nil {
		return nil, err
	}
	return &setting, nil
}

// SetApplicationSetting sets or updates a setting
func SetApplicationSetting(db *gorm.DB, applicationID uuid.UUID, category SettingCategory, key string, value interface{}, userID *uuid.UUID) error {
	var setting ApplicationSetting

	err := db.Where("application_id = ? AND key = ?", applicationID, key).First(&setting).Error
	if err == gorm.ErrRecordNotFound {
		// Create new setting
		setting = ApplicationSetting{
			ApplicationID: applicationID,
			Category:      category,
			Key:           key,
			Value:         JSONB{"value": value},
			CreatedBy:     userID,
			UpdatedBy:     userID,
		}
		return db.Create(&setting).Error
	} else if err != nil {
		return err
	}

	// Update existing setting
	setting.Value = JSONB{"value": value}
	setting.UpdatedBy = userID
	return db.Save(&setting).Error
}
