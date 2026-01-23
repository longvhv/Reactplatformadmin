package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
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
	Description *string                `json:"description"`
	URL         string                 `json:"url" binding:"required"`
	Method      string                 `json:"method"`
	EventTypes  []string               `json:"event_types" binding:"required"`
	EventFilter map[string]interface{} `json:"event_filter"`
	AuthType    string                 `json:"auth_type"`
	AuthConfig  map[string]interface{} `json:"auth_config"`
	Headers     map[string]interface{} `json:"headers"`
	TimeoutMs   int                    `json:"timeout_ms"`
	RetryConfig map[string]interface{} `json:"retry_config"`
	BatchSize   *int                   `json:"batch_size"`
	RateLimit   *int                   `json:"rate_limit"`
	Priority    int                    `json:"priority"`
	Tags        []string               `json:"tags"`
	Metadata    map[string]interface{} `json:"metadata"`
	CreatedBy   uuid.UUID              `json:"-"`
}

type UpdateWebhookRequest struct {
	Name        *string                `json:"name"`
	Description *string                `json:"description"`
	URL         *string                `json:"url"`
	Method      *string                `json:"method"`
	EventTypes  []string               `json:"event_types"`
	EventFilter map[string]interface{} `json:"event_filter"`
	AuthType    *string                `json:"auth_type"`
	AuthConfig  map[string]interface{} `json:"auth_config"`
	Headers     map[string]interface{} `json:"headers"`
	TimeoutMs   *int                   `json:"timeout_ms"`
	RetryConfig map[string]interface{} `json:"retry_config"`
	BatchSize   *int                   `json:"batch_size"`
	RateLimit   *int                   `json:"rate_limit"`
	Priority    *int                   `json:"priority"`
	Tags        []string               `json:"tags"`
	Metadata    map[string]interface{} `json:"metadata"`
	UpdatedBy   uuid.UUID              `json:"-"`
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
	// Generate secret key
	secretKey, err := s.generateSecretKey()
	if err != nil {
		return nil, fmt.Errorf("failed to generate secret key: %w", err)
	}

	// Generate verification token
	verificationToken, err := s.generateVerificationToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate verification token: %w", err)
	}

	method := req.Method
	if method == "" {
		method = "POST"
	}

	authType := req.AuthType
	if authType == "" {
		authType = "none"
	}

	timeoutMs := req.TimeoutMs
	if timeoutMs == 0 {
		timeoutMs = 5000
	}

	retryConfig := req.RetryConfig
	if retryConfig == nil {
		retryConfig = map[string]interface{}{
			"max_retries":        3,
			"retry_delay":        1000,
			"backoff_multiplier": 2,
		}
	}

	headers := req.Headers
	if headers == nil {
		headers = make(map[string]interface{})
	}

	metadata := req.Metadata
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	webhook := &models.Webhook{
		ID:                uuid.New(),
		TenantID:          req.TenantID,
		Name:              req.Name,
		Description:       req.Description,
		URL:               req.URL,
		Method:            method,
		EventTypes:        req.EventTypes,
		EventFilter:       req.EventFilter,
		SecretKey:         &secretKey,
		AuthType:          authType,
		AuthConfig:        req.AuthConfig,
		Headers:           headers,
		TimeoutMs:         timeoutMs,
		RetryConfig:       retryConfig,
		IsActive:          true,
		IsVerified:        false,
		VerificationToken: &verificationToken,
		SuccessCount:      0,
		FailureCount:      0,
		TotalCount:        0,
		BatchSize:         req.BatchSize,
		RateLimit:         req.RateLimit,
		Priority:          req.Priority,
		Tags:              req.Tags,
		Metadata:          metadata,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
		CreatedBy:         &req.CreatedBy,
		Version:           1,
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
	if req.Description != nil {
		webhook.Description = req.Description
	}
	if req.URL != nil {
		webhook.URL = *req.URL
		webhook.IsVerified = false // Need to re-verify if URL changed
	}
	if req.Method != nil {
		webhook.Method = *req.Method
	}
	if req.EventTypes != nil {
		webhook.EventTypes = req.EventTypes
	}
	if req.EventFilter != nil {
		webhook.EventFilter = req.EventFilter
	}
	if req.AuthType != nil {
		webhook.AuthType = *req.AuthType
	}
	if req.AuthConfig != nil {
		webhook.AuthConfig = req.AuthConfig
	}
	if req.Headers != nil {
		webhook.Headers = req.Headers
	}
	if req.TimeoutMs != nil {
		webhook.TimeoutMs = *req.TimeoutMs
	}
	if req.RetryConfig != nil {
		webhook.RetryConfig = req.RetryConfig
	}
	if req.BatchSize != nil {
		webhook.BatchSize = req.BatchSize
	}
	if req.RateLimit != nil {
		webhook.RateLimit = req.RateLimit
	}
	if req.Priority != nil {
		webhook.Priority = *req.Priority
	}
	if req.Tags != nil {
		webhook.Tags = req.Tags
	}
	if req.Metadata != nil {
		webhook.Metadata = req.Metadata
	}

	webhook.UpdatedAt = time.Now()
	webhook.UpdatedBy = &req.UpdatedBy
	webhook.Version++

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
	webhook.Version++

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
	webhook.Version++

	if err := s.webhookRepo.Update(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to disable webhook: %w", err)
	}

	return webhook, nil
}

// VerifyWebhook verifies a webhook
func (s *WebhookService) VerifyWebhook(ctx context.Context, id uuid.UUID) (*models.Webhook, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	now := time.Now()
	webhook.IsVerified = true
	webhook.VerifiedAt = &now
	webhook.UpdatedAt = now
	webhook.Version++

	if err := s.webhookRepo.Update(ctx, webhook); err != nil {
		return nil, fmt.Errorf("failed to verify webhook: %w", err)
	}

	return webhook, nil
}

// TestWebhook tests a webhook
func (s *WebhookService) TestWebhook(ctx context.Context, id uuid.UUID, payload map[string]interface{}) (map[string]interface{}, error) {
	webhook, err := s.webhookRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("webhook not found: %w", err)
	}

	// Send test request
	result, err := s.sendWebhookRequest(webhook, payload)
	if err != nil {
		return map[string]interface{}{
			"success": false,
			"error":   err.Error(),
		}, nil
	}

	return map[string]interface{}{
		"success":      true,
		"status_code":  result["status_code"],
		"response":     result["response"],
		"duration_ms":  result["duration_ms"],
	}, nil
}

// TriggerWebhook triggers a webhook for an event
func (s *WebhookService) TriggerWebhook(ctx context.Context, tenantID uuid.UUID, eventType string, payload map[string]interface{}) error {
	webhooks, _, err := s.webhookRepo.ListByTenant(ctx, tenantID, eventType, 1000, 0)
	if err != nil {
		return fmt.Errorf("failed to get webhooks: %w", err)
	}

	for _, webhook := range webhooks {
		if !webhook.IsActive {
			continue
		}

		// Check if webhook handles this event type
		if !s.hasEventType(webhook.EventTypes, eventType) {
			continue
		}

		// Send webhook asynchronously
		go s.sendWebhookAsync(webhook, eventType, payload)
	}

	return nil
}

// GetDeliveries gets webhook deliveries (mock implementation)
func (s *WebhookService) GetDeliveries(ctx context.Context, webhookID uuid.UUID, page, limit int) ([]map[string]interface{}, int64, error) {
	// This would typically query a webhook_deliveries table
	// For now, return empty result
	deliveries := []map[string]interface{}{}
	return deliveries, 0, nil
}

// Helper functions
func (s *WebhookService) generateSecretKey() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func (s *WebhookService) generateVerificationToken() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func (s *WebhookService) sendWebhookRequest(webhook *models.Webhook, payload map[string]interface{}) (map[string]interface{}, error) {
	start := time.Now()

	// Prepare payload
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	// Create request
	req, err := http.NewRequest(webhook.Method, webhook.URL, strings.NewReader(string(payloadBytes)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "VHV-Webhook/1.0")

	// Add custom headers
	for key, value := range webhook.Headers {
		if strVal, ok := value.(string); ok {
			req.Header.Set(key, strVal)
		}
	}

	// Add signature
	if webhook.SecretKey != nil {
		signature := s.generateSignature(payloadBytes, *webhook.SecretKey)
		req.Header.Set("X-Webhook-Signature", signature)
	}

	// Send request
	client := &http.Client{
		Timeout: time.Duration(webhook.TimeoutMs) * time.Millisecond,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	respBody, _ := io.ReadAll(resp.Body)

	duration := time.Since(start).Milliseconds()

	return map[string]interface{}{
		"status_code": resp.StatusCode,
		"response":    string(respBody),
		"duration_ms": duration,
	}, nil
}

func (s *WebhookService) sendWebhookAsync(webhook *models.Webhook, eventType string, payload map[string]interface{}) {
	now := time.Now()

	// Add event metadata
	fullPayload := map[string]interface{}{
		"event_type": eventType,
		"timestamp":  now.Unix(),
		"data":       payload,
	}

	result, err := s.sendWebhookRequest(webhook, fullPayload)

	// Update statistics
	webhook.TotalCount++
	webhook.LastTriggeredAt = &now

	if err == nil {
		if statusCode, ok := result["status_code"].(int); ok && statusCode >= 200 && statusCode < 300 {
			webhook.SuccessCount++
			webhook.LastSuccessAt = &now
		} else {
			webhook.FailureCount++
			webhook.LastFailureAt = &now
		}
	} else {
		webhook.FailureCount++
		webhook.LastFailureAt = &now
	}

	// Update average response time
	if duration, ok := result["duration_ms"].(int64); ok {
		if webhook.AvgResponseTimeMs == nil {
			webhook.AvgResponseTimeMs = new(int)
			*webhook.AvgResponseTimeMs = int(duration)
		} else {
			*webhook.AvgResponseTimeMs = (*webhook.AvgResponseTimeMs + int(duration)) / 2
		}
	}

	_ = s.webhookRepo.Update(context.Background(), webhook)
}

func (s *WebhookService) generateSignature(payload []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(payload)
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}

func (s *WebhookService) hasEventType(eventTypes []string, eventType string) bool {
	for _, et := range eventTypes {
		if et == eventType {
			return true
		}
	}
	return false
}
