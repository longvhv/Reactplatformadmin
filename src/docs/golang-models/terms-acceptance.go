package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// TERMS ACCEPTANCE - User Acceptance Tracking
// ============================================================================
// Purpose: Track user acceptance of terms
// Table: terms_acceptances
// Primary Key: _id (UUID)
// Features: Acceptance tracking, Compliance, Audit trail
// ============================================================================

type AcceptanceAction string

const (
	AcceptanceActionAccepted AcceptanceAction = "ACCEPTED"
	AcceptanceActionRejected AcceptanceAction = "REJECTED"
	AcceptanceActionViewed   AcceptanceAction = "VIEWED"
	AcceptanceActionSkipped  AcceptanceAction = "SKIPPED"
)

type AcceptanceMethod string

const (
	AcceptanceMethodClickthrough AcceptanceMethod = "CLICKTHROUGH"
	AcceptanceMethodCheckbox     AcceptanceMethod = "CHECKBOX"
	AcceptanceMethodSignature    AcceptanceMethod = "SIGNATURE"
	AcceptanceMethodImplicit     AcceptanceMethod = "IMPLICIT"
	AcceptanceMethodAPI          AcceptanceMethod = "API"
)

type AcceptanceContext string

const (
	AcceptanceContextSignup   AcceptanceContext = "SIGNUP"
	AcceptanceContextLogin    AcceptanceContext = "LOGIN"
	AcceptanceContextUpdate   AcceptanceContext = "UPDATE"
	AcceptanceContextCheckout AcceptanceContext = "CHECKOUT"
	AcceptanceContextSettings AcceptanceContext = "SETTINGS"
	AcceptanceContextPrompt   AcceptanceContext = "PROMPT"
)

type TermsAcceptance struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`

	// Terms Reference (2 fields)
	TermsID uuid.UUID `gorm:"column:terms_id;type:uuid;not null;index;uniqueIndex:idx_user_terms" json:"terms_id"`
	TermsVersion string `gorm:"column:terms_version;type:varchar(50);not null" json:"terms_version"`

	// Acceptance Info (4 fields)
	Action     AcceptanceAction  `gorm:"column:action;type:varchar(20);not null;index" json:"action"`
	Method     AcceptanceMethod  `gorm:"column:method;type:varchar(20);not null" json:"method"`
	Context    AcceptanceContext `gorm:"column:context;type:varchar(20);not null" json:"context"`
	IsAccepted bool              `gorm:"column:is_accepted;not null;index" json:"is_accepted"`

	// Client Info (5 fields)
	IPAddress  string  `gorm:"column:ip_address;type:varchar(50);not null" json:"ip_address"`
	UserAgent  *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	DeviceType *string `gorm:"column:device_type;type:varchar(50)" json:"device_type,omitempty"`
	Browser    *string `gorm:"column:browser;type:varchar(50)" json:"browser,omitempty"`
	OS         *string `gorm:"column:os;type:varchar(50)" json:"os,omitempty"`

	// Location (3 fields)
	Country  *string `gorm:"column:country;type:varchar(100)" json:"country,omitempty"`
	City     *string `gorm:"column:city;type:varchar(100)" json:"city,omitempty"`
	Location JSONB   `gorm:"column:location;type:jsonb" json:"location,omitempty"`

	// Signature (3 fields)
	Signature     *string    `gorm:"column:signature;type:text" json:"signature,omitempty"` // Digital signature
	SignedAt      *time.Time `gorm:"column:signed_at" json:"signed_at,omitempty"`
	CertificateID *uuid.UUID `gorm:"column:certificate_id;type:uuid" json:"certificate_id,omitempty"`

	// Validity (3 fields)
	IsValid      bool       `gorm:"column:is_valid;default:true" json:"is_valid"`
	ExpiresAt    *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`
	RevokedAt    *time.Time `gorm:"column:revoked_at" json:"revoked_at,omitempty"`

	// Additional Info (2 fields)
	Notes    *string `gorm:"column:notes;type:text" json:"notes,omitempty"`
	Metadata JSONB   `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`

	// Relationships
	Terms *TermsOfService `gorm:"foreignKey:TermsID" json:"terms,omitempty"`
}

func (TermsAcceptance) TableName() string {
	return "terms_acceptances"
}

func (t *TermsAcceptance) IsActive() bool {
	if !t.IsValid {
		return false
	}

	if t.RevokedAt != nil {
		return false
	}

	if t.ExpiresAt != nil && time.Now().After(*t.ExpiresAt) {
		return false
	}

	return t.IsAccepted
}

// ============================================================================
// ACCEPTANCE REMINDER - Reminders to accept terms
// ============================================================================

type ReminderStatus string

const (
	ReminderStatusPending  ReminderStatus = "PENDING"
	ReminderStatusSent     ReminderStatus = "SENT"
	ReminderStatusViewed   ReminderStatus = "VIEWED"
	ReminderStatusAccepted ReminderStatus = "ACCEPTED"
	ReminderStatusIgnored  ReminderStatus = "IGNORED"
	ReminderStatusExpired  ReminderStatus = "EXPIRED"
)

type AcceptanceReminder struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`

	// Terms Reference (2 fields)
	TermsID      uuid.UUID `gorm:"column:terms_id;type:uuid;not null;index" json:"terms_id"`
	TermsVersion string    `gorm:"column:terms_version;type:varchar(50);not null" json:"terms_version"`

	// Reminder Info (5 fields)
	Status      ReminderStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Priority    int            `gorm:"column:priority;default:0" json:"priority"` // Higher = more urgent
	Message     string         `gorm:"column:message;type:text;not null" json:"message"`
	IsMandatory bool           `gorm:"column:is_mandatory;default:true" json:"is_mandatory"`
	Channel     string         `gorm:"column:channel;type:varchar(50);not null" json:"channel"` // email, in_app, sms

	// Timing (4 fields)
	ScheduledAt time.Time  `gorm:"column:scheduled_at;not null;index" json:"scheduled_at"`
	SentAt      *time.Time `gorm:"column:sent_at" json:"sent_at,omitempty"`
	ViewedAt    *time.Time `gorm:"column:viewed_at" json:"viewed_at,omitempty"`
	RespondedAt *time.Time `gorm:"column:responded_at" json:"responded_at,omitempty"`

	// Response (2 fields)
	ResponseAction *string `gorm:"column:response_action;type:varchar(20)" json:"response_action,omitempty"`
	ResponseNotes  *string `gorm:"column:response_notes;type:text" json:"response_notes,omitempty"`

	// Expiry (1 field)
	ExpiresAt *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Terms *TermsOfService `gorm:"foreignKey:TermsID" json:"terms,omitempty"`
}

func (AcceptanceReminder) TableName() string {
	return "acceptance_reminders"
}

func (r *AcceptanceReminder) IsExpired() bool {
	return r.ExpiresAt != nil && time.Now().After(*r.ExpiresAt)
}

// ============================================================================
// COMPLIANCE RECORD - Compliance Tracking
// ============================================================================

type ComplianceStatus string

const (
	ComplianceStatusCompliant    ComplianceStatus = "COMPLIANT"
	ComplianceStatusNonCompliant ComplianceStatus = "NON_COMPLIANT"
	ComplianceStatusPartial      ComplianceStatus = "PARTIAL"
	ComplianceStatusUnknown      ComplianceStatus = "UNKNOWN"
)

type ComplianceRecord struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`

	// Compliance Info (5 fields)
	Status        ComplianceStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Standard      string           `gorm:"column:standard;type:varchar(50);not null" json:"standard"` // GDPR, CCPA, etc
	CheckDate     time.Time        `gorm:"column:check_date;not null;index" json:"check_date"`
	IsCompliant   bool             `gorm:"column:is_compliant;not null" json:"is_compliant"`
	ComplianceScore float64        `gorm:"column:compliance_score;type:decimal(5,2)" json:"compliance_score"`

	// Requirements (3 fields)
	RequiredTerms    JSONB `gorm:"column:required_terms;type:jsonb" json:"required_terms,omitempty"`
	AcceptedTerms    JSONB `gorm:"column:accepted_terms;type:jsonb" json:"accepted_terms,omitempty"`
	MissingTerms     JSONB `gorm:"column:missing_terms;type:jsonb" json:"missing_terms,omitempty"`

	// Details (3 fields)
	Issues          JSONB   `gorm:"column:issues;type:jsonb" json:"issues,omitempty"`
	Recommendations JSONB   `gorm:"column:recommendations;type:jsonb" json:"recommendations,omitempty"`
	Notes           *string `gorm:"column:notes;type:text" json:"notes,omitempty"`

	// Remediation (3 fields)
	RemediationRequired bool       `gorm:"column:remediation_required;default:false" json:"remediation_required"`
	RemediationDeadline *time.Time `gorm:"column:remediation_deadline" json:"remediation_deadline,omitempty"`
	RemediatedAt        *time.Time `gorm:"column:remediated_at" json:"remediated_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (ComplianceRecord) TableName() string {
	return "compliance_records"
}

func (c *ComplianceRecord) NeedsRemediation() bool {
	if !c.RemediationRequired {
		return false
	}

	if c.RemediatedAt != nil {
		return false
	}

	if c.RemediationDeadline != nil && time.Now().After(*c.RemediationDeadline) {
		return true
	}

	return c.RemediationRequired
}

// ============================================================================
// CONSENT LOG - Detailed Consent Logging
// ============================================================================

type ConsentType string

const (
	ConsentTypeTerms     ConsentType = "TERMS"
	ConsentTypePrivacy   ConsentType = "PRIVACY"
	ConsentTypeCookie    ConsentType = "COOKIE"
	ConsentTypeMarketing ConsentType = "MARKETING"
	ConsentTypeData      ConsentType = "DATA_PROCESSING"
)

type ConsentLog struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`

	// Consent Info (6 fields)
	Type          ConsentType `gorm:"column:type;type:varchar(30);not null;index" json:"type"`
	Purpose       string      `gorm:"column:purpose;type:text;not null" json:"purpose"`
	IsGranted     bool        `gorm:"column:is_granted;not null;index" json:"is_granted"`
	ConsentText   string      `gorm:"column:consent_text;type:text;not null" json:"consent_text"`
	ConsentVersion string     `gorm:"column:consent_version;type:varchar(50);not null" json:"consent_version"`
	IsExplicit    bool        `gorm:"column:is_explicit;default:true" json:"is_explicit"`

	// Method (3 fields)
	Method    AcceptanceMethod `gorm:"column:method;type:varchar(20);not null" json:"method"`
	Context   string           `gorm:"column:context;type:varchar(50);not null" json:"context"`
	Source    string           `gorm:"column:source;type:varchar(100);not null" json:"source"` // webpage, app, api

	// Client Info (4 fields)
	IPAddress  string  `gorm:"column:ip_address;type:varchar(50);not null" json:"ip_address"`
	UserAgent  *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	DeviceID   *string `gorm:"column:device_id;type:varchar(255)" json:"device_id,omitempty"`
	SessionID  *string `gorm:"column:session_id;type:varchar(255)" json:"session_id,omitempty"`

	// Validity (3 fields)
	GrantedAt  time.Time  `gorm:"column:granted_at;not null;index" json:"granted_at"`
	ExpiresAt  *time.Time `gorm:"column:expires_at" json:"expires_at,omitempty"`
	RevokedAt  *time.Time `gorm:"column:revoked_at" json:"revoked_at,omitempty"`

	// Proof (2 fields)
	ProofOfConsent JSONB   `gorm:"column:proof_of_consent;type:jsonb" json:"proof_of_consent,omitempty"`
	VerificationHash *string `gorm:"column:verification_hash;type:varchar(255)" json:"verification_hash,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
}

func (ConsentLog) TableName() string {
	return "consent_logs"
}

func (c *ConsentLog) IsActive() bool {
	if c.RevokedAt != nil {
		return false
	}

	if c.ExpiresAt != nil && time.Now().After(*c.ExpiresAt) {
		return false
	}

	return c.IsGranted
}

// ============================================================================
// Helper Functions
// ============================================================================

// AcceptTerms records user acceptance of terms
func AcceptTerms(
	db *gorm.DB,
	userID, termsID uuid.UUID,
	method AcceptanceMethod,
	context AcceptanceContext,
	ipAddress string,
	options map[string]interface{},
) (*TermsAcceptance, error) {
	return db.Transaction(func(tx *gorm.DB) (*TermsAcceptance, error) {
		// Get terms
		var terms TermsOfService
		if err := tx.First(&terms, termsID).Error; err != nil {
			return nil, err
		}

		// Check if already accepted
		var existing TermsAcceptance
		err := tx.Where("user_id = ? AND terms_id = ? AND is_accepted = ?", 
			userID, termsID, true).First(&existing).Error

		if err == nil {
			return &existing, nil // Already accepted
		}

		// Create acceptance
		acceptance := &TermsAcceptance{
			UserID:       userID,
			TermsID:      termsID,
			TermsVersion: terms.Version,
			Action:       AcceptanceActionAccepted,
			Method:       method,
			Context:      context,
			IsAccepted:   true,
			IPAddress:    ipAddress,
		}

		// Apply options
		if userAgent, ok := options["user_agent"].(string); ok {
			acceptance.UserAgent = &userAgent
		}
		if deviceType, ok := options["device_type"].(string); ok {
			acceptance.DeviceType = &deviceType
		}
		if signature, ok := options["signature"].(string); ok {
			acceptance.Signature = &signature
			now := time.Now()
			acceptance.SignedAt = &now
		}

		if err := tx.Create(acceptance).Error; err != nil {
			return nil, err
		}

		// Update terms acceptance count
		tx.Model(&terms).Update("acceptance_count", gorm.Expr("acceptance_count + 1"))

		return acceptance, nil
	}).(*TermsAcceptance), nil
}

// RejectTerms records user rejection
func RejectTerms(
	db *gorm.DB,
	userID, termsID uuid.UUID,
	ipAddress string,
	reason *string,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		acceptance := &TermsAcceptance{
			UserID:       userID,
			TermsID:      termsID,
			Action:       AcceptanceActionRejected,
			Method:       AcceptanceMethodClickthrough,
			Context:      AcceptanceContextPrompt,
			IsAccepted:   false,
			IPAddress:    ipAddress,
			Notes:        reason,
		}

		if err := tx.Create(acceptance).Error; err != nil {
			return err
		}

		// Update rejection count
		tx.Model(&TermsOfService{}).Where("_id = ?", termsID).
			Update("rejection_count", gorm.Expr("rejection_count + 1"))

		return nil
	})
}

// CheckUserAcceptance checks if user has accepted terms
func CheckUserAcceptance(
	db *gorm.DB,
	userID uuid.UUID,
	termsType TermsType,
) (bool, *TermsAcceptance, error) {
	// Get active terms
	terms, err := GetActiveTerms(db, termsType, "en")
	if err != nil {
		return false, nil, err
	}

	// Check acceptance
	var acceptance TermsAcceptance
	err = db.Where("user_id = ? AND terms_id = ? AND is_accepted = ?", 
		userID, terms.ID, true).
		First(&acceptance).Error

	if err == gorm.ErrRecordNotFound {
		return false, nil, nil
	}

	if err != nil {
		return false, nil, err
	}

	return acceptance.IsActive(), &acceptance, nil
}

// GetUserAcceptances gets all acceptances for a user
func GetUserAcceptances(
	db *gorm.DB,
	userID uuid.UUID,
) ([]TermsAcceptance, error) {
	var acceptances []TermsAcceptance

	err := db.Where("user_id = ? AND is_accepted = ?", userID, true).
		Preload("Terms").
		Order("created_at DESC").
		Find(&acceptances).Error

	return acceptances, err
}

// CreateReminder creates an acceptance reminder
func CreateReminder(
	db *gorm.DB,
	userID, termsID uuid.UUID,
	message string,
	scheduledAt time.Time,
	channel string,
) (*AcceptanceReminder, error) {
	// Get terms version
	var terms TermsOfService
	if err := db.First(&terms, termsID).Error; err != nil {
		return nil, err
	}

	reminder := &AcceptanceReminder{
		UserID:       userID,
		TermsID:      termsID,
		TermsVersion: terms.Version,
		Status:       ReminderStatusPending,
		Message:      message,
		IsMandatory:  terms.IsMandatory,
		Channel:      channel,
		ScheduledAt:  scheduledAt,
	}

	return reminder, db.Create(reminder).Error
}

// SendReminder marks reminder as sent
func SendReminder(db *gorm.DB, reminderID uuid.UUID) error {
	now := time.Now()
	return db.Model(&AcceptanceReminder{}).
		Where("_id = ?", reminderID).
		Updates(map[string]interface{}{
			"status":  ReminderStatusSent,
			"sent_at": now,
		}).Error
}

// CheckCompliance checks user compliance
func CheckCompliance(
	db *gorm.DB,
	userID uuid.UUID,
	standard string,
) (*ComplianceRecord, error) {
	record := &ComplianceRecord{
		UserID:    userID,
		Standard:  standard,
		CheckDate: time.Now(),
	}

	// Get required terms for standard
	var requiredTerms []TermsOfService
	db.Where("status = ? AND is_latest = ?", TermsStatusActive, true).
		Find(&requiredTerms)

	// Get user acceptances
	var acceptances []TermsAcceptance
	db.Where("user_id = ? AND is_accepted = ?", userID, true).
		Find(&acceptances)

	// Check compliance
	acceptedMap := make(map[uuid.UUID]bool)
	for _, acc := range acceptances {
		if acc.IsActive() {
			acceptedMap[acc.TermsID] = true
		}
	}

	requiredCount := len(requiredTerms)
	acceptedCount := 0
	var missing []string

	for _, terms := range requiredTerms {
		if acceptedMap[terms.ID] {
			acceptedCount++
		} else {
			missing = append(missing, terms.Code)
		}
	}

	// Calculate compliance
	if requiredCount == 0 {
		record.Status = ComplianceStatusUnknown
		record.IsCompliant = false
		record.ComplianceScore = 0
	} else if acceptedCount == requiredCount {
		record.Status = ComplianceStatusCompliant
		record.IsCompliant = true
		record.ComplianceScore = 100
	} else if acceptedCount > 0 {
		record.Status = ComplianceStatusPartial
		record.IsCompliant = false
		record.ComplianceScore = (float64(acceptedCount) / float64(requiredCount)) * 100
		record.RemediationRequired = true
	} else {
		record.Status = ComplianceStatusNonCompliant
		record.IsCompliant = false
		record.ComplianceScore = 0
		record.RemediationRequired = true
	}

	if len(missing) > 0 {
		record.MissingTerms = JSONB{"missing": missing}
	}

	return record, db.Create(record).Error
}

// LogConsent logs detailed consent
func LogConsent(
	db *gorm.DB,
	userID uuid.UUID,
	consentType ConsentType,
	purpose, consentText, version string,
	isGranted bool,
	ipAddress string,
	options map[string]interface{},
) error {
	consent := &ConsentLog{
		UserID:         userID,
		Type:           consentType,
		Purpose:        purpose,
		IsGranted:      isGranted,
		ConsentText:    consentText,
		ConsentVersion: version,
		IsExplicit:     true,
		Method:         AcceptanceMethodCheckbox,
		Context:        "USER_ACTION",
		Source:         "WEB",
		IPAddress:      ipAddress,
		GrantedAt:      time.Now(),
	}

	// Apply options
	if userAgent, ok := options["user_agent"].(string); ok {
		consent.UserAgent = &userAgent
	}
	if sessionID, ok := options["session_id"].(string); ok {
		consent.SessionID = &sessionID
	}

	return db.Create(consent).Error
}

// GetUserConsents gets all consents for a user
func GetUserConsents(
	db *gorm.DB,
	userID uuid.UUID,
	consentType *ConsentType,
) ([]ConsentLog, error) {
	query := db.Where("user_id = ?", userID)

	if consentType != nil {
		query = query.Where("type = ?", consentType)
	}

	var consents []ConsentLog
	err := query.Order("granted_at DESC").Find(&consents).Error

	return consents, err
}

// RevokeConsent revokes a consent
func RevokeConsent(db *gorm.DB, consentID uuid.UUID) error {
	now := time.Now()
	return db.Model(&ConsentLog{}).
		Where("_id = ?", consentID).
		Update("revoked_at", now).Error
}

// GetPendingReminders gets pending reminders to send
func GetPendingReminders(db *gorm.DB) ([]AcceptanceReminder, error) {
	var reminders []AcceptanceReminder

	err := db.Where("status = ? AND scheduled_at <= ?", 
		ReminderStatusPending, time.Now()).
		Preload("Terms").
		Find(&reminders).Error

	return reminders, err
}
