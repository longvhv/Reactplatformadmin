package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository"
)

type WebhookService struct {
	webhookRepo repository.WebhookRepository
}

func NewWebhookService(webhookRepo repository.WebhookRepository) *WebhookService {
	return &WebhookService{
		webhookRepo: webhookRepo,
	}
}

type CreateWebhookRequest struct {
	TenantID    uuid.UUID              `json:"tenant_id" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	URL         string                 `json:"url" binding:"required,url"`
	Events      []string               `json:"events" binding:"required"`
	Description *string                `json:"description"`
	Headers     map[string]string      `json:"headers"`
	Timeout     *int                   `json:"timeout"`
	RetryConfig map[string]interface{} `json:"retry_config"`
	CreatedBy   uuid.UUID              `json:"-"`
}

type UpdateWebhookRequest struct {
	Name        *string                `json:"name"`
	URL         *string                `json:"url"`
	Events      []string               `json:"events"`
	Description *string                `json:"description"`
	Headers     map[string]string      `json:"headers"`
	Timeout     *int                   `json:"timeout"`
	RetryConfig map[string]interface{} `json:"retry_config"`
}

// GetByID gets webhook by ID
func (s *WebhookService) GetByID(ctx context.Context, id uuid.UUID) (*models.Webhook, error) {
	return s.webhookRepo.GetByID(ctx, id)
}

// ListByTenant lists webhooks by tenant
func (s *WebhookService) ListByTenant(ctx context.Context, tenantID uuid.UUID, eventType string, page, limit int) ([]*models.Webhook, int64, error) {
	offset := (page - 1) * limit
	return s.webhookRepo.ListByTenant(ctx, tenantID, eventType, limit, offset)
}

// CreateWebhook creates a new webhook
func (s *WebhookService) CreateWebhook(ctx context.Context, req CreateWebhookRequest) (*models.Webhook, error) {
	// Validate events
	validEvents := []string{
		"user.created", "user.updated", "user.deleted",
		"tenant.created", "tenant.updated", "tenant.deleted",
		"order.created", "order.updated", "order.completed", "order.cancelled",
		"payment.succeeded", "payment.failed",
		"invoice.created", "invoice.paid",
		"subscription.created", "subscription.cancelled",
		"data.exported", "file.uploaded",
		"custom.*",
	}

	for _, event := range req.Events {
		if !s.isValidEvent(event, validEvents) {
			return nil, fmt.Errorf("invalid event: %s", event)
		}
	}

	// Generate secret
	secret := s.generateSecret()

	headers := req.Headers
	if headers == nil {
		headers = make(map[string]string)
	}

	timeout := 30
	if req.Timeout != nil {
		timeout = *req.Timeout
	}

	retryConfig := req.RetryConfig
	if retryConfig == nil {
		retryConfig = map[string]interface{}{
			"max_retries": 3,
			"backoff":     "exponential",
		}
	}

	webhook := &models.Webhook{
		ID:              uuid.New(),
		TenantID:        req.TenantID,
		Name:            req.Name,
		URL:             req.URL,
		Events:          req.Events,
		Secret:          secret,
		Description:     req.Description,
		IsActive:        true,
		Headers:         headers,
		Timeout:         timeout,
		RetryConfig:     retryConfig,
		SuccessCount:    0,
		FailureCount:    0,
		LastTriggeredAt: nil,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
		CreatedBy:       &req.CreatedBy,
	}

	if err := s.webhookRepo.Create(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to create webhook: %w", err)
	}

	return webhook, nil
}

// UpdateWebhook updates a webhook
func (s *WebhookService) UpdateWebhook(ctx context.Context, id uuid.UUID, req UpdateWebhookRequest) (*models.Webhook, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	if req.Name != nil {
		webhook.Name = *req.Name
	}
	if req.URL != nil {
		webhook.URL = *req.URL
	}
	if req.Events != nil {
		webhook.Events = req.Events
	}
	if req.Description != nil {
		webhook.Description = req.Description
	}
	if req.Headers != nil {
		webhook.Headers = req.Headers
	}
	if req.Timeout != nil {
		webhook.Timeout = *req.Timeout
	}
	if req.RetryConfig != nil {
		webhook.RetryConfig = req.RetryConfig
	}

	webhook.UpdatedAt = time.Now()

	if err := s.webhookRepo.Update(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to update webhook: %w", err)
	}

	return webhook, nil
}

// DeleteWebhook deletes a webhook
func (s *WebhookService) DeleteWebhook(ctx context.Context, id uuid.UUID) error {
	return s.webhookRepo.Delete(ctx, id)
}

// EnableWebhook enables a webhook
func (s *WebhookService) EnableWebhook(ctx context.Context, id uuid.UUID) (*models.Webhook, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	webhook.IsActive = true
	webhook.UpdatedAt = time.Now()

	if err := s.webhookRepo.Update(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to enable webhook: %w", err)
	}

	return webhook, nil
}

// DisableWebhook disables a webhook
func (s *WebhookService) DisableWebhook(ctx context.Context, id uuid.UUID) (*models.Webhook, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	webhook.IsActive = false
	webhook.UpdatedAt = time.Now()

	if err := s.webhookRepo.Update(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to disable webhook: %w", err)
	}

	return webhook, nil
}

// TestWebhook tests webhook delivery
func (s *WebhookService) TestWebhook(ctx context.Context, id uuid.UUID) (map[string]interface{}, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	testPayload := map[string]interface{}{
		"event":     "webhook.test",
		"timestamp": time.Now(),
		"data": map[string]interface{}{
			"message": "This is a test webhook delivery",
		},
	}

	result, err := s.deliverWebhook(webhook, testPayload)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}, nil
	}

	return result, nil
}

// TriggerWebhook manually triggers a webhook
func (s *WebhookService) TriggerWebhook(ctx context.Context, id uuid.UUID, payload map[string]interface{}) (map[string]interface{}, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	if !webhook.IsActive {
		return nil, fmt.Errorf("webhook is not active")
	}

	result, err := s.deliverWebhook(webhook, payload)
	if err != nil {
		return nil, err
	}

	// Update stats
	now := time.Now()
	webhook.LastTriggeredAt = &now
	if result["success"].(bool) {
		webhook.SuccessCount++
	} else {
		webhook.FailureCount++
	}
	webhook.UpdatedAt = now
	_ = s.webhookRepo.Update(ctx, webhook)

	return result, nil
}

// GetDeliveries gets webhook deliveries (mock)
func (s *WebhookService) GetDeliveries(ctx context.Context, webhookID uuid.UUID, status string, page, limit int) ([]map[string]interface{}, int64, error) {
	// In production, this would query from webhook_deliveries table or ClickHouse
	deliveries := make([]map[string]interface{}, 0)

	for i := 0; i < limit; i++ {
		deliveries = append(deliveries, map[string]interface{}{
			"id":          uuid.New(),
			"webhook_id":  webhookID,
			"event":       "user.created",
			"status":      "success",
			"status_code": 200,
			"attempts":    1,
			"delivered_at": time.Now().Add(-time.Duration(i) * time.Hour),
		})
	}

	return deliveries, int64(len(deliveries)), nil
}

// RetryDelivery retries a failed delivery
func (s *WebhookService) RetryDelivery(ctx context.Context, deliveryID uuid.UUID) (map[string]interface{}, error) {
	// In production, this would get the delivery and retry
	return map[string]interface{}{
		"success":    true,
		"message":    "delivery retried successfully",
		"attempt":    2,
		"retried_at": time.Now(),
	}, nil
}

// GetStats gets webhook statistics
func (s *WebhookService) GetStats(ctx context.Context, webhookID uuid.UUID) (map[string]interface{}, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, webhookID)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	total := webhook.SuccessCount + webhook.FailureCount
	successRate := 0.0
	if total > 0 {
		successRate = float64(webhook.SuccessCount) / float64(total) * 100
	}

	stats := map[string]interface{}{
		"webhook_id":         webhook.ID,
		"name":               webhook.Name,
		"is_active":          webhook.IsActive,
		"success_count":      webhook.SuccessCount,
		"failure_count":      webhook.FailureCount,
		"total_deliveries":   total,
		"success_rate":       successRate,
		"last_triggered_at":  webhook.LastTriggeredAt,
		"created_at":         webhook.CreatedAt,
		"events":             webhook.Events,
		"avg_response_time":  150, // Mock
	}

	return stats, nil
}

// RotateSecret rotates webhook secret
func (s *WebhookService) RotateSecret(ctx context.Context, id uuid.UUID) (*models.Webhook, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	webhook.Secret = s.generateSecret()
	webhook.UpdatedAt = time.Now()

	if err := s.webhookRepo.Update(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to rotate secret: %w", err)
	}

	return webhook, nil
}

// DispatchEvent dispatches an event to matching webhooks
func (s *WebhookService) DispatchEvent(ctx context.Context, tenantID uuid.UUID, event string, payload map[string]interface{}) error {
	webhooks, _, err := s.webhookRepo.ListByTenant(ctx, tenantID, event, 100, 0)
	if err != nil {
		return err
	}

	for _, webhook := range webhooks {
		if !webhook.IsActive {
			continue
		}

		// Check if webhook subscribes to this event
		if !s.matchesEvent(event, webhook.Events) {
			continue
		}

		// Deliver asynchronously
		go func(wh *models.Webhook) {
			_, _ = s.deliverWebhook(wh, payload)
			
			// Update stats
			now := time.Now()
			wh.LastTriggeredAt = &now
			wh.UpdatedAt = now
			_ = s.webhookRepo.Update(ctx, wh)
		}(webhook)
	}

	return nil
}

// deliverWebhook delivers webhook to endpoint
func (s *WebhookService) deliverWebhook(webhook *models.Webhook, payload map[string]interface{}) (map[string]interface{}, error) {
	// Prepare payload
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create request
	req, err := http.NewRequest("POST", webhook.URL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "VHV-Webhook/1.0")
	req.Header.Set("X-Webhook-ID", webhook.ID.String())
	req.Header.Set("X-Webhook-Signature", s.generateSignature(payloadBytes, webhook.Secret))

	for key, value := range webhook.Headers {
		req.Header.Set(key, value)
	}

	// Send request
	client := &http.Client{
		Timeout: time.Duration(webhook.Timeout) * time.Second,
	}

	start := time.Now()
	resp, err := client.Do(req)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		return map[string]interface{}{
			"success":       false,
			"error":         err.Error(),
			"duration_ms":   duration,
			"delivered_at":  time.Now(),
		}, err
	}
	defer resp.Body.Close()

	// Read response
	respBody, _ := io.ReadAll(resp.Body)

	result := map[string]interface{}{
		"success":       resp.StatusCode >= 200 && resp.StatusCode < 300,
		"status_code":   resp.StatusCode,
		"response_body": string(respBody),
		"duration_ms":   duration,
		"delivered_at":  time.Now(),
	}

	return result, nil
}

// Helper functions
func (s *WebhookService) generateSecret() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	secret := make([]byte, 32)
	for i := range secret {
		secret[i] = charset[rand.Intn(len(charset))]
	}
	return string(secret)
}

func (s *WebhookService) generateSignature(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return hex.EncodeToString(h.Sum(nil))
}

func (s *WebhookService) isValidEvent(event string, validEvents []string) bool {
	for _, valid := range validEvents {
		if valid == event || valid == "custom.*" {
			return true
		}
	}
	return false
}

func (s *WebhookService) matchesEvent(event string, subscribedEvents []string) bool {
	for _, subscribed := range subscribedEvents {
		if subscribed == event || subscribed == "*" || subscribed == "custom.*" {
			return true
		}
	}
	return false
}
