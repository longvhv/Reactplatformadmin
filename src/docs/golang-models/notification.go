package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// NOTIFICATION - System Notifications
// ============================================================================
// Purpose: Manage system notifications to users
// Table: notifications
// Primary Key: _id (UUID)
// Features: Multi-channel, Templates, Priority, Tracking
// ============================================================================

type NotificationPriority string

const (
	NotificationPriorityLow      NotificationPriority = "LOW"
	NotificationPriorityNormal   NotificationPriority = "NORMAL"
	NotificationPriorityHigh     NotificationPriority = "HIGH"
	NotificationPriorityUrgent   NotificationPriority = "URGENT"
	NotificationPriorityCritical NotificationPriority = "CRITICAL"
)

type NotificationStatus string

const (
	NotificationStatusDraft     NotificationStatus = "DRAFT"
	NotificationStatusScheduled NotificationStatus = "SCHEDULED"
	NotificationStatusQueued    NotificationStatus = "QUEUED"
	NotificationStatusSending   NotificationStatus = "SENDING"
	NotificationStatusSent      NotificationStatus = "SENT"
	NotificationStatusDelivered NotificationStatus = "DELIVERED"
	NotificationStatusFailed    NotificationStatus = "FAILED"
	NotificationStatusCanceled  NotificationStatus = "CANCELED"
)

type NotificationType string

const (
	NotificationTypeInfo     NotificationType = "INFO"
	NotificationTypeSuccess  NotificationType = "SUCCESS"
	NotificationTypeWarning  NotificationType = "WARNING"
	NotificationTypeError    NotificationType = "ERROR"
	NotificationTypeAlert    NotificationType = "ALERT"
	NotificationTypeMarketing NotificationType = "MARKETING"
)

// JSONB type for PostgreSQL jsonb
type JSONB map[string]interface{}

func (j *JSONB) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan JSONB")
	}
	return json.Unmarshal(bytes, j)
}

func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// ============================================================================
// Notification Model (31 fields)
// ============================================================================

type Notification struct {
	// ========== Identity (4 fields) ==========
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`
	TemplateID *uuid.UUID `gorm:"column:template_id;type:uuid;index" json:"template_id,omitempty"`

	// ========== Notification Info (7 fields) ==========
	Title       string               `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Message     string               `gorm:"column:message;type:text;not null" json:"message"`
	Type        NotificationType     `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Priority    NotificationPriority `gorm:"column:priority;type:varchar(20);not null;index" json:"priority"`
	Status      NotificationStatus   `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Icon        *string              `gorm:"column:icon;type:varchar(100)" json:"icon,omitempty"`
	ImageURL    *string              `gorm:"column:image_url;type:text" json:"image_url,omitempty"`

	// ========== Recipients (3 fields) ==========
	RecipientUserID  *uuid.UUID `gorm:"column:recipient_user_id;type:uuid;index" json:"recipient_user_id,omitempty"`
	RecipientEmail   *string    `gorm:"column:recipient_email;type:varchar(255)" json:"recipient_email,omitempty"`
	RecipientPhone   *string    `gorm:"column:recipient_phone;type:varchar(50)" json:"recipient_phone,omitempty"`

	// ========== Content (3 fields) ==========
	Data        JSONB   `gorm:"column:data;type:jsonb" json:"data,omitempty"`
	ActionURL   *string `gorm:"column:action_url;type:text" json:"action_url,omitempty"`
	ActionLabel *string `gorm:"column:action_label;type:varchar(100)" json:"action_label,omitempty"`

	// ========== Delivery Channels (4 fields) ==========
	SendEmail   bool `gorm:"column:send_email;default:false" json:"send_email"`
	SendSMS     bool `gorm:"column:send_sms;default:false" json:"send_sms"`
	SendPush    bool `gorm:"column:send_push;default:false" json:"send_push"`
	SendInApp   bool `gorm:"column:send_in_app;default:true" json:"send_in_app"`

	// ========== Read Status (4 fields) ==========
	IsRead      bool       `gorm:"column:is_read;default:false;index" json:"is_read"`
	ReadAt      *time.Time `gorm:"column:read_at" json:"read_at,omitempty"`
	IsClicked   bool       `gorm:"column:is_clicked;default:false" json:"is_clicked"`
	ClickedAt   *time.Time `gorm:"column:clicked_at" json:"clicked_at,omitempty"`

	// ========== Scheduling (2 fields) ==========
	ScheduledAt *time.Time `gorm:"column:scheduled_at;index" json:"scheduled_at,omitempty"`
	ExpiresAt   *time.Time `gorm:"column:expires_at;index" json:"expires_at,omitempty"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	SentAt    *time.Time `gorm:"column:sent_at" json:"sent_at,omitempty"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// ========== Soft Delete (2 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Category  *NotificationCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Template  *NotificationTemplate `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
	Deliveries []NotificationDelivery `gorm:"foreignKey:NotificationID" json:"deliveries,omitempty"`
}

func (Notification) TableName() string {
	return "notifications"
}

// Helper Methods
func (n *Notification) MarkAsRead() {
	n.IsRead = true
	now := time.Now()
	n.ReadAt = &now
}

func (n *Notification) MarkAsClicked() {
	n.IsClicked = true
	now := time.Now()
	n.ClickedAt = &now
	
	if !n.IsRead {
		n.MarkAsRead()
	}
}

func (n *Notification) IsExpired() bool {
	return n.ExpiresAt != nil && time.Now().After(*n.ExpiresAt)
}

func (n *Notification) IsScheduled() bool {
	return n.ScheduledAt != nil && time.Now().Before(*n.ScheduledAt)
}

func (n *Notification) GetChannels() []string {
	channels := []string{}
	if n.SendInApp {
		channels = append(channels, "in_app")
	}
	if n.SendEmail {
		channels = append(channels, "email")
	}
	if n.SendSMS {
		channels = append(channels, "sms")
	}
	if n.SendPush {
		channels = append(channels, "push")
	}
	return channels
}

// ============================================================================
// NOTIFICATION TEMPLATE - Reusable Templates
// ============================================================================

type TemplateStatus string

const (
	TemplateStatusDraft    TemplateStatus = "DRAFT"
	TemplateStatusActive   TemplateStatus = "ACTIVE"
	TemplateStatusInactive TemplateStatus = "INACTIVE"
	TemplateStatusArchived TemplateStatus = "ARCHIVED"
)

type NotificationTemplate struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Template Info (7 fields)
	Code        string         `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string         `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string        `gorm:"column:description;type:text" json:"description,omitempty"`
	Status      TemplateStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Type        NotificationType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Priority    NotificationPriority `gorm:"column:priority;type:varchar(20);default:'NORMAL'" json:"priority"`
	CategoryID  *uuid.UUID     `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`

	// Template Content (7 fields)
	TitleTemplate   string  `gorm:"column:title_template;type:text;not null" json:"title_template"`
	MessageTemplate string  `gorm:"column:message_template;type:text;not null" json:"message_template"`
	EmailSubject    *string `gorm:"column:email_subject;type:varchar(255)" json:"email_subject,omitempty"`
	EmailTemplate   *string `gorm:"column:email_template;type:text" json:"email_template,omitempty"`
	SMSTemplate     *string `gorm:"column:sms_template;type:text" json:"sms_template,omitempty"`
	PushTemplate    *string `gorm:"column:push_template;type:text" json:"push_template,omitempty"`
	Icon            *string `gorm:"column:icon;type:varchar(100)" json:"icon,omitempty"`

	// Variables (2 fields)
	Variables       JSONB  `gorm:"column:variables;type:jsonb" json:"variables,omitempty"` // Required variables
	DefaultData     JSONB  `gorm:"column:default_data;type:jsonb" json:"default_data,omitempty"` // Default values

	// Default Channels (4 fields)
	DefaultEmail bool `gorm:"column:default_email;default:false" json:"default_email"`
	DefaultSMS   bool `gorm:"column:default_sms;default:false" json:"default_sms"`
	DefaultPush  bool `gorm:"column:default_push;default:false" json:"default_push"`
	DefaultInApp bool `gorm:"column:default_in_app;default:true" json:"default_in_app"`

	// Statistics (2 fields)
	UsageCount   int64      `gorm:"column:usage_count;default:0" json:"usage_count"`
	LastUsedAt   *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Category *NotificationCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (NotificationTemplate) TableName() string {
	return "notification_templates"
}

func (t *NotificationTemplate) IsActive() bool {
	return t.Status == TemplateStatusActive
}

func (t *NotificationTemplate) Render(data map[string]interface{}) (string, string) {
	title := t.renderTemplate(t.TitleTemplate, data)
	message := t.renderTemplate(t.MessageTemplate, data)
	return title, message
}

func (t *NotificationTemplate) renderTemplate(template string, data map[string]interface{}) string {
	result := template
	for key, value := range data {
		placeholder := fmt.Sprintf("{{%s}}", key)
		result = strings.ReplaceAll(result, placeholder, fmt.Sprintf("%v", value))
	}
	return result
}

func (t *NotificationTemplate) IncrementUsage() {
	t.UsageCount++
	now := time.Now()
	t.LastUsedAt = &now
}

// ============================================================================
// NOTIFICATION CATEGORY - Categories
// ============================================================================

type NotificationCategory struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Category Info (6 fields)
	Code        string  `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string  `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	Icon        *string `gorm:"column:icon;type:varchar(100)" json:"icon,omitempty"`
	Color       *string `gorm:"column:color;type:varchar(20)" json:"color,omitempty"`
	IsActive    bool    `gorm:"column:is_active;default:true" json:"is_active"`

	// Default Settings (4 fields)
	DefaultEmail bool `gorm:"column:default_email;default:false" json:"default_email"`
	DefaultSMS   bool `gorm:"column:default_sms;default:false" json:"default_sms"`
	DefaultPush  bool `gorm:"column:default_push;default:false" json:"default_push"`
	DefaultInApp bool `gorm:"column:default_in_app;default:true" json:"default_in_app"`

	// Statistics (2 fields)
	NotificationCount int64      `gorm:"column:notification_count;default:0" json:"notification_count"`
	LastUsedAt        *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Templates []NotificationTemplate `gorm:"foreignKey:CategoryID" json:"templates,omitempty"`
}

func (NotificationCategory) TableName() string {
	return "notification_categories"
}

// ============================================================================
// NOTIFICATION PREFERENCE - User Preferences
// ============================================================================

type NotificationPreference struct {
	// Identity (3 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	UserID     uuid.UUID  `gorm:"column:user_id;type:uuid;not null;uniqueIndex:idx_user_category" json:"user_id"`
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;uniqueIndex:idx_user_category" json:"category_id,omitempty"`

	// Channel Preferences (4 fields)
	EnableEmail bool `gorm:"column:enable_email;default:true" json:"enable_email"`
	EnableSMS   bool `gorm:"column:enable_sms;default:true" json:"enable_sms"`
	EnablePush  bool `gorm:"column:enable_push;default:true" json:"enable_push"`
	EnableInApp bool `gorm:"column:enable_in_app;default:true" json:"enable_in_app"`

	// Frequency (3 fields)
	Frequency      string  `gorm:"column:frequency;type:varchar(20);default:'REALTIME'" json:"frequency"` // REALTIME, HOURLY, DAILY, WEEKLY
	QuietHoursFrom *string `gorm:"column:quiet_hours_from;type:varchar(5)" json:"quiet_hours_from,omitempty"` // HH:MM
	QuietHoursTo   *string `gorm:"column:quiet_hours_to;type:varchar(5)" json:"quiet_hours_to,omitempty"`   // HH:MM

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Category *NotificationCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (NotificationPreference) TableName() string {
	return "notification_preferences"
}

func (p *NotificationPreference) IsChannelEnabled(channel string) bool {
	switch channel {
	case "email":
		return p.EnableEmail
	case "sms":
		return p.EnableSMS
	case "push":
		return p.EnablePush
	case "in_app":
		return p.EnableInApp
	default:
		return false
	}
}

func (p *NotificationPreference) IsInQuietHours() bool {
	if p.QuietHoursFrom == nil || p.QuietHoursTo == nil {
		return false
	}

	now := time.Now()
	currentTime := fmt.Sprintf("%02d:%02d", now.Hour(), now.Minute())

	return currentTime >= *p.QuietHoursFrom && currentTime <= *p.QuietHoursTo
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateNotification creates a new notification
func CreateNotification(
	db *gorm.DB,
	notification *Notification,
	userID *uuid.UUID,
) error {
	notification.CreatedBy = userID
	notification.Status = NotificationStatusQueued

	// Set default expiry if not set (30 days)
	if notification.ExpiresAt == nil {
		expiresAt := time.Now().AddDate(0, 0, 30)
		notification.ExpiresAt = &expiresAt
	}

	return db.Create(notification).Error
}

// CreateFromTemplate creates notification from template
func CreateFromTemplate(
	db *gorm.DB,
	templateCode string,
	recipientUserID uuid.UUID,
	data map[string]interface{},
	userID *uuid.UUID,
) (*Notification, error) {
	// Get template
	var template NotificationTemplate
	if err := db.Where("code = ? AND status = ?", templateCode, TemplateStatusActive).
		First(&template).Error; err != nil {
		return nil, err
	}

	// Render template
	title, message := template.Render(data)

	// Create notification
	notification := &Notification{
		TenantID:         template.TenantID,
		CategoryID:       template.CategoryID,
		TemplateID:       &template.ID,
		Title:            title,
		Message:          message,
		Type:             template.Type,
		Priority:         template.Priority,
		RecipientUserID:  &recipientUserID,
		Data:             data,
		SendEmail:        template.DefaultEmail,
		SendSMS:          template.DefaultSMS,
		SendPush:         template.DefaultPush,
		SendInApp:        template.DefaultInApp,
		Status:           NotificationStatusQueued,
		CreatedBy:        userID,
	}

	if err := db.Create(notification).Error; err != nil {
		return nil, err
	}

	// Update template usage
	template.IncrementUsage()
	db.Save(&template)

	return notification, nil
}

// SendNotification sends a notification to a user
func SendNotification(
	db *gorm.DB,
	userID uuid.UUID,
	title, message string,
	notifType NotificationType,
	priority NotificationPriority,
	data map[string]interface{},
) error {
	notification := &Notification{
		Title:           title,
		Message:         message,
		Type:            notifType,
		Priority:        priority,
		RecipientUserID: &userID,
		Data:            data,
		SendInApp:       true,
		Status:          NotificationStatusQueued,
	}

	return CreateNotification(db, notification, nil)
}

// GetUserNotifications gets notifications for a user
func GetUserNotifications(
	db *gorm.DB,
	userID uuid.UUID,
	unreadOnly bool,
	limit int,
) ([]Notification, error) {
	query := db.Where("recipient_user_id = ?", userID).
		Order("created_at DESC")

	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	// Exclude expired
	query = query.Where("expires_at IS NULL OR expires_at > ?", time.Now())

	var notifications []Notification
	err := query.Limit(limit).
		Preload("Category").
		Preload("Template").
		Find(&notifications).Error

	return notifications, err
}

// MarkAsRead marks notifications as read
func MarkAsRead(db *gorm.DB, notificationIDs []uuid.UUID) error {
	now := time.Now()
	return db.Model(&Notification{}).
		Where("_id IN ?", notificationIDs).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// MarkAllAsRead marks all user notifications as read
func MarkAllAsRead(db *gorm.DB, userID uuid.UUID) error {
	now := time.Now()
	return db.Model(&Notification{}).
		Where("recipient_user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// GetUnreadCount gets unread notification count
func GetUnreadCount(db *gorm.DB, userID uuid.UUID) (int64, error) {
	var count int64
	err := db.Model(&Notification{}).
		Where("recipient_user_id = ? AND is_read = ?", userID, false).
		Where("expires_at IS NULL OR expires_at > ?", time.Now()).
		Count(&count).Error

	return count, err
}

// GetUserPreferences gets user notification preferences
func GetUserPreferences(
	db *gorm.DB,
	userID uuid.UUID,
	categoryID *uuid.UUID,
) (*NotificationPreference, error) {
	var pref NotificationPreference
	query := db.Where("user_id = ?", userID)

	if categoryID != nil {
		query = query.Where("category_id = ?", categoryID)
	} else {
		query = query.Where("category_id IS NULL")
	}

	err := query.First(&pref).Error
	if err == gorm.ErrRecordNotFound {
		// Create default preferences
		pref = NotificationPreference{
			UserID:      userID,
			CategoryID:  categoryID,
			EnableEmail: true,
			EnableSMS:   true,
			EnablePush:  true,
			EnableInApp: true,
			Frequency:   "REALTIME",
		}
		err = db.Create(&pref).Error
	}

	return &pref, err
}

// UpdatePreferences updates user notification preferences
func UpdatePreferences(
	db *gorm.DB,
	userID uuid.UUID,
	categoryID *uuid.UUID,
	updates map[string]interface{},
) error {
	pref, err := GetUserPreferences(db, userID, categoryID)
	if err != nil {
		return err
	}

	return db.Model(pref).Updates(updates).Error
}

// CleanupExpiredNotifications removes expired notifications
func CleanupExpiredNotifications(db *gorm.DB) error {
	return db.Where("expires_at IS NOT NULL AND expires_at < ?", time.Now()).
		Delete(&Notification{}).Error
}

// CleanupOldReadNotifications removes old read notifications
func CleanupOldReadNotifications(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("is_read = ? AND read_at < ?", true, cutoff).
		Delete(&Notification{}).Error
}

func strPtr(s string) *string {
	return &s
}
