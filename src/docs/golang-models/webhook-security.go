package models

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// WEBHOOK SIGNATURE - Signature Management
// ============================================================================
// Purpose: Manage webhook signatures for security
// Table: webhook_signatures
// Primary Key: _id (UUID)
// Features: HMAC signatures, Verification, Expiry
// ============================================================================

type SignatureAlgorithm string

const (
	SignatureAlgorithmHMACSHA256 SignatureAlgorithm = "HMAC_SHA256"
	SignatureAlgorithmHMACSHA512 SignatureAlgorithm = "HMAC_SHA512"
	SignatureAlgorithmRSA        SignatureAlgorithm = "RSA"
)

type WebhookSignature struct {
	// Identity (3 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	DeliveryID uuid.UUID `gorm:"column:delivery_id;type:uuid;not null;index" json:"delivery_id"`
	EndpointID uuid.UUID `gorm:"column:endpoint_id;type:uuid;not null;index" json:"endpoint_id"`

	// Signature Info (5 fields)
	Algorithm      SignatureAlgorithm `gorm:"column:algorithm;type:varchar(30);not null" json:"algorithm"`
	Signature      string             `gorm:"column:signature;type:varchar(512);not null" json:"signature"`
	SignatureVersion string           `gorm:"column:signature_version;type:varchar(20);default:'v1'" json:"signature_version"`
	Timestamp      time.Time          `gorm:"column:timestamp;not null;index" json:"timestamp"`
	ExpiresAt      time.Time          `gorm:"column:expires_at;not null;index" json:"expires_at"`

	// Payload (2 fields)
	PayloadHash string `gorm:"column:payload_hash;type:varchar(64);not null" json:"payload_hash"`
	PayloadSize int    `gorm:"column:payload_size;not null" json:"payload_size"`

	// Verification (3 fields)
	IsVerified   bool       `gorm:"column:is_verified;default:false" json:"is_verified"`
	VerifiedAt   *time.Time `gorm:"column:verified_at" json:"verified_at,omitempty"`
	VerifiedBy   *uuid.UUID `gorm:"column:verified_by;type:uuid" json:"verified_by,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`

	// Relationships
	Delivery *WebhookDelivery `gorm:"foreignKey:DeliveryID" json:"delivery,omitempty"`
	Endpoint *WebhookEndpoint `gorm:"foreignKey:EndpointID" json:"endpoint,omitempty"`
}

func (WebhookSignature) TableName() string {
	return "webhook_signatures"
}

func (s *WebhookSignature) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

// ============================================================================
// WEBHOOK VERIFICATION - Verification Records
// ============================================================================

type VerificationType string

const (
	VerificationTypeChallenge VerificationType = "CHALLENGE"
	VerificationTypePing      VerificationType = "PING"
	VerificationTypeManual    VerificationType = "MANUAL"
)

type VerificationStatus string

const (
	VerificationStatusPending  VerificationStatus = "PENDING"
	VerificationStatusSuccess  VerificationStatus = "SUCCESS"
	VerificationStatusFailed   VerificationStatus = "FAILED"
	VerificationStatusExpired  VerificationStatus = "EXPIRED"
)

type WebhookVerification struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	EndpointID uuid.UUID `gorm:"column:endpoint_id;type:uuid;not null;index" json:"endpoint_id"`

	// Verification Info (5 fields)
	Type          VerificationType   `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Status        VerificationStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Challenge     string             `gorm:"column:challenge;type:varchar(255);not null" json:"challenge"`
	ChallengeResponse *string        `gorm:"column:challenge_response;type:varchar(255)" json:"challenge_response,omitempty"`
	VerificationCode  *string        `gorm:"column:verification_code;type:varchar(100)" json:"verification_code,omitempty"`

	// Timing (3 fields)
	SentAt      time.Time  `gorm:"column:sent_at;not null" json:"sent_at"`
	ExpiresAt   time.Time  `gorm:"column:expires_at;not null;index" json:"expires_at"`
	VerifiedAt  *time.Time `gorm:"column:verified_at" json:"verified_at,omitempty"`

	// Attempt Info (2 fields)
	AttemptCount int `gorm:"column:attempt_count;default:0" json:"attempt_count"`
	MaxAttempts  int `gorm:"column:max_attempts;default:3" json:"max_attempts"`

	// Result (2 fields)
	ResponseStatus *int    `gorm:"column:response_status" json:"response_status,omitempty"`
	ErrorMessage   *string `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	Endpoint *WebhookEndpoint `gorm:"foreignKey:EndpointID" json:"endpoint,omitempty"`
}

func (WebhookVerification) TableName() string {
	return "webhook_verifications"
}

func (v *WebhookVerification) IsExpired() bool {
	return time.Now().After(v.ExpiresAt)
}

func (v *WebhookVerification) CanRetry() bool {
	return v.AttemptCount < v.MaxAttempts && !v.IsExpired()
}

func (v *WebhookVerification) Verify(response string) bool {
	v.AttemptCount++
	
	if v.Challenge == response {
		now := time.Now()
		v.Status = VerificationStatusSuccess
		v.ChallengeResponse = &response
		v.VerifiedAt = &now
		return true
	}

	if !v.CanRetry() {
		v.Status = VerificationStatusFailed
	}

	return false
}

// ============================================================================
// WEBHOOK SECRET - Secret Key Management
// ============================================================================

type SecretStatus string

const (
	SecretStatusActive   SecretStatus = "ACTIVE"
	SecretStatusRotating SecretStatus = "ROTATING"
	SecretStatusRevoked  SecretStatus = "REVOKED"
	SecretStatusExpired  SecretStatus = "EXPIRED"
)

type WebhookSecret struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	EndpointID uuid.UUID `gorm:"column:endpoint_id;type:uuid;not null;index" json:"endpoint_id"`

	// Secret Info (6 fields)
	Name        string       `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Secret      string       `gorm:"column:secret;type:varchar(255);not null" json:"secret"`
	Status      SecretStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Version     int          `gorm:"column:version;not null" json:"version"`
	IsPrimary   bool         `gorm:"column:is_primary;default:false" json:"is_primary"`
	Description *string      `gorm:"column:description;type:text" json:"description,omitempty"`

	// Validity (3 fields)
	ActivatedAt time.Time  `gorm:"column:activated_at;not null" json:"activated_at"`
	ExpiresAt   *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`
	RevokedAt   *time.Time `gorm:"column:revoked_at" json:"revoked_at,omitempty"`

	// Usage Stats (2 fields)
	UsageCount   int64      `gorm:"column:usage_count;default:0" json:"usage_count"`
	LastUsedAt   *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	RevokedBy *uuid.UUID `gorm:"column:revoked_by;type:uuid" json:"revoked_by,omitempty"`

	// Relationship
	Endpoint *WebhookEndpoint `gorm:"foreignKey:EndpointID" json:"endpoint,omitempty"`
}

func (WebhookSecret) TableName() string {
	return "webhook_secrets"
}

func (s *WebhookSecret) IsActive() bool {
	return s.Status == SecretStatusActive
}

func (s *WebhookSecret) IsExpired() bool {
	return s.ExpiresAt != nil && time.Now().After(*s.ExpiresAt)
}

func (s *WebhookSecret) Revoke(userID *uuid.UUID) {
	now := time.Now()
	s.Status = SecretStatusRevoked
	s.RevokedAt = &now
	s.RevokedBy = userID
}

func (s *WebhookSecret) IncrementUsage() {
	s.UsageCount++
	now := time.Now()
	s.LastUsedAt = &now
}

// ============================================================================
// WEBHOOK ACCESS LOG - Access Logging
// ============================================================================

type AccessResult string

const (
	AccessResultAllowed   AccessResult = "ALLOWED"
	AccessResultDenied    AccessResult = "DENIED"
	AccessResultThrottled AccessResult = "THROTTLED"
	AccessResultInvalid   AccessResult = "INVALID"
)

type WebhookAccessLog struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	EndpointID uuid.UUID `gorm:"column:endpoint_id;type:uuid;not null;index" json:"endpoint_id"`

	// Access Info (5 fields)
	IPAddress   string       `gorm:"column:ip_address;type:varchar(50);not null;index" json:"ip_address"`
	UserAgent   *string      `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	Result      AccessResult `gorm:"column:result;type:varchar(20);not null;index" json:"result"`
	Reason      *string      `gorm:"column:reason;type:text" json:"reason,omitempty"`
	RequestPath string       `gorm:"column:request_path;type:varchar(500);not null" json:"request_path"`

	// Authentication (3 fields)
	AuthMethod   *string `gorm:"column:auth_method;type:varchar(50)" json:"auth_method,omitempty"`
	AuthSuccess  bool    `gorm:"column:auth_success;default:false" json:"auth_success"`
	SecretUsed   *uuid.UUID `gorm:"column:secret_used;type:uuid" json:"secret_used,omitempty"`

	// Request Details (2 fields)
	RequestSize    int   `gorm:"column:request_size" json:"request_size"`
	RequestHeaders JSONB `gorm:"column:request_headers;type:jsonb" json:"request_headers,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Timestamp (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`

	// Relationship
	Endpoint *WebhookEndpoint `gorm:"foreignKey:EndpointID" json:"endpoint,omitempty"`
}

func (WebhookAccessLog) TableName() string {
	return "webhook_access_logs"
}

// ============================================================================
// Helper Functions
// ============================================================================

// GenerateSignature generates an HMAC signature for webhook payload
func GenerateSignature(secret string, payload []byte, timestamp time.Time) string {
	// Create message: timestamp + payload
	message := fmt.Sprintf("%d.%s", timestamp.Unix(), string(payload))
	
	// Generate HMAC SHA256
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(message))
	
	return hex.EncodeToString(h.Sum(nil))
}

// VerifySignature verifies a webhook signature
func VerifySignature(secret, signature string, payload []byte, timestamp time.Time) bool {
	expectedSignature := GenerateSignature(secret, payload, timestamp)
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// CreateSignature creates a signature record
func CreateSignature(
	db *gorm.DB,
	deliveryID, endpointID uuid.UUID,
	secret string,
	payload []byte,
) (*WebhookSignature, error) {
	now := time.Now()
	signature := GenerateSignature(secret, payload, now)
	
	sig := &WebhookSignature{
		DeliveryID:       deliveryID,
		EndpointID:       endpointID,
		Algorithm:        SignatureAlgorithmHMACSHA256,
		Signature:        signature,
		SignatureVersion: "v1",
		Timestamp:        now,
		ExpiresAt:        now.Add(5 * time.Minute), // 5 min expiry
		PayloadHash:      calculateHash(payload),
		PayloadSize:      len(payload),
	}

	if err := db.Create(sig).Error; err != nil {
		return nil, err
	}

	return sig, nil
}

// VerifyWebhookSignature verifies a webhook signature from headers
func VerifyWebhookSignature(
	db *gorm.DB,
	endpointID uuid.UUID,
	signatureHeader string,
	timestampHeader string,
	payload []byte,
) (bool, error) {
	// Get endpoint with secret
	var endpoint WebhookEndpoint
	if err := db.First(&endpoint, endpointID).Error; err != nil {
		return false, err
	}

	// Parse timestamp
	var timestamp time.Time
	if timestampHeader != "" {
		// Parse timestamp from header
		// For simplicity, using current time
		timestamp = time.Now()
	} else {
		timestamp = time.Now()
	}

	// Verify signature
	valid := VerifySignature(endpoint.Secret, signatureHeader, payload, timestamp)

	// Log access
	result := AccessResultAllowed
	if !valid {
		result = AccessResultDenied
	}

	LogWebhookAccess(db, endpointID, "", result, "Signature verification", nil)

	return valid, nil
}

// CreateVerification creates a verification challenge
func CreateVerification(
	db *gorm.DB,
	endpointID uuid.UUID,
	verificationType VerificationType,
) (*WebhookVerification, error) {
	challenge := generateChallenge()
	now := time.Now()

	verification := &WebhookVerification{
		EndpointID: endpointID,
		Type:       verificationType,
		Status:     VerificationStatusPending,
		Challenge:  challenge,
		SentAt:     now,
		ExpiresAt:  now.Add(24 * time.Hour), // 24h expiry
		MaxAttempts: 3,
	}

	if err := db.Create(verification).Error; err != nil {
		return nil, err
	}

	return verification, nil
}

// VerifyEndpointChallenge verifies an endpoint challenge response
func VerifyEndpointChallenge(
	db *gorm.DB,
	verificationID uuid.UUID,
	response string,
) (bool, error) {
	var verification WebhookVerification
	if err := db.First(&verification, verificationID).Error; err != nil {
		return false, err
	}

	if verification.IsExpired() {
		verification.Status = VerificationStatusExpired
		db.Save(&verification)
		return false, fmt.Errorf("verification expired")
	}

	verified := verification.Verify(response)
	db.Save(&verification)

	if verified {
		// Mark endpoint as verified
		VerifyEndpoint(db, verification.EndpointID)
	}

	return verified, nil
}

// RotateSecret rotates a webhook secret
func RotateSecret(
	db *gorm.DB,
	endpointID uuid.UUID,
	userID *uuid.UUID,
) (*WebhookSecret, error) {
	return db.Transaction(func(tx *gorm.DB) error {
		// Get current primary secret
		var currentSecret WebhookSecret
		err := tx.Where("endpoint_id = ? AND is_primary = ?", endpointID, true).
			First(&currentSecret).Error

		newVersion := 1
		if err == nil {
			// Mark current as rotating
			currentSecret.Status = SecretStatusRotating
			currentSecret.IsPrimary = false
			tx.Save(&currentSecret)
			newVersion = currentSecret.Version + 1
		}

		// Create new secret
		newSecret := &WebhookSecret{
			EndpointID:  endpointID,
			Name:        fmt.Sprintf("Secret v%d", newVersion),
			Secret:      generateWebhookSecret(),
			Status:      SecretStatusActive,
			Version:     newVersion,
			IsPrimary:   true,
			ActivatedAt: time.Now(),
			CreatedBy:   userID,
		}

		if err := tx.Create(newSecret).Error; err != nil {
			return err
		}

		// Update endpoint with new secret
		if err := tx.Model(&WebhookEndpoint{}).
			Where("_id = ?", endpointID).
			Update("secret", newSecret.Secret).Error; err != nil {
			return err
		}

		return nil
	}).(error)
}

// RevokeSecret revokes a webhook secret
func RevokeSecret(
	db *gorm.DB,
	secretID uuid.UUID,
	userID *uuid.UUID,
) error {
	var secret WebhookSecret
	if err := db.First(&secret, secretID).Error; err != nil {
		return err
	}

	secret.Revoke(userID)
	return db.Save(&secret).Error
}

// GetActiveSecret gets the active secret for an endpoint
func GetActiveSecret(db *gorm.DB, endpointID uuid.UUID) (*WebhookSecret, error) {
	var secret WebhookSecret
	err := db.Where("endpoint_id = ? AND is_primary = ? AND status = ?",
		endpointID, true, SecretStatusActive).
		First(&secret).Error

	return &secret, err
}

// LogWebhookAccess logs webhook access
func LogWebhookAccess(
	db *gorm.DB,
	endpointID uuid.UUID,
	ipAddress string,
	result AccessResult,
	reason string,
	secretUsed *uuid.UUID,
) error {
	log := &WebhookAccessLog{
		EndpointID:  endpointID,
		IPAddress:   ipAddress,
		Result:      result,
		Reason:      &reason,
		SecretUsed:  secretUsed,
		AuthSuccess: result == AccessResultAllowed,
	}

	return db.Create(log).Error
}

// GetAccessLogs gets access logs for an endpoint
func GetAccessLogs(
	db *gorm.DB,
	endpointID uuid.UUID,
	limit int,
) ([]WebhookAccessLog, error) {
	var logs []WebhookAccessLog
	err := db.Where("endpoint_id = ?", endpointID).
		Order("created_at DESC").
		Limit(limit).
		Find(&logs).Error

	return logs, err
}

// CheckAccessSecurity checks if access is allowed based on security rules
func CheckAccessSecurity(
	db *gorm.DB,
	endpointID uuid.UUID,
	ipAddress string,
	signature string,
) (bool, string) {
	// Get endpoint
	var endpoint WebhookEndpoint
	if err := db.First(&endpoint, endpointID).Error; err != nil {
		return false, "Endpoint not found"
	}

	// Check if endpoint is active
	if !endpoint.IsActive() {
		return false, "Endpoint is not active"
	}

	// Check if endpoint is healthy
	if !endpoint.IsHealthy() {
		return false, "Endpoint is unhealthy"
	}

	// Check rate limiting (simplified)
	var recentAccessCount int64
	db.Model(&WebhookAccessLog{}).
		Where("endpoint_id = ? AND ip_address = ? AND created_at >= ?",
			endpointID, ipAddress, time.Now().Add(-1*time.Minute)).
		Count(&recentAccessCount)

	if recentAccessCount > 100 {
		return false, "Rate limit exceeded"
	}

	return true, ""
}

// CleanupExpiredSignatures removes expired signatures
func CleanupExpiredSignatures(db *gorm.DB) error {
	return db.Where("expires_at < ?", time.Now()).
		Delete(&WebhookSignature{}).Error
}

// CleanupExpiredVerifications removes expired verifications
func CleanupExpiredVerifications(db *gorm.DB) error {
	return db.Where("expires_at < ? AND status = ?",
		time.Now(), VerificationStatusPending).
		Update("status", VerificationStatusExpired).Error
}

// CleanupOldAccessLogs removes old access logs
func CleanupOldAccessLogs(db *gorm.DB, daysToKeep int) error {
	cutoff := time.Now().AddDate(0, 0, -daysToKeep)
	return db.Where("created_at < ?", cutoff).
		Delete(&WebhookAccessLog{}).Error
}

func generateChallenge() string {
	return fmt.Sprintf("challenge_%s", uuid.New().String())
}
