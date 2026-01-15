package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// ACCESS HISTORY - Access & Activity Tracking
// ============================================================================
// Purpose: Track all user access and activities
// Table: access_histories
// Primary Key: _id (UUID)
// Features: Login tracking, Session management, Activity logs
// ============================================================================

type AccessType string

const (
	AccessTypeLogin       AccessType = "LOGIN"
	AccessTypeLogout      AccessType = "LOGOUT"
	AccessTypePageView    AccessType = "PAGE_VIEW"
	AccessTypeAPICall     AccessType = "API_CALL"
	AccessTypeAction      AccessType = "ACTION"
	AccessTypeDownload    AccessType = "DOWNLOAD"
	AccessTypeUpload      AccessType = "UPLOAD"
	AccessTypeSearch      AccessType = "SEARCH"
)

type AccessStatus string

const (
	AccessStatusSuccess AccessStatus = "SUCCESS"
	AccessStatusFailed  AccessStatus = "FAILED"
	AccessStatusBlocked AccessStatus = "BLOCKED"
	AccessStatusPending AccessStatus = "PENDING"
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
// AccessHistory Model (28 fields)
// ============================================================================

type AccessHistory struct {
	// ========== Identity (3 fields) ==========
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   *uuid.UUID `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"`

	// ========== Access Info (5 fields) ==========
	Type        AccessType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status      AccessStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Action      string       `gorm:"column:action;type:varchar(255);not null;index" json:"action"`
	Resource    *string      `gorm:"column:resource;type:varchar(255)" json:"resource,omitempty"`
	Description *string      `gorm:"column:description;type:text" json:"description,omitempty"`

	// ========== Request Info (6 fields) ==========
	Method      *string `gorm:"column:method;type:varchar(10)" json:"method,omitempty"` // GET, POST, etc
	Path        *string `gorm:"column:path;type:text" json:"path,omitempty"`
	QueryParams JSONB   `gorm:"column:query_params;type:jsonb" json:"query_params,omitempty"`
	RequestBody JSONB   `gorm:"column:request_body;type:jsonb" json:"request_body,omitempty"`
	ResponseCode *int   `gorm:"column:response_code" json:"response_code,omitempty"`
	Duration    *int    `gorm:"column:duration" json:"duration,omitempty"` // Milliseconds

	// ========== Client Info (6 fields) ==========
	IPAddress  string  `gorm:"column:ip_address;type:varchar(50);index" json:"ip_address"`
	UserAgent  *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	DeviceType *string `gorm:"column:device_type;type:varchar(50)" json:"device_type,omitempty"` // mobile, desktop, tablet
	OS         *string `gorm:"column:os;type:varchar(50)" json:"os,omitempty"`
	Browser    *string `gorm:"column:browser;type:varchar(50)" json:"browser,omitempty"`
	Platform   *string `gorm:"column:platform;type:varchar(50)" json:"platform,omitempty"`

	// ========== Session Info (2 fields) ==========
	SessionID *uuid.UUID `gorm:"column:session_id;type:uuid;index" json:"session_id,omitempty"`
	RequestID *string    `gorm:"column:request_id;type:varchar(100)" json:"request_id,omitempty"`

	// ========== Location (3 fields) ==========
	Country  *string `gorm:"column:country;type:varchar(100)" json:"country,omitempty"`
	City     *string `gorm:"column:city;type:varchar(100)" json:"city,omitempty"`
	Location JSONB   `gorm:"column:location;type:jsonb" json:"location,omitempty"` // lat, lng, etc

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Timestamp (2 fields) ==========
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	ExpiresAt *time.Time `gorm:"column:expires_at;index" json:"expires_at,omitempty"` // For retention policy

	// Relationships
	Session *SessionHistory `gorm:"foreignKey:SessionID" json:"session,omitempty"`
}

func (AccessHistory) TableName() string {
	return "access_histories"
}

func (a *AccessHistory) IsSuccess() bool {
	return a.Status == AccessStatusSuccess
}

func (a *AccessHistory) IsFailed() bool {
	return a.Status == AccessStatusFailed
}

// ============================================================================
// LOGIN HISTORY - Login/Logout Tracking
// ============================================================================

type LoginStatus string

const (
	LoginStatusSuccess       LoginStatus = "SUCCESS"
	LoginStatusFailed        LoginStatus = "FAILED"
	LoginStatusBlocked       LoginStatus = "BLOCKED"
	LoginStatusMFARequired   LoginStatus = "MFA_REQUIRED"
	LoginStatusMFASuccess    LoginStatus = "MFA_SUCCESS"
	LoginStatusMFAFailed     LoginStatus = "MFA_FAILED"
)

type LoginMethod string

const (
	LoginMethodPassword  LoginMethod = "PASSWORD"
	LoginMethodOAuth     LoginMethod = "OAUTH"
	LoginMethodSSO       LoginMethod = "SSO"
	LoginMethodMagicLink LoginMethod = "MAGIC_LINK"
	LoginMethodBiometric LoginMethod = "BIOMETRIC"
	LoginMethodAPIKey    LoginMethod = "API_KEY"
)

type LoginHistory struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`

	// Login Info (5 fields)
	Status      LoginStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Method      LoginMethod `gorm:"column:method;type:varchar(20);not null" json:"method"`
	Provider    *string     `gorm:"column:provider;type:varchar(50)" json:"provider,omitempty"` // google, facebook, etc
	IsSuccessful bool       `gorm:"column:is_successful;not null;index" json:"is_successful"`
	FailureReason *string   `gorm:"column:failure_reason;type:text" json:"failure_reason,omitempty"`

	// Client Info (7 fields)
	IPAddress    string  `gorm:"column:ip_address;type:varchar(50);index" json:"ip_address"`
	UserAgent    *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	DeviceType   *string `gorm:"column:device_type;type:varchar(50)" json:"device_type,omitempty"`
	OS           *string `gorm:"column:os;type:varchar(50)" json:"os,omitempty"`
	Browser      *string `gorm:"column:browser;type:varchar(50)" json:"browser,omitempty"`
	DeviceID     *string `gorm:"column:device_id;type:varchar(255)" json:"device_id,omitempty"`
	Fingerprint  *string `gorm:"column:fingerprint;type:varchar(255)" json:"fingerprint,omitempty"`

	// Location (3 fields)
	Country  *string `gorm:"column:country;type:varchar(100)" json:"country,omitempty"`
	City     *string `gorm:"column:city;type:varchar(100)" json:"city,omitempty"`
	Location JSONB   `gorm:"column:location;type:jsonb" json:"location,omitempty"`

	// Session (2 fields)
	SessionID    *uuid.UUID `gorm:"column:session_id;type:uuid;index" json:"session_id,omitempty"`
	SessionToken *string    `gorm:"column:session_token;type:varchar(255)" json:"session_token,omitempty"`

	// MFA (3 fields)
	MFAEnabled  bool    `gorm:"column:mfa_enabled;default:false" json:"mfa_enabled"`
	MFAMethod   *string `gorm:"column:mfa_method;type:varchar(50)" json:"mfa_method,omitempty"`
	MFAVerified bool    `gorm:"column:mfa_verified;default:false" json:"mfa_verified"`

	// Risk Assessment (2 fields)
	RiskScore  *float64 `gorm:"column:risk_score;type:decimal(5,2)" json:"risk_score,omitempty"`
	RiskLevel  *string  `gorm:"column:risk_level;type:varchar(20)" json:"risk_level,omitempty"` // LOW, MEDIUM, HIGH

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Timestamp (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	LogoutAt  *time.Time `gorm:"column:logout_at" json:"logout_at,omitempty"`

	// Relationships
	Session *SessionHistory `gorm:"foreignKey:SessionID" json:"session,omitempty"`
}

func (LoginHistory) TableName() string {
	return "login_histories"
}

func (l *LoginHistory) IsSuccess() bool {
	return l.IsSuccessful && l.Status == LoginStatusSuccess
}

func (l *LoginHistory) RequiresMFA() bool {
	return l.Status == LoginStatusMFARequired
}

// ============================================================================
// SESSION HISTORY - Session Management
// ============================================================================

type SessionStatus string

const (
	SessionStatusActive   SessionStatus = "ACTIVE"
	SessionStatusExpired  SessionStatus = "EXPIRED"
	SessionStatusRevoked  SessionStatus = "REVOKED"
	SessionStatusLoggedOut SessionStatus = "LOGGED_OUT"
)

type SessionHistory struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`

	// Session Info (5 fields)
	SessionToken string        `gorm:"column:session_token;type:varchar(255);uniqueIndex;not null" json:"session_token"`
	Status       SessionStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	LoginMethod  LoginMethod   `gorm:"column:login_method;type:varchar(20);not null" json:"login_method"`
	IsActive     bool          `gorm:"column:is_active;not null;index" json:"is_active"`
	LastActivity time.Time     `gorm:"column:last_activity;not null;index" json:"last_activity"`

	// Client Info (7 fields)
	IPAddress   string  `gorm:"column:ip_address;type:varchar(50);index" json:"ip_address"`
	UserAgent   *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	DeviceType  *string `gorm:"column:device_type;type:varchar(50)" json:"device_type,omitempty"`
	OS          *string `gorm:"column:os;type:varchar(50)" json:"os,omitempty"`
	Browser     *string `gorm:"column:browser;type:varchar(50)" json:"browser,omitempty"`
	DeviceID    *string `gorm:"column:device_id;type:varchar(255)" json:"device_id,omitempty"`
	Fingerprint *string `gorm:"column:fingerprint;type:varchar(255)" json:"fingerprint,omitempty"`

	// Location (3 fields)
	Country  *string `gorm:"column:country;type:varchar(100)" json:"country,omitempty"`
	City     *string `gorm:"column:city;type:varchar(100)" json:"city,omitempty"`
	Location JSONB   `gorm:"column:location;type:jsonb" json:"location,omitempty"`

	// Time Tracking (4 fields)
	StartedAt time.Time  `gorm:"column:started_at;not null;index" json:"started_at"`
	ExpiresAt time.Time  `gorm:"column:expires_at;not null;index" json:"expires_at"`
	EndedAt   *time.Time `gorm:"column:ended_at" json:"ended_at,omitempty"`
	Duration  *int       `gorm:"column:duration" json:"duration,omitempty"` // Seconds

	// Activity Stats (3 fields)
	RequestCount int64 `gorm:"column:request_count;default:0" json:"request_count"`
	PageViews    int64 `gorm:"column:page_views;default:0" json:"page_views"`
	APICallCount int64 `gorm:"column:api_call_count;default:0" json:"api_call_count"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	LoginHistory  *LoginHistory   `gorm:"foreignKey:SessionID;references:ID" json:"login_history,omitempty"`
	AccessHistories []AccessHistory `gorm:"foreignKey:SessionID" json:"access_histories,omitempty"`
}

func (SessionHistory) TableName() string {
	return "session_histories"
}

func (s *SessionHistory) IsActive() bool {
	return s.Status == SessionStatusActive && s.IsActive
}

func (s *SessionHistory) IsExpired() bool {
	return time.Now().After(s.ExpiresAt)
}

func (s *SessionHistory) UpdateActivity() {
	s.LastActivity = time.Now()
	s.RequestCount++
}

// ============================================================================
// ACTIVITY LOG - User Activities
// ============================================================================

type ActivityType string

const (
	ActivityTypeCreate ActivityType = "CREATE"
	ActivityTypeRead   ActivityType = "READ"
	ActivityTypeUpdate ActivityType = "UPDATE"
	ActivityTypeDelete ActivityType = "DELETE"
	ActivityTypeExport ActivityType = "EXPORT"
	ActivityTypeImport ActivityType = "IMPORT"
	ActivityTypeShare  ActivityType = "SHARE"
	ActivityTypeDownload ActivityType = "DOWNLOAD"
)

type ActivityCategory string

const (
	ActivityCategoryUser    ActivityCategory = "USER"
	ActivityCategoryContent ActivityCategory = "CONTENT"
	ActivityCategorySettings ActivityCategory = "SETTINGS"
	ActivityCategorySecurity ActivityCategory = "SECURITY"
	ActivityCategoryBilling ActivityCategory = "BILLING"
	ActivityCategorySystem  ActivityCategory = "SYSTEM"
)

type ActivityLog struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index" json:"user_id"`

	// Activity Info (7 fields)
	Type        ActivityType     `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Category    ActivityCategory `gorm:"column:category;type:varchar(20);not null;index" json:"category"`
	Action      string           `gorm:"column:action;type:varchar(255);not null;index" json:"action"`
	Resource    string           `gorm:"column:resource;type:varchar(255);not null;index" json:"resource"`
	ResourceID  *uuid.UUID       `gorm:"column:resource_id;type:uuid;index" json:"resource_id,omitempty"`
	Description string           `gorm:"column:description;type:text;not null" json:"description"`
	IsSuccess   bool             `gorm:"column:is_success;default:true" json:"is_success"`

	// Changes (3 fields)
	OldValue JSONB  `gorm:"column:old_value;type:jsonb" json:"old_value,omitempty"`
	NewValue JSONB  `gorm:"column:new_value;type:jsonb" json:"new_value,omitempty"`
	Changes  JSONB  `gorm:"column:changes;type:jsonb" json:"changes,omitempty"`

	// Context (5 fields)
	IPAddress  string     `gorm:"column:ip_address;type:varchar(50)" json:"ip_address"`
	UserAgent  *string    `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	SessionID  *uuid.UUID `gorm:"column:session_id;type:uuid;index" json:"session_id,omitempty"`
	RequestID  *string    `gorm:"column:request_id;type:varchar(100)" json:"request_id,omitempty"`
	Referrer   *string    `gorm:"column:referrer;type:text" json:"referrer,omitempty"`

	// Impact (2 fields)
	Severity *string `gorm:"column:severity;type:varchar(20)" json:"severity,omitempty"` // LOW, MEDIUM, HIGH, CRITICAL
	Impact   JSONB   `gorm:"column:impact;type:jsonb" json:"impact,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Timestamp (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
}

func (ActivityLog) TableName() string {
	return "activity_logs"
}

func (a *ActivityLog) IsCritical() bool {
	return a.Severity != nil && *a.Severity == "CRITICAL"
}

// ============================================================================
// PAGE VIEW - Page Visit Tracking
// ============================================================================

type PageView struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	UserID   *uuid.UUID `gorm:"column:user_id;type:uuid;index" json:"user_id,omitempty"` // Nullable for anonymous

	// Page Info (6 fields)
	Path       string  `gorm:"column:path;type:text;not null;index" json:"path"`
	Title      *string `gorm:"column:title;type:varchar(255)" json:"title,omitempty"`
	Referrer   *string `gorm:"column:referrer;type:text" json:"referrer,omitempty"`
	Query      JSONB   `gorm:"column:query;type:jsonb" json:"query,omitempty"`
	Hash       *string `gorm:"column:hash;type:varchar(255)" json:"hash,omitempty"`
	LoadTime   *int    `gorm:"column:load_time" json:"load_time,omitempty"` // Milliseconds

	// Session (2 fields)
	SessionID    *uuid.UUID `gorm:"column:session_id;type:uuid;index" json:"session_id,omitempty"`
	VisitorID    *string    `gorm:"column:visitor_id;type:varchar(255);index" json:"visitor_id,omitempty"` // For anonymous tracking

	// Client Info (6 fields)
	IPAddress  string  `gorm:"column:ip_address;type:varchar(50);index" json:"ip_address"`
	UserAgent  *string `gorm:"column:user_agent;type:text" json:"user_agent,omitempty"`
	DeviceType *string `gorm:"column:device_type;type:varchar(50)" json:"device_type,omitempty"`
	OS         *string `gorm:"column:os;type:varchar(50)" json:"os,omitempty"`
	Browser    *string `gorm:"column:browser;type:varchar(50)" json:"browser,omitempty"`
	ScreenSize *string `gorm:"column:screen_size;type:varchar(50)" json:"screen_size,omitempty"`

	// Engagement (3 fields)
	TimeOnPage *int  `gorm:"column:time_on_page" json:"time_on_page,omitempty"` // Seconds
	ScrollDepth *int `gorm:"column:scroll_depth" json:"scroll_depth,omitempty"` // Percentage
	IsExitPage bool  `gorm:"column:is_exit_page;default:false" json:"is_exit_page"`

	// Location (3 fields)
	Country  *string `gorm:"column:country;type:varchar(100)" json:"country,omitempty"`
	City     *string `gorm:"column:city;type:varchar(100)" json:"city,omitempty"`
	Location JSONB   `gorm:"column:location;type:jsonb" json:"location,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Timestamp (1 field)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
}

func (PageView) TableName() string {
	return "page_views"
}

// ============================================================================
// Helper Functions
// ============================================================================

// LogAccess logs an access event
func LogAccess(
	db *gorm.DB,
	userID *uuid.UUID,
	accessType AccessType,
	action string,
	ipAddress string,
	options map[string]interface{},
) error {
	access := &AccessHistory{
		UserID:    userID,
		Type:      accessType,
		Status:    AccessStatusSuccess,
		Action:    action,
		IPAddress: ipAddress,
	}

	// Apply options
	if resource, ok := options["resource"].(string); ok {
		access.Resource = &resource
	}
	if method, ok := options["method"].(string); ok {
		access.Method = &method
	}
	if path, ok := options["path"].(string); ok {
		access.Path = &path
	}
	if userAgent, ok := options["user_agent"].(string); ok {
		access.UserAgent = &userAgent
	}
	if sessionID, ok := options["session_id"].(uuid.UUID); ok {
		access.SessionID = &sessionID
	}

	return db.Create(access).Error
}

// LogLogin logs a login attempt
func LogLogin(
	db *gorm.DB,
	userID uuid.UUID,
	method LoginMethod,
	ipAddress string,
	isSuccessful bool,
	options map[string]interface{},
) (*LoginHistory, error) {
	status := LoginStatusSuccess
	if !isSuccessful {
		status = LoginStatusFailed
	}

	login := &LoginHistory{
		UserID:       userID,
		Status:       status,
		Method:       method,
		IsSuccessful: isSuccessful,
		IPAddress:    ipAddress,
	}

	// Apply options
	if userAgent, ok := options["user_agent"].(string); ok {
		login.UserAgent = &userAgent
	}
	if deviceType, ok := options["device_type"].(string); ok {
		login.DeviceType = &deviceType
	}
	if failureReason, ok := options["failure_reason"].(string); ok {
		login.FailureReason = &failureReason
	}
	if sessionID, ok := options["session_id"].(uuid.UUID); ok {
		login.SessionID = &sessionID
	}

	if err := db.Create(login).Error; err != nil {
		return nil, err
	}

	return login, nil
}

// CreateSession creates a new session
func CreateSession(
	db *gorm.DB,
	userID uuid.UUID,
	sessionToken string,
	loginMethod LoginMethod,
	ipAddress string,
	expiresIn time.Duration,
	options map[string]interface{},
) (*SessionHistory, error) {
	now := time.Now()

	session := &SessionHistory{
		UserID:       userID,
		SessionToken: sessionToken,
		Status:       SessionStatusActive,
		LoginMethod:  loginMethod,
		IsActive:     true,
		IPAddress:    ipAddress,
		StartedAt:    now,
		ExpiresAt:    now.Add(expiresIn),
		LastActivity: now,
	}

	// Apply options
	if userAgent, ok := options["user_agent"].(string); ok {
		session.UserAgent = &userAgent
	}
	if deviceType, ok := options["device_type"].(string); ok {
		session.DeviceType = &deviceType
	}
	if deviceID, ok := options["device_id"].(string); ok {
		session.DeviceID = &deviceID
	}

	return session, db.Create(session).Error
}

// EndSession ends a session
func EndSession(db *gorm.DB, sessionID uuid.UUID) error {
	now := time.Now()

	var session SessionHistory
	if err := db.First(&session, sessionID).Error; err != nil {
		return err
	}

	duration := int(now.Sub(session.StartedAt).Seconds())

	return db.Model(&session).Updates(map[string]interface{}{
		"status":    SessionStatusLoggedOut,
		"is_active": false,
		"ended_at":  now,
		"duration":  duration,
	}).Error
}

// LogActivity logs a user activity
func LogActivity(
	db *gorm.DB,
	userID uuid.UUID,
	activityType ActivityType,
	category ActivityCategory,
	action, resource, description string,
	ipAddress string,
	options map[string]interface{},
) error {
	activity := &ActivityLog{
		UserID:      userID,
		Type:        activityType,
		Category:    category,
		Action:      action,
		Resource:    resource,
		Description: description,
		IPAddress:   ipAddress,
		IsSuccess:   true,
	}

	// Apply options
	if resourceID, ok := options["resource_id"].(uuid.UUID); ok {
		activity.ResourceID = &resourceID
	}
	if oldValue, ok := options["old_value"].(map[string]interface{}); ok {
		activity.OldValue = oldValue
	}
	if newValue, ok := options["new_value"].(map[string]interface{}); ok {
		activity.NewValue = newValue
	}
	if severity, ok := options["severity"].(string); ok {
		activity.Severity = &severity
	}

	return db.Create(activity).Error
}

// LogPageView logs a page view
func LogPageView(
	db *gorm.DB,
	path string,
	ipAddress string,
	userID *uuid.UUID,
	options map[string]interface{},
) error {
	pageView := &PageView{
		UserID:    userID,
		Path:      path,
		IPAddress: ipAddress,
	}

	// Apply options
	if title, ok := options["title"].(string); ok {
		pageView.Title = &title
	}
	if referrer, ok := options["referrer"].(string); ok {
		pageView.Referrer = &referrer
	}
	if userAgent, ok := options["user_agent"].(string); ok {
		pageView.UserAgent = &userAgent
	}
	if sessionID, ok := options["session_id"].(uuid.UUID); ok {
		pageView.SessionID = &sessionID
	}

	return db.Create(pageView).Error
}

// GetUserAccessHistory gets access history for a user
func GetUserAccessHistory(
	db *gorm.DB,
	userID uuid.UUID,
	limit int,
) ([]AccessHistory, error) {
	var history []AccessHistory

	err := db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&history).Error

	return history, err
}

// GetUserLoginHistory gets login history for a user
func GetUserLoginHistory(
	db *gorm.DB,
	userID uuid.UUID,
	limit int,
) ([]LoginHistory, error) {
	var history []LoginHistory

	err := db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&history).Error

	return history, err
}

// GetActiveSession gets active session for a user
func GetActiveSession(db *gorm.DB, userID uuid.UUID) (*SessionHistory, error) {
	var session SessionHistory

	err := db.Where("user_id = ? AND status = ? AND is_active = ?", 
		userID, SessionStatusActive, true).
		Order("created_at DESC").
		First(&session).Error

	return &session, err
}

// GetActiveSessions gets all active sessions for a user
func GetActiveSessions(db *gorm.DB, userID uuid.UUID) ([]SessionHistory, error) {
	var sessions []SessionHistory

	err := db.Where("user_id = ? AND status = ? AND is_active = ?", 
		userID, SessionStatusActive, true).
		Order("last_activity DESC").
		Find(&sessions).Error

	return sessions, err
}

// ExpireSessions expires sessions that have passed their expiry time
func ExpireSessions(db *gorm.DB) error {
	return db.Model(&SessionHistory{}).
		Where("status = ? AND expires_at < ?", SessionStatusActive, time.Now()).
		Updates(map[string]interface{}{
			"status":    SessionStatusExpired,
			"is_active": false,
		}).Error
}

// GetRecentActivity gets recent activity for a user
func GetRecentActivity(
	db *gorm.DB,
	userID uuid.UUID,
	limit int,
) ([]ActivityLog, error) {
	var activities []ActivityLog

	err := db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error

	return activities, err
}

func strPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}
