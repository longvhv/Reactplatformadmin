package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type NotificationService struct {
	notificationRepo repository.NotificationRepository
	templateService  *NotificationTemplateService
	cacheService     *CacheService
}

func NewNotificationService(notificationRepo repository.NotificationRepository, templateService *NotificationTemplateService, cacheService *CacheService) *NotificationService {
	return &NotificationService{
		notificationRepo: notificationRepo,
		templateService:  templateService,
		cacheService:     cacheService,
	}
}

type SendNotificationRequest struct {
	UserID       uuid.UUID              `json:"user_id" binding:"required"`
	TenantID     uuid.UUID              `json:"tenant_id" binding:"required"`
	Type         string                 `json:"type" binding:"required"`
	Channel      string                 `json:"channel" binding:"required"`
	Title        string                 `json:"title" binding:"required"`
	Message      string                 `json:"message" binding:"required"`
	Priority     string                 `json:"priority"`
	Category     *string                `json:"category"`
	ActionURL    *string                `json:"action_url"`
	ActionLabel  *string                `json:"action_label"`
	ImageURL     *string                `json:"image_url"`
	Data         map[string]interface{} `json:"data"`
	ScheduledFor *string                `json:"scheduled_for"`
	ExpiresAt    *string                `json:"expires_at"`
}

type SendBulkNotificationRequest struct {
	UserIDs      []uuid.UUID            `json:"user_ids" binding:"required"`
	TenantID     uuid.UUID              `json:"tenant_id" binding:"required"`
	Type         string                 `json:"type" binding:"required"`
	Channel      string                 `json:"channel" binding:"required"`
	Title        string                 `json:"title" binding:"required"`
	Message      string                 `json:"message" binding:"required"`
	Priority     string                 `json:"priority"`
	Category     *string                `json:"category"`
	Data         map[string]interface{} `json:"data"`
}

// GetByID gets notification by ID
func (s *NotificationService) GetByID(ctx context.Context, id uuid.UUID) (*models.Notification, error) {
	return s.notificationRepo.GetByID(ctx, id)
}

// ListByUser lists notifications by user
func (s *NotificationService) ListByUser(ctx context.Context, userID uuid.UUID, status string, page, limit int) ([]*models.Notification, int64, error) {
	offset := (page - 1) * limit
	return s.notificationRepo.ListByUser(ctx, userID, status, limit, offset)
}

// GetUnreadNotifications gets unread notifications
func (s *NotificationService) GetUnreadNotifications(ctx context.Context, userID uuid.UUID, limit int) ([]*models.Notification, error) {
	notifications, _, err := s.notificationRepo.ListByUser(ctx, userID, "unread", limit, 0)
	return notifications, err
}

// GetUnreadCount gets unread notification count
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	// Try cache first
	cacheKey := fmt.Sprintf("notification_count:%s", userID)
	var cached int64
	if s.cacheService != nil && s.cacheService.Get(ctx, cacheKey, &cached) == nil {
		return cached, nil
	}

	_, count, err := s.notificationRepo.ListByUser(ctx, userID, "unread", 1, 0)
	if err != nil {
		return 0, err
	}

	// Cache for 1 minute
	if s.cacheService != nil {
		_ = s.cacheService.Set(ctx, cacheKey, count, 1*time.Minute)
	}

	return count, nil
}

// SendNotification sends a notification
func (s *NotificationService) SendNotification(ctx context.Context, req SendNotificationRequest) (*models.Notification, error) {
	// Validate type
	validTypes := []string{"info", "success", "warning", "error", "alert", "reminder", "message", "system"}
	if !containsNotifType(validTypes, req.Type) {
		return nil, fmt.Errorf("invalid type, must be one of: %v", validTypes)
	}

	// Validate channel
	validChannels := []string{"in_app", "email", "sms", "push", "webhook"}
	if !containsNotifType(validChannels, req.Channel) {
		return nil, fmt.Errorf("invalid channel, must be one of: %v", validChannels)
	}

	priority := req.Priority
	if priority == "" {
		priority = "normal"
	}

	data := req.Data
	if data == nil {
		data = make(map[string]interface{})
	}

	var scheduledFor, expiresAt *time.Time
	if req.ScheduledFor != nil && *req.ScheduledFor != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ScheduledFor)
		if err == nil {
			scheduledFor = &parsed
		}
	}
	if req.ExpiresAt != nil && *req.ExpiresAt != "" {
		parsed, err := time.Parse(time.RFC3339, *req.ExpiresAt)
		if err == nil {
			expiresAt = &parsed
		}
	}

	notification := &models.Notification{
		ID:          uuid.New(),
		UserID:      req.UserID,
		TenantID:    req.TenantID,
		Type:        req.Type,
		Channel:     req.Channel,
		Title:       req.Title,
		Message:     req.Message,
		Priority:    priority,
		Category:    req.Category,
		Status:      "unread",
		ActionURL:   req.ActionURL,
		ActionLabel: req.ActionLabel,
		ImageURL:    req.ImageURL,
		Data:        data,
		ScheduledFor: scheduledFor,
		ExpiresAt:   expiresAt,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// If scheduled for future, set status to scheduled
	if scheduledFor != nil && scheduledFor.After(time.Now()) {
		notification.Status = "scheduled"
	}

	if err := s.notificationRepo.Create(ctx, notification); err != nil {
		return nil, fmt.Errorf("failed to send notification: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, req.UserID)

	// In production, send to notification channels (email, push, etc.)
	go s.deliverNotification(notification)

	return notification, nil
}

// SendBulkNotification sends bulk notifications
func (s *NotificationService) SendBulkNotification(ctx context.Context, req SendBulkNotificationRequest) (int, error) {
	count := 0
	for _, userID := range req.UserIDs {
		notification := SendNotificationRequest{
			UserID:   userID,
			TenantID: req.TenantID,
			Type:     req.Type,
			Channel:  req.Channel,
			Title:    req.Title,
			Message:  req.Message,
			Priority: req.Priority,
			Category: req.Category,
			Data:     req.Data,
		}

		_, err := s.SendNotification(ctx, notification)
		if err == nil {
			count++
		}
	}

	return count, nil
}

// MarkAsRead marks notification as read
func (s *NotificationService) MarkAsRead(ctx context.Context, id uuid.UUID) (*models.Notification, error) {
	notification, err := s.notificationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("notification not found: %w", err)
	}

	if notification.Status == "unread" {
		now := time.Now()
		notification.Status = "read"
		notification.ReadAt = &now
		notification.UpdatedAt = now

		if err := s.notificationRepo.Update(ctx, notification); err != nil {
			return nil, fmt.Errorf("failed to mark as read: %w", err)
		}

		// Invalidate cache
		s.invalidateCache(ctx, notification.UserID)
	}

	return notification, nil
}

// MarkAllAsRead marks all notifications as read
func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) (int, error) {
	notifications, _, err := s.notificationRepo.ListByUser(ctx, userID, "unread", 10000, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	now := time.Now()
	for _, notification := range notifications {
		notification.Status = "read"
		notification.ReadAt = &now
		notification.UpdatedAt = now
		if err := s.notificationRepo.Update(ctx, notification); err == nil {
			count++
		}
	}

	// Invalidate cache
	s.invalidateCache(ctx, userID)

	return count, nil
}

// DeleteNotification deletes a notification
func (s *NotificationService) DeleteNotification(ctx context.Context, id uuid.UUID) error {
	notification, err := s.notificationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if err := s.notificationRepo.Delete(ctx, id); err != nil {
		return err
	}

	// Invalidate cache
	s.invalidateCache(ctx, notification.UserID)

	return nil
}

// DeleteAllNotifications deletes all notifications
func (s *NotificationService) DeleteAllNotifications(ctx context.Context, userID uuid.UUID) (int, error) {
	notifications, _, err := s.notificationRepo.ListByUser(ctx, userID, "", 10000, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, notification := range notifications {
		if err := s.notificationRepo.Delete(ctx, notification.ID); err == nil {
			count++
		}
	}

	// Invalidate cache
	s.invalidateCache(ctx, userID)

	return count, nil
}

// ArchiveNotification archives a notification
func (s *NotificationService) ArchiveNotification(ctx context.Context, id uuid.UUID) (*models.Notification, error) {
	notification, err := s.notificationRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("notification not found: %w", err)
	}

	now := time.Now()
	notification.Status = "archived"
	notification.ArchivedAt = &now
	notification.UpdatedAt = now

	if err := s.notificationRepo.Update(ctx, notification); err != nil {
		return nil, fmt.Errorf("failed to archive notification: %w", err)
	}

	// Invalidate cache
	s.invalidateCache(ctx, notification.UserID)

	return notification, nil
}

// GetNotificationPreferences gets notification preferences
func (s *NotificationService) GetNotificationPreferences(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	// In production, get from user_preferences table
	// For now, return defaults
	preferences := map[string]interface{}{
		"email_enabled":    true,
		"push_enabled":     true,
		"sms_enabled":      false,
		"in_app_enabled":   true,
		"quiet_hours": map[string]interface{}{
			"enabled": false,
			"start":   "22:00",
			"end":     "08:00",
		},
		"categories": map[string]bool{
			"security":  true,
			"updates":   true,
			"marketing": false,
			"social":    true,
			"system":    true,
		},
	}

	return preferences, nil
}

// UpdateNotificationPreferences updates notification preferences
func (s *NotificationService) UpdateNotificationPreferences(ctx context.Context, userID uuid.UUID, preferences map[string]interface{}) (map[string]interface{}, error) {
	// In production, update user_preferences table
	// For now, just return the preferences
	return preferences, nil
}

// deliverNotification delivers notification to channels
func (s *NotificationService) deliverNotification(notification *models.Notification) {
	// In production, send to actual channels
	switch notification.Channel {
	case "email":
		// Send email
	case "sms":
		// Send SMS
	case "push":
		// Send push notification
	case "webhook":
		// Send webhook
	}
}

// CleanupExpiredNotifications removes expired notifications
func (s *NotificationService) CleanupExpiredNotifications(ctx context.Context) (int, error) {
	// This would typically be run as a cron job
	notifications, _, err := s.notificationRepo.ListByUser(ctx, uuid.Nil, "", 100000, 0)
	if err != nil {
		return 0, err
	}

	count := 0
	now := time.Now()
	for _, notification := range notifications {
		if notification.ExpiresAt != nil && notification.ExpiresAt.Before(now) {
			_ = s.notificationRepo.Delete(ctx, notification.ID)
			count++
		}
	}

	return count, nil
}

// Helper functions
func (s *NotificationService) invalidateCache(ctx context.Context, userID uuid.UUID) {
	if s.cacheService != nil {
		cacheKey := fmt.Sprintf("notification_count:%s", userID)
		_ = s.cacheService.Delete(ctx, cacheKey)
	}
}

func containsNotifType(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
