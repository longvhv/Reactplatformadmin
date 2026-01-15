package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// SECURITY EVENT - Security Event Tracking
// ============================================================================
// Purpose: Track security-related events
// Table: security_events
// Primary Key: _id (UUID)
// Features: Threat detection, Incident tracking, Security monitoring
// ============================================================================

type SecurityEventType string

const (
	SecurityEventBruteForce      SecurityEventType = "BRUTE_FORCE"
	SecurityEventSuspiciousLogin SecurityEventType = "SUSPICIOUS_LOGIN"
	SecurityEventUnauthorizedAccess SecurityEventType = "UNAUTHORIZED_ACCESS"
	SecurityEventDataBreach      SecurityEventType = "DATA_BREACH"
	SecurityEventMalware         SecurityEventType = "MALWARE"
	SecurityEventPhishing        SecurityEventType = "PHISHING"
	SecurityEventDDoS            SecurityEventType = "DDOS"
	SecurityEventPasswordChange  SecurityEventType = "PASSWORD_CHANGE"
	SecurityEventAccountLockout  SecurityEventType = "ACCOUNT_LOCKOUT"
)

type SecuritySeverity string

const (
	SecuritySeverityLow      SecuritySeverity = "LOW"
	SecuritySeverityMedium   SecuritySeverity = "MEDIUM"
	SecuritySeverityHigh     SecuritySeverity = "HIGH"
	SecuritySeverityCritical SecuritySeverity = "CRITICAL"
)

type SecurityStatus string

const (
	SecurityStatusDetected    SecurityStatus = "DETECTED"
	SecurityStatusInvestigating SecurityStatus = "INVESTIGATING"
	SecurityStatusMitigated   SecurityStatus = "MITIGATED"
	SecurityStatusResolved    SecurityStatus = "RESOLVED"
	SecurityStatusFalsePositive SecurityStatus = "FALSE_POSITIVE"
)

type SecurityEvent struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   *uuid.UUID `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"`

	// Event Info (6 fields)
	Type        SecurityEventType `gorm:"column:type;type:varchar(50);not null;index" json:"type"`
	Severity    SecuritySeverity  `gorm:"column:severity;type:varchar(20);not null;index" json:"severity"`
	Status      SecurityStatus    `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Title       string            `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Description string            `gorm:"column:description;type:text;not null" json:"description"`
	EventNumber string            `gorm:"column:event_number;type:varchar(50);uniqueIndex;not null" json:"event_number"`

	// Source (5 fields)
	IPAddress   string  `gorm:"column:ip_address;type:varchar(50);index" json:"ip_address"`
	UserAgent   *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	Country     *string `gorm:"column:country;type:varchar(100)" json:"country,omitempty"`
	City        *string `gorm:"column:city;type:varchar(100)" json:"city,omitempty"`
	Coordinates JSONB   `gorm:"column:coordinates;type:jsonb" json:"coordinates,omitempty"`

	// Details (4 fields)
	AttackVector  *string `gorm:"column:attack_vector;type:varchar(100)" json:"attack_vector,omitempty"`
	TargetResource *string `gorm:"column:target_resource;type:varchar(255)" json:"target_resource,omitempty"`
	AttemptCount  int     `gorm:"column:attempt_count;default:1" json:"attempt_count"`
	Evidence      JSONB   `gorm:"column:evidence;type:jsonb" json:"evidence,omitempty"`

	// Response (4 fields)
	ActionTaken    *string    `gorm:"column:action_taken;type:text" json:"action_taken,omitempty"`
	MitigatedAt    *time.Time `gorm:"column:mitigated_at" json:"mitigated_at,omitempty"`
	MitigatedBy    *uuid.UUID `gorm:"column:mitigated_by;type:uuid" json:"mitigated_by,omitempty"`
	ResolutionNotes *string   `gorm:"column:resolution_notes;type:text" json:"resolution_notes,omitempty"`

	// Related (2 fields)
	RelatedEventID *uuid.UUID `gorm:"column:related_event_id;type:uuid" json:"related_event_id,omitempty"`
	IncidentID     *uuid.UUID `gorm:"column:incident_id;type:uuid;index" json:"incident_id,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (SecurityEvent) TableName() string {
	return "security_events"
}

func (s *SecurityEvent) IsCritical() bool {
	return s.Severity == SecuritySeverityCritical
}

func (s *SecurityEvent) IsResolved() bool {
	return s.Status == SecurityStatusResolved || s.Status == SecurityStatusFalsePositive
}

// ============================================================================
// SUSPICIOUS ACTIVITY - Anomaly Detection
// ============================================================================

type AnomalyType string

const (
	AnomalyTypeUnusualLocation    AnomalyType = "UNUSUAL_LOCATION"
	AnomalyTypeUnusualTime        AnomalyType = "UNUSUAL_TIME"
	AnomalyTypeUnusualDevice      AnomalyType = "UNUSUAL_DEVICE"
	AnomalyTypeRapidRequests      AnomalyType = "RAPID_REQUESTS"
	AnomalyTypeDataExfiltration   AnomalyType = "DATA_EXFILTRATION"
	AnomalyTypePrivilegeEscalation AnomalyType = "PRIVILEGE_ESCALATION"
	AnomalyTypeUnusualActivity    AnomalyType = "UNUSUAL_ACTIVITY"
)

type SuspiciousActivity struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   *uuid.UUID `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"`

	// Anomaly Info (5 fields)
	Type        AnomalyType      `gorm:"column:type;type:varchar(50);not null;index" json:"type"`
	Severity    SecuritySeverity `gorm:"column:severity;type:varchar(20);not null;index" json:"severity"`
	Description string           `gorm:"column:description;type:text;not null" json:"description"`
	Score       float64          `gorm:"column:score;type:decimal(5,2);not null" json:"score"` // Anomaly score 0-100
	Confidence  float64          `gorm:"column:confidence;type:decimal(5,2);not null" json:"confidence"` // Confidence 0-100

	// Detection (3 fields)
	DetectionMethod string `gorm:"column:detection_method;type:varchar(100);not null" json:"detection_method"`
	DetectedAt      time.Time `gorm:"column:detected_at;not null;index" json:"detected_at"`
	IsConfirmed     bool   `gorm:"column:is_confirmed;default:false" json:"is_confirmed"`

	// Context (6 fields)
	IPAddress     string     `gorm:"column:ip_address;type:varchar(50);index" json:"ip_address"`
	SessionID     *uuid.UUID `gorm:"column:session_id;type:uuid;index" json:"session_id,omitempty"`
	ActivityType  *string    `gorm:"column:activity_type;type:varchar(50)" json:"activity_type,omitempty"`
	ResourceAccessed *string `gorm:"column:resource_accessed;type:varchar(255)" json:"resource_accessed,omitempty"`
	UserAgent     *string    `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	Location      JSONB      `gorm:"column:location;type:jsonb" json:"location,omitempty"`

	// Baseline (3 fields)
	BaselineValue  JSONB `gorm:"column:baseline_value;type:jsonb" json:"baseline_value,omitempty"` // Normal behavior
	CurrentValue   JSONB `gorm:"column:current_value;type:jsonb" json:"current_value,omitempty"` // Anomalous behavior
	Deviation      float64 `gorm:"column:deviation;type:decimal(10,2)" json:"deviation"` // How far from normal

	// Response (4 fields)
	ActionRequired bool       `gorm:"column:action_required;default:true" json:"action_required"`
	ActionTaken    *string    `gorm:"column:action_taken;type:text" json:"action_taken,omitempty"`
	ReviewedAt     *time.Time `gorm:"column:reviewed_at" json:"reviewed_at,omitempty"`
	ReviewedBy     *uuid.UUID `gorm:"column:reviewed_by;type:uuid" json:"reviewed_by,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (SuspiciousActivity) TableName() string {
	return "suspicious_activities"
}

func (s *SuspiciousActivity) IsHighRisk() bool {
	return s.Score >= 75 || s.Severity == SecuritySeverityHigh || s.Severity == SecuritySeverityCritical
}

// ============================================================================
// IP BLOCKLIST - IP Address Blocking
// ============================================================================

type BlocklistReason string

const (
	BlocklistReasonBruteForce    BlocklistReason = "BRUTE_FORCE"
	BlocklistReasonSpam          BlocklistReason = "SPAM"
	BlocklistReasonMalicious     BlocklistReason = "MALICIOUS"
	BlocklistReasonManual        BlocklistReason = "MANUAL"
	BlocklistReasonThreatIntel   BlocklistReason = "THREAT_INTEL"
	BlocklistReasonGeoRestriction BlocklistReason = "GEO_RESTRICTION"
)

type BlocklistStatus string

const (
	BlocklistStatusActive   BlocklistStatus = "ACTIVE"
	BlocklistStatusExpired  BlocklistStatus = "EXPIRED"
	BlocklistStatusRemoved  BlocklistStatus = "REMOVED"
)

type IPBlocklist struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// IP Info (4 fields)
	IPAddress string          `gorm:"column:ip_address;type:varchar(50);uniqueIndex;not null" json:"ip_address"`
	IPRange   *string         `gorm:"column:ip_range;type:varchar(100)" json:"ip_range,omitempty"` // CIDR notation
	Reason    BlocklistReason `gorm:"column:reason;type:varchar(50);not null;index" json:"reason"`
	Status    BlocklistStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`

	// Block Details (4 fields)
	Description    string     `gorm:"column:description;type:text;not null" json:"description"`
	ThreatLevel    *string    `gorm:"column:threat_level;type:varchar(20)" json:"threat_level,omitempty"`
	FirstSeenAt    time.Time  `gorm:"column:first_seen_at;not null" json:"first_seen_at"`
	LastSeenAt     time.Time  `gorm:"column:last_seen_at;not null" json:"last_seen_at"`

	// Block Enforcement (3 fields)
	BlockedAt  time.Time  `gorm:"column:blocked_at;not null;index" json:"blocked_at"`
	ExpiresAt  *time.Time `gorm:"column:expires_at;index" json:"expires_at,omitempty"`
	IsPermanent bool      `gorm:"column:is_permanent;default:false" json:"is_permanent"`

	// Statistics (3 fields)
	BlockedAttempts int64     `gorm:"column:blocked_attempts;default:0" json:"blocked_attempts"`
	LastBlockedAt   *time.Time `gorm:"column:last_blocked_at" json:"last_blocked_at,omitempty"`
	TotalRequests   int64     `gorm:"column:total_requests;default:0" json:"total_requests"`

	// Location (2 fields)
	Country  *string `gorm:"column:country;type:varchar(100)" json:"country,omitempty"`
	Location JSONB   `gorm:"column:location;type:jsonb" json:"location,omitempty"`

	// Management (3 fields)
	BlockedBy    *uuid.UUID `gorm:"column:blocked_by;type:uuid" json:"blocked_by,omitempty"`
	RemovedAt    *time.Time `gorm:"column:removed_at" json:"removed_at,omitempty"`
	RemovedBy    *uuid.UUID `gorm:"column:removed_by;type:uuid" json:"removed_by,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (IPBlocklist) TableName() string {
	return "ip_blocklists"
}

func (i *IPBlocklist) IsActive() bool {
	if i.Status != BlocklistStatusActive {
		return false
	}
	
	if i.ExpiresAt != nil && time.Now().After(*i.ExpiresAt) {
		return false
	}
	
	return true
}

func (i *IPBlocklist) IncrementBlocked() {
	i.BlockedAttempts++
	now := time.Now()
	i.LastBlockedAt = &now
	i.LastSeenAt = now
}

// ============================================================================
// DEVICE FINGERPRINT - Device Tracking
// ============================================================================

type DeviceStatus string

const (
	DeviceStatusTrusted    DeviceStatus = "TRUSTED"
	DeviceStatusUnknown    DeviceStatus = "UNKNOWN"
	DeviceStatusSuspicious DeviceStatus = "SUSPICIOUS"
	DeviceStatusBlocked    DeviceStatus = "BLOCKED"
)

type DeviceFingerprint struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   *uuid.UUID `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"`

	// Fingerprint (5 fields)
	Fingerprint string       `gorm:"column:fingerprint;type:varchar(255);uniqueIndex;not null" json:"fingerprint"`
	DeviceID    *string      `gorm:"column:device_id;type:varchar(255);index" json:"device_id,omitempty"`
	Status      DeviceStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Name        *string      `gorm:"column:name;type:varchar(255)" json:"name,omitempty"` // User-given name
	IsTrusted   bool         `gorm:"column:is_trusted;default:false" json:"is_trusted"`

	// Device Info (6 fields)
	DeviceType *string `gorm:"column:device_type;type:varchar(50)" json:"device_type,omitempty"`
	OS         *string `gorm:"column:os;type:varchar(50)" json:"os,omitempty"`
	OSVersion  *string `gorm:"column:os_version;type:varchar(50)" json:"os_version,omitempty"`
	Browser    *string `gorm:"column:browser;type:varchar(50)" json:"browser,omitempty"`
	BrowserVersion *string `gorm:"column:browser_version;type:varchar(50)" json:"browser_version,omitempty"`
	UserAgent  *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`

	// Hardware (3 fields)
	ScreenResolution *string `gorm:"column:screen_resolution;type:varchar(50)" json:"screen_resolution,omitempty"`
	Timezone         *string `gorm:"column:timezone;type:varchar(50)" json:"timezone,omitempty"`
	Language         *string `gorm:"column:language;type:varchar(10)" json:"language,omitempty"`

	// Usage Stats (5 fields)
	FirstSeenAt   time.Time  `gorm:"column:first_seen_at;not null" json:"first_seen_at"`
	LastSeenAt    time.Time  `gorm:"column:last_seen_at;not null" json:"last_seen_at"`
	LoginCount    int64      `gorm:"column:login_count;default:0" json:"login_count"`
	LastLoginAt   *time.Time `gorm:"column:last_login_at" json:"last_login_at,omitempty"`
	AccessCount   int64      `gorm:"column:access_count;default:0" json:"access_count"`

	// Location (2 fields)
	LastLocation JSONB   `gorm:"column:last_location;type:jsonb" json:"last_location,omitempty"`
	Locations    JSONB   `gorm:"column:locations;type:jsonb" json:"locations,omitempty"` // Historical locations

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (DeviceFingerprint) TableName() string {
	return "device_fingerprints"
}

func (d *DeviceFingerprint) IsTrustedDevice() bool {
	return d.Status == DeviceStatusTrusted && d.IsTrusted
}

func (d *DeviceFingerprint) UpdateLastSeen() {
	d.LastSeenAt = time.Now()
	d.AccessCount++
}

// ============================================================================
// GEO LOCATION - Geographic Tracking
// ============================================================================

type GeoLocation struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	IPAddress string    `gorm:"column:ip_address;type:varchar(50);uniqueIndex;not null" json:"ip_address"`

	// Location (8 fields)
	Country     string  `gorm:"column:country;type:varchar(100);not null;index" json:"country"`
	CountryCode string  `gorm:"column:country_code;type:varchar(5);not null" json:"country_code"`
	Region      *string `gorm:"column:region;type:varchar(100)" json:"region,omitempty"`
	RegionCode  *string `gorm:"column:region_code;type:varchar(10)" json:"region_code,omitempty"`
	City        *string `gorm:"column:city;type:varchar(100);index" json:"city,omitempty"`
	PostalCode  *string `gorm:"column:postal_code;type:varchar(20)" json:"postal_code,omitempty"`
	Latitude    *float64 `gorm:"column:latitude;type:decimal(10,7)" json:"latitude,omitempty"`
	Longitude   *float64 `gorm:"column:longitude;type:decimal(10,7)" json:"longitude,omitempty"`

	// Network (4 fields)
	ISP          *string `gorm:"column:isp;type:varchar(255)" json:"isp,omitempty"`
	Organization *string `gorm:"column:organization;type:varchar(255)" json:"organization,omitempty"`
	ASN          *string `gorm:"column:asn;type:varchar(50)" json:"asn,omitempty"`
	Timezone     *string `gorm:"column:timezone;type:varchar(50)" json:"timezone,omitempty"`

	// Risk Assessment (3 fields)
	IsProxy     bool    `gorm:"column:is_proxy;default:false" json:"is_proxy"`
	IsTor       bool    `gorm:"column:is_tor;default:false" json:"is_tor"`
	ThreatLevel *string `gorm:"column:threat_level;type:varchar(20)" json:"threat_level,omitempty"`

	// Cache (2 fields)
	LastUpdatedAt time.Time `gorm:"column:last_updated_at;not null" json:"last_updated_at"`
	ExpiresAt     time.Time `gorm:"column:expires_at;not null" json:"expires_at"` // Cache expiry

	// Audit (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
}

func (GeoLocation) TableName() string {
	return "geo_locations"
}

func (g *GeoLocation) IsHighRisk() bool {
	return g.IsProxy || g.IsTor || (g.ThreatLevel != nil && *g.ThreatLevel == "HIGH")
}

// ============================================================================
// Helper Functions
// ============================================================================

// LogSecurityEvent logs a security event
func LogSecurityEvent(
	db *gorm.DB,
	eventType SecurityEventType,
	severity SecuritySeverity,
	title, description string,
	ipAddress string,
	userID *uuid.UUID,
	options map[string]interface{},
) (*SecurityEvent, error) {
	event := &SecurityEvent{
		UserID:      userID,
		Type:        eventType,
		Severity:    severity,
		Status:      SecurityStatusDetected,
		Title:       title,
		Description: description,
		EventNumber: generateEventNumber(),
		IPAddress:   ipAddress,
		AttemptCount: 1,
	}

	// Apply options
	if userAgent, ok := options["user_agent"].(string); ok {
		event.UserAgent = &userAgent
	}
	if attackVector, ok := options["attack_vector"].(string); ok {
		event.AttackVector = &attackVector
	}
	if targetResource, ok := options["target_resource"].(string); ok {
		event.TargetResource = &targetResource
	}

	if err := db.Create(event).Error; err != nil {
		return nil, err
	}

	return event, nil
}

// DetectSuspiciousActivity detects and logs suspicious activity
func DetectSuspiciousActivity(
	db *gorm.DB,
	anomalyType AnomalyType,
	description string,
	score, confidence float64,
	ipAddress string,
	userID *uuid.UUID,
	options map[string]interface{},
) (*SuspiciousActivity, error) {
	// Determine severity based on score
	var severity SecuritySeverity
	if score >= 80 {
		severity = SecuritySeverityCritical
	} else if score >= 60 {
		severity = SecuritySeverityHigh
	} else if score >= 40 {
		severity = SecuritySeverityMedium
	} else {
		severity = SecuritySeverityLow
	}

	activity := &SuspiciousActivity{
		UserID:          userID,
		Type:            anomalyType,
		Severity:        severity,
		Description:     description,
		Score:           score,
		Confidence:      confidence,
		DetectionMethod: "AUTOMATED",
		DetectedAt:      time.Now(),
		IPAddress:       ipAddress,
		ActionRequired:  score >= 60,
	}

	// Apply options
	if sessionID, ok := options["session_id"].(uuid.UUID); ok {
		activity.SessionID = &sessionID
	}
	if baseline, ok := options["baseline"].(map[string]interface{}); ok {
		activity.BaselineValue = baseline
	}
	if current, ok := options["current"].(map[string]interface{}); ok {
		activity.CurrentValue = current
	}

	if err := db.Create(activity).Error; err != nil {
		return nil, err
	}

	return activity, nil
}

// BlockIP blocks an IP address
func BlockIP(
	db *gorm.DB,
	ipAddress string,
	reason BlocklistReason,
	description string,
	duration *time.Duration,
	blockedBy *uuid.UUID,
) (*IPBlocklist, error) {
	now := time.Now()

	block := &IPBlocklist{
		IPAddress:    ipAddress,
		Reason:       reason,
		Status:       BlocklistStatusActive,
		Description:  description,
		FirstSeenAt:  now,
		LastSeenAt:   now,
		BlockedAt:    now,
		IsPermanent:  duration == nil,
		BlockedBy:    blockedBy,
	}

	if duration != nil {
		expiresAt := now.Add(*duration)
		block.ExpiresAt = &expiresAt
	}

	return block, db.Create(block).Error
}

// UnblockIP unblocks an IP address
func UnblockIP(db *gorm.DB, ipAddress string, removedBy *uuid.UUID) error {
	now := time.Now()

	return db.Model(&IPBlocklist{}).
		Where("ip_address = ? AND status = ?", ipAddress, BlocklistStatusActive).
		Updates(map[string]interface{}{
			"status":     BlocklistStatusRemoved,
			"removed_at": now,
			"removed_by": removedBy,
		}).Error
}

// IsIPBlocked checks if an IP is blocked
func IsIPBlocked(db *gorm.DB, ipAddress string) (bool, error) {
	var block IPBlocklist
	err := db.Where("ip_address = ? AND status = ?", ipAddress, BlocklistStatusActive).
		First(&block).Error

	if err == gorm.ErrRecordNotFound {
		return false, nil
	}

	if err != nil {
		return false, err
	}

	return block.IsActive(), nil
}

// TrackDevice tracks a device fingerprint
func TrackDevice(
	db *gorm.DB,
	fingerprint string,
	userID *uuid.UUID,
	options map[string]interface{},
) (*DeviceFingerprint, error) {
	now := time.Now()

	// Check if device exists
	var device DeviceFingerprint
	err := db.Where("fingerprint = ?", fingerprint).First(&device).Error

	if err == gorm.ErrRecordNotFound {
		// Create new device
		device = DeviceFingerprint{
			Fingerprint: fingerprint,
			UserID:      userID,
			Status:      DeviceStatusUnknown,
			FirstSeenAt: now,
			LastSeenAt:  now,
			LoginCount:  1,
		}

		// Apply options
		if deviceType, ok := options["device_type"].(string); ok {
			device.DeviceType = &deviceType
		}
		if os, ok := options["os"].(string); ok {
			device.OS = &os
		}
		if browser, ok := options["browser"].(string); ok {
			device.Browser = &browser
		}
		if userAgent, ok := options["user_agent"].(string); ok {
			device.UserAgent = &userAgent
		}

		return &device, db.Create(&device).Error
	}

	if err != nil {
		return nil, err
	}

	// Update existing device
	device.LastSeenAt = now
	device.LoginCount++
	device.LastLoginAt = &now

	db.Save(&device)

	return &device, nil
}

// GetGeoLocation gets or creates geo location for an IP
func GetGeoLocation(db *gorm.DB, ipAddress string) (*GeoLocation, error) {
	var location GeoLocation
	err := db.Where("ip_address = ?", ipAddress).First(&location).Error

	if err == gorm.ErrRecordNotFound {
		// Would normally call a GeoIP service here
		// For now, create a placeholder
		location = GeoLocation{
			IPAddress:     ipAddress,
			Country:       "Unknown",
			CountryCode:   "XX",
			LastUpdatedAt: time.Now(),
			ExpiresAt:     time.Now().Add(24 * time.Hour),
		}
		db.Create(&location)
	}

	return &location, err
}

// GetSecurityEvents gets recent security events
func GetSecurityEvents(
	db *gorm.DB,
	severity *SecuritySeverity,
	limit int,
) ([]SecurityEvent, error) {
	query := db.Model(&SecurityEvent{})

	if severity != nil {
		query = query.Where("severity = ?", severity)
	}

	var events []SecurityEvent
	err := query.Order("created_at DESC").
		Limit(limit).
		Find(&events).Error

	return events, err
}

// GetSuspiciousActivities gets suspicious activities
func GetSuspiciousActivities(
	db *gorm.DB,
	userID *uuid.UUID,
	minScore float64,
	limit int,
) ([]SuspiciousActivity, error) {
	query := db.Where("score >= ?", minScore)

	if userID != nil {
		query = query.Where("user_id = ?", userID)
	}

	var activities []SuspiciousActivity
	err := query.Order("detected_at DESC").
		Limit(limit).
		Find(&activities).Error

	return activities, err
}

// ExpireIPBlocks expires temporary IP blocks
func ExpireIPBlocks(db *gorm.DB) error {
	return db.Model(&IPBlocklist{}).
		Where("status = ? AND expires_at IS NOT NULL AND expires_at < ?", 
			BlocklistStatusActive, time.Now()).
		Update("status", BlocklistStatusExpired).Error
}

func generateEventNumber() string {
	now := time.Now()
	return fmt.Sprintf("SEC-%s-%05d", 
		now.Format("20060102"), 
		now.Unix()%100000)
}
