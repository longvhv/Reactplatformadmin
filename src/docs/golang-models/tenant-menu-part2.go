package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ==================== WEBHOOKS ====================

// WebhookMethod represents HTTP methods for webhooks
type WebhookMethod string

const (
	WebhookMethodPOST   WebhookMethod = "POST"
	WebhookMethodGET    WebhookMethod = "GET"
	WebhookMethodPUT    WebhookMethod = "PUT"
	WebhookMethodPATCH  WebhookMethod = "PATCH"
	WebhookMethodDELETE WebhookMethod = "DELETE"
)

// IsValid validates webhook method
func (m WebhookMethod) IsValid() bool {
	switch m {
	case WebhookMethodPOST, WebhookMethodGET, WebhookMethodPUT, WebhookMethodPATCH, WebhookMethodDELETE:
		return true
	}
	return false
}

// WebhookAuthType represents authentication types
type WebhookAuthType string

const (
	WebhookAuthNone   WebhookAuthType = "none"
	WebhookAuthBasic  WebhookAuthType = "basic"
	WebhookAuthBearer WebhookAuthType = "bearer"
	WebhookAuthAPIKey WebhookAuthType = "api_key"
	WebhookAuthOAuth2 WebhookAuthType = "oauth2"
)

// IsValid validates auth type
func (a WebhookAuthType) IsValid() bool {
	switch a {
	case WebhookAuthNone, WebhookAuthBasic, WebhookAuthBearer, WebhookAuthAPIKey, WebhookAuthOAuth2:
		return true
	}
	return false
}

// RetryConfig represents retry configuration for webhooks
type RetryConfig struct {
	MaxRetries        int     `json:"max_retries,omitempty"`
	RetryDelay        int     `json:"retry_delay,omitempty"`        // in milliseconds
	BackoffMultiplier float64 `json:"backoff_multiplier,omitempty"` // exponential backoff
}

// Value implements driver.Valuer
func (r RetryConfig) Value() (driver.Value, error) {
	return json.Marshal(r)
}

// Scan implements sql.Scanner
func (r *RetryConfig) Scan(value interface{}) error {
	if value == nil {
		*r = RetryConfig{MaxRetries: 3, RetryDelay: 1000, BackoffMultiplier: 2.0}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal RetryConfig value")
	}

	return json.Unmarshal(bytes, r)
}

// Webhook represents a webhook configuration
// Table: webhooks
type Webhook struct {
	ID                uuid.UUID       `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID          uuid.UUID       `gorm:"column:tenant_id;type:uuid;not null;index:idx_webhooks_tenant" json:"tenant_id"`
	Name              string          `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description       *string         `gorm:"column:description;type:text" json:"description"`
	URL               string          `gorm:"column:url;type:text;not null" json:"url"`
	Method            WebhookMethod   `gorm:"column:method;type:varchar(10);not null;default:'POST'" json:"method"`
	EventTypes        StringArray     `gorm:"column:event_types;type:text[];not null" json:"event_types"`
	EventFilter       JSONB           `gorm:"column:event_filter;type:jsonb" json:"event_filter"`
	SecretKey         *string         `gorm:"column:secret_key;type:text" json:"secret_key"`
	AuthType          WebhookAuthType `gorm:"column:auth_type;type:varchar(20);not null;default:'none'" json:"auth_type"`
	AuthConfig        JSONB           `gorm:"column:auth_config;type:jsonb" json:"auth_config"`
	Headers           JSONB           `gorm:"column:headers;type:jsonb" json:"headers"`
	TimeoutMS         int             `gorm:"column:timeout_ms;type:int;not null;default:30000" json:"timeout_ms"`
	RetryConfig       RetryConfig     `gorm:"column:retry_config;type:jsonb;not null" json:"retry_config"`
	IsActive          bool            `gorm:"column:is_active;type:boolean;not null;default:true" json:"is_active"`
	IsVerified        bool            `gorm:"column:is_verified;type:boolean;not null;default:false" json:"is_verified"`
	VerificationToken *string         `gorm:"column:verification_token;type:varchar(255)" json:"verification_token"`
	VerifiedAt        *time.Time      `gorm:"column:verified_at;type:timestamptz" json:"verified_at"`
	LastTriggeredAt   *time.Time      `gorm:"column:last_triggered_at;type:timestamptz" json:"last_triggered_at"`
	LastSuccessAt     *time.Time      `gorm:"column:last_success_at;type:timestamptz" json:"last_success_at"`
	LastFailureAt     *time.Time      `gorm:"column:last_failure_at;type:timestamptz" json:"last_failure_at"`
	SuccessCount      int             `gorm:"column:success_count;type:int;not null;default:0" json:"success_count"`
	FailureCount      int             `gorm:"column:failure_count;type:int;not null;default:0" json:"failure_count"`
	TotalCount        int             `gorm:"column:total_count;type:int;not null;default:0" json:"total_count"`
	AvgResponseTimeMS *float64        `gorm:"column:avg_response_time_ms;type:decimal(10,2)" json:"avg_response_time_ms"`
	BatchSize         *int            `gorm:"column:batch_size;type:int" json:"batch_size"`
	RateLimit         *int            `gorm:"column:rate_limit;type:int" json:"rate_limit"`
	Priority          int             `gorm:"column:priority;type:int;not null;default:0" json:"priority"`
	Tags              StringArray     `gorm:"column:tags;type:text[]" json:"tags"`
	Metadata          JSONB           `gorm:"column:metadata;type:jsonb;not null;default:'{}'" json:"metadata"`
	CreatedAt         time.Time       `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt         time.Time       `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	CreatedBy         *uuid.UUID      `gorm:"column:created_by;type:uuid" json:"created_by"`
	UpdatedBy         *uuid.UUID      `gorm:"column:updated_by;type:uuid" json:"updated_by"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (Webhook) TableName() string {
	return "webhooks"
}

// BeforeCreate hook
func (w *Webhook) BeforeCreate(tx *gorm.DB) error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}

	// Set defaults
	if w.Method == "" {
		w.Method = WebhookMethodPOST
	}
	if w.AuthType == "" {
		w.AuthType = WebhookAuthNone
	}
	if w.TimeoutMS == 0 {
		w.TimeoutMS = 30000
	}
	if w.RetryConfig.MaxRetries == 0 {
		w.RetryConfig = RetryConfig{MaxRetries: 3, RetryDelay: 1000, BackoffMultiplier: 2.0}
	}
	if w.EventTypes == nil {
		w.EventTypes = []string{}
	}
	if w.Tags == nil {
		w.Tags = []string{}
	}
	if w.Metadata == nil {
		w.Metadata = make(map[string]interface{})
	}

	// Generate verification token if not provided
	if w.VerificationToken == nil {
		token := uuid.New().String()
		w.VerificationToken = &token
	}

	return w.Validate()
}

// BeforeUpdate hook
func (w *Webhook) BeforeUpdate(tx *gorm.DB) error {
	w.UpdatedAt = time.Now()
	return w.Validate()
}

// Validate validates the webhook
func (w *Webhook) Validate() error {
	if w.Name == "" {
		return errors.New("name is required")
	}
	if w.URL == "" {
		return errors.New("url is required")
	}

	// Validate URL format
	if _, err := url.ParseRequestURI(w.URL); err != nil {
		return fmt.Errorf("invalid URL: %w", err)
	}

	if !w.Method.IsValid() {
		return errors.New("invalid method")
	}
	if !w.AuthType.IsValid() {
		return errors.New("invalid auth_type")
	}

	if len(w.EventTypes) == 0 {
		return errors.New("at least one event_type is required")
	}

	if w.TimeoutMS <= 0 {
		return errors.New("timeout_ms must be positive")
	}

	return nil
}

// IsHealthy checks if webhook is healthy (success rate > 90%)
func (w *Webhook) IsHealthy() bool {
	if w.TotalCount == 0 {
		return true
	}
	successRate := float64(w.SuccessCount) / float64(w.TotalCount) * 100
	return successRate >= 90.0
}

// GetSuccessRate returns success rate percentage
func (w *Webhook) GetSuccessRate() float64 {
	if w.TotalCount == 0 {
		return 0
	}
	return float64(w.SuccessCount) / float64(w.TotalCount) * 100
}

// RecordSuccess records a successful webhook call
func (w *Webhook) RecordSuccess(responseTimeMS int) {
	now := time.Now()
	w.LastTriggeredAt = &now
	w.LastSuccessAt = &now
	w.SuccessCount++
	w.TotalCount++

	// Update average response time
	if w.AvgResponseTimeMS == nil {
		avg := float64(responseTimeMS)
		w.AvgResponseTimeMS = &avg
	} else {
		*w.AvgResponseTimeMS = (*w.AvgResponseTimeMS*float64(w.TotalCount-1) + float64(responseTimeMS)) / float64(w.TotalCount)
	}
}

// RecordFailure records a failed webhook call
func (w *Webhook) RecordFailure() {
	now := time.Now()
	w.LastTriggeredAt = &now
	w.LastFailureAt = &now
	w.FailureCount++
	w.TotalCount++
}

// Verify marks the webhook as verified
func (w *Webhook) Verify() {
	w.IsVerified = true
	now := time.Now()
	w.VerifiedAt = &now
}

// HasEvent checks if webhook listens to a specific event
func (w *Webhook) HasEvent(eventType string) bool {
	for _, et := range w.EventTypes {
		if et == eventType {
			return true
		}
	}
	return false
}

// CreateWebhookRequest represents the request to create a webhook
type CreateWebhookRequest struct {
	TenantID      uuid.UUID       `json:"tenant_id" binding:"required"`
	Name          string          `json:"name" binding:"required"`
	Description   *string         `json:"description,omitempty"`
	URL           string          `json:"url" binding:"required,url"`
	Method        WebhookMethod   `json:"method,omitempty"`
	EventTypes    []string        `json:"event_types" binding:"required,min=1"`
	EventFilter   JSONB           `json:"event_filter,omitempty"`
	SecretKey     *string         `json:"secret_key,omitempty"`
	AuthType      WebhookAuthType `json:"auth_type,omitempty"`
	AuthConfig    JSONB           `json:"auth_config,omitempty"`
	Headers       JSONB           `json:"headers,omitempty"`
	TimeoutMS     int             `json:"timeout_ms,omitempty"`
	RetryConfig   *RetryConfig    `json:"retry_config,omitempty"`
	BatchSize     *int            `json:"batch_size,omitempty"`
	RateLimit     *int            `json:"rate_limit,omitempty"`
	Priority      int             `json:"priority,omitempty"`
	Tags          []string        `json:"tags,omitempty"`
	Metadata      JSONB           `json:"metadata,omitempty"`
	CreatedBy     *uuid.UUID      `json:"created_by,omitempty"`
}

// UpdateWebhookRequest represents the request to update a webhook
type UpdateWebhookRequest struct {
	Name          *string          `json:"name,omitempty"`
	Description   *string          `json:"description,omitempty"`
	URL           *string          `json:"url,omitempty"`
	Method        *WebhookMethod   `json:"method,omitempty"`
	EventTypes    []string         `json:"event_types,omitempty"`
	EventFilter   JSONB            `json:"event_filter,omitempty"`
	SecretKey     *string          `json:"secret_key,omitempty"`
	AuthType      *WebhookAuthType `json:"auth_type,omitempty"`
	AuthConfig    JSONB            `json:"auth_config,omitempty"`
	Headers       JSONB            `json:"headers,omitempty"`
	TimeoutMS     *int             `json:"timeout_ms,omitempty"`
	RetryConfig   *RetryConfig     `json:"retry_config,omitempty"`
	IsActive      *bool            `json:"is_active,omitempty"`
	BatchSize     *int             `json:"batch_size,omitempty"`
	RateLimit     *int             `json:"rate_limit,omitempty"`
	Priority      *int             `json:"priority,omitempty"`
	Tags          []string         `json:"tags,omitempty"`
	Metadata      JSONB            `json:"metadata,omitempty"`
	UpdatedBy     *uuid.UUID       `json:"updated_by,omitempty"`
}

// WebhookResponse represents the API response
type WebhookResponse struct {
	ID                uuid.UUID       `json:"_id"`
	TenantID          uuid.UUID       `json:"tenant_id"`
	Name              string          `json:"name"`
	Description       *string         `json:"description"`
	URL               string          `json:"url"`
	Method            WebhookMethod   `json:"method"`
	EventTypes        []string        `json:"event_types"`
	EventFilter       JSONB           `json:"event_filter"`
	SecretKey         *string         `json:"secret_key"`
	AuthType          WebhookAuthType `json:"auth_type"`
	AuthConfig        JSONB           `json:"auth_config"`
	Headers           JSONB           `json:"headers"`
	TimeoutMS         int             `json:"timeout_ms"`
	RetryConfig       RetryConfig     `json:"retry_config"`
	IsActive          bool            `json:"is_active"`
	IsVerified        bool            `json:"is_verified"`
	VerificationToken *string         `json:"verification_token"`
	VerifiedAt        *time.Time      `json:"verified_at"`
	LastTriggeredAt   *time.Time      `json:"last_triggered_at"`
	LastSuccessAt     *time.Time      `json:"last_success_at"`
	LastFailureAt     *time.Time      `json:"last_failure_at"`
	SuccessCount      int             `json:"success_count"`
	FailureCount      int             `json:"failure_count"`
	TotalCount        int             `json:"total_count"`
	AvgResponseTimeMS *float64        `json:"avg_response_time_ms"`
	BatchSize         *int            `json:"batch_size"`
	RateLimit         *int            `json:"rate_limit"`
	Priority          int             `json:"priority"`
	Tags              []string        `json:"tags"`
	Metadata          JSONB           `json:"metadata"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
	CreatedBy         *uuid.UUID      `json:"created_by"`
	UpdatedBy         *uuid.UUID      `json:"updated_by"`
}

// ToResponse converts to response (hides secret_key)
func (w *Webhook) ToResponse() *WebhookResponse {
	return &WebhookResponse{
		ID:                w.ID,
		TenantID:          w.TenantID,
		Name:              w.Name,
		Description:       w.Description,
		URL:               w.URL,
		Method:            w.Method,
		EventTypes:        w.EventTypes,
		EventFilter:       w.EventFilter,
		SecretKey:         nil, // Don't expose secret key
		AuthType:          w.AuthType,
		AuthConfig:        w.AuthConfig,
		Headers:           w.Headers,
		TimeoutMS:         w.TimeoutMS,
		RetryConfig:       w.RetryConfig,
		IsActive:          w.IsActive,
		IsVerified:        w.IsVerified,
		VerificationToken: w.VerificationToken,
		VerifiedAt:        w.VerifiedAt,
		LastTriggeredAt:   w.LastTriggeredAt,
		LastSuccessAt:     w.LastSuccessAt,
		LastFailureAt:     w.LastFailureAt,
		SuccessCount:      w.SuccessCount,
		FailureCount:      w.FailureCount,
		TotalCount:        w.TotalCount,
		AvgResponseTimeMS: w.AvgResponseTimeMS,
		BatchSize:         w.BatchSize,
		RateLimit:         w.RateLimit,
		Priority:          w.Priority,
		Tags:              w.Tags,
		Metadata:          w.Metadata,
		CreatedAt:         w.CreatedAt,
		UpdatedAt:         w.UpdatedAt,
		CreatedBy:         w.CreatedBy,
		UpdatedBy:         w.UpdatedBy,
	}
}

// WebhookStats provides statistics for webhooks
type WebhookStats struct {
	Total            int     `json:"total"`
	Active           int     `json:"active"`
	Verified         int     `json:"verified"`
	Healthy          int     `json:"healthy"`
	TotalCalls       int     `json:"total_calls"`
	SuccessfulCalls  int     `json:"successful_calls"`
	FailedCalls      int     `json:"failed_calls"`
	AvgSuccessRate   float64 `json:"avg_success_rate"`
	AvgResponseTime  float64 `json:"avg_response_time"`
	ByEventType      map[string]int `json:"by_event_type"`
}

// Query Scopes
func ScopeWebhooksByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

func ScopeActiveWebhooks(db *gorm.DB) *gorm.DB {
	return db.Where("is_active = ?", true)
}

func ScopeVerifiedWebhooks(db *gorm.DB) *gorm.DB {
	return db.Where("is_verified = ?", true)
}

func ScopeWebhooksByEvent(eventType string) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("? = ANY(event_types)", eventType)
	}
}

// ==================== SSO CONFIGS ====================

// SSOProvider represents SSO authentication providers
type SSOProvider string

const (
	SSOProviderSAML   SSOProvider = "SAML"
	SSOProviderOAuth2 SSOProvider = "OAUTH2"
	SSOProviderOIDC   SSOProvider = "OIDC"
	SSOProviderLDAP   SSOProvider = "LDAP"
	SSOProviderCAS    SSOProvider = "CAS"
	SSOProviderOther  SSOProvider = "OTHER"
)

// IsValid validates SSO provider
func (p SSOProvider) IsValid() bool {
	switch p {
	case SSOProviderSAML, SSOProviderOAuth2, SSOProviderOIDC, SSOProviderLDAP, SSOProviderCAS, SSOProviderOther:
		return true
	}
	return false
}

// SSOConfigStatus represents SSO config status
type SSOConfigStatus string

const (
	SSOConfigStatusActive     SSOConfigStatus = "ACTIVE"
	SSOConfigStatusInactive   SSOConfigStatus = "INACTIVE"
	SSOConfigStatusTesting    SSOConfigStatus = "TESTING"
	SSOConfigStatusDeprecated SSOConfigStatus = "DEPRECATED"
)

// IsValid validates SSO config status
func (s SSOConfigStatus) IsValid() bool {
	switch s {
	case SSOConfigStatusActive, SSOConfigStatusInactive, SSOConfigStatusTesting, SSOConfigStatusDeprecated:
		return true
	}
	return false
}

// AttributeMapping maps SSO attributes to user fields
type AttributeMapping struct {
	Email       string `json:"email,omitempty"`
	FirstName   string `json:"first_name,omitempty"`
	LastName    string `json:"last_name,omitempty"`
	DisplayName string `json:"display_name,omitempty"`
	Username    string `json:"username,omitempty"`
	Phone       string `json:"phone,omitempty"`
	EmployeeID  string `json:"employee_id,omitempty"`
	Department  string `json:"department,omitempty"`
	Role        string `json:"role,omitempty"`
}

// Value implements driver.Valuer
func (a AttributeMapping) Value() (driver.Value, error) {
	return json.Marshal(a)
}

// Scan implements sql.Scanner
func (a *AttributeMapping) Scan(value interface{}) error {
	if value == nil {
		*a = AttributeMapping{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal AttributeMapping value")
	}

	return json.Unmarshal(bytes, a)
}

// SSOSettings represents provider-specific SSO settings
type SSOSettings struct {
	// SAML settings
	SignRequests          bool   `json:"sign_requests,omitempty"`
	EncryptAssertions     bool   `json:"encrypt_assertions,omitempty"`
	WantAssertionsSigned  bool   `json:"want_assertions_signed,omitempty"`
	WantResponseSigned    bool   `json:"want_response_signed,omitempty"`
	NameIDFormat          string `json:"name_id_format,omitempty"`

	// OAuth2/OIDC settings
	ResponseType     string `json:"response_type,omitempty"`
	GrantType        string `json:"grant_type,omitempty"`
	TokenAuthMethod  string `json:"token_auth_method,omitempty"`
	PKCEEnabled      bool   `json:"pkce_enabled,omitempty"`
	StateParameter   bool   `json:"state_parameter,omitempty"`
	NonceParameter   bool   `json:"nonce_parameter,omitempty"`

	// LDAP settings
	LDAPHost    string `json:"ldap_host,omitempty"`
	LDAPPort    int    `json:"ldap_port,omitempty"`
	LDAPBaseDN  string `json:"ldap_base_dn,omitempty"`
	LDAPBindDN  string `json:"ldap_bind_dn,omitempty"`
	LDAPFilter  string `json:"ldap_filter,omitempty"`
	LDAPUseSSL  bool   `json:"ldap_use_ssl,omitempty"`

	// General settings
	AutoProvision    bool     `json:"auto_provision,omitempty"`
	UpdateOnLogin    bool     `json:"update_on_login,omitempty"`
	DefaultRole      string   `json:"default_role,omitempty"`
	AllowedDomains   []string `json:"allowed_domains,omitempty"`
}

// Value implements driver.Valuer
func (s SSOSettings) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan implements sql.Scanner
func (s *SSOSettings) Scan(value interface{}) error {
	if value == nil {
		*s = SSOSettings{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to unmarshal SSOSettings value")
	}

	return json.Unmarshal(bytes, s)
}

// TenantSSOConfig represents SSO configuration for a tenant
// Table: tenant_sso_configs
type TenantSSOConfig struct {
	// Identity (2)
	ID       uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID uuid.UUID `gorm:"column:tenant_id;type:uuid;not null;index:idx_tenant_sso_configs_tenant" json:"tenant_id"`

	// Basic Info (4)
	Provider    SSOProvider     `gorm:"column:provider;type:varchar(50);not null" json:"provider"`
	Name        string          `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string         `gorm:"column:description;type:text" json:"description"`
	Status      SSOConfigStatus `gorm:"column:status;type:varchar(20);not null;default:'TESTING'" json:"status"`

	// SAML-specific (5)
	EntityID    *string `gorm:"column:entity_id;type:varchar(500)" json:"entity_id"`
	SSOURL      *string `gorm:"column:sso_url;type:text" json:"sso_url"`
	SLOURL      *string `gorm:"column:slo_url;type:text" json:"slo_url"`
	Certificate *string `gorm:"column:certificate;type:text" json:"certificate"`
	MetadataURL *string `gorm:"column:metadata_url;type:text" json:"metadata_url"`

	// OAuth2/OIDC-specific (6)
	ClientID              *string `gorm:"column:client_id;type:varchar(255)" json:"client_id"`
	ClientSecret          *string `gorm:"column:client_secret;type:text" json:"client_secret"`
	AuthorizationEndpoint *string `gorm:"column:authorization_endpoint;type:text" json:"authorization_endpoint"`
	TokenEndpoint         *string `gorm:"column:token_endpoint;type:text" json:"token_endpoint"`
	UserinfoEndpoint      *string `gorm:"column:userinfo_endpoint;type:text" json:"userinfo_endpoint"`
	JWKSURI               *string `gorm:"column:jwks_uri;type:text" json:"jwks_uri"`

	// Configuration (3)
	Scopes            StringArray      `gorm:"column:scopes;type:text[];not null;default:'[]'" json:"scopes"`
	AttributeMapping  AttributeMapping `gorm:"column:attribute_mapping;type:jsonb;not null;default:'{}'" json:"attribute_mapping"`
	Settings          SSOSettings      `gorm:"column:settings;type:jsonb;not null;default:'{}'" json:"settings"`

	// Audit (7)
	CreatedAt time.Time  `gorm:"column:created_at;type:timestamptz;not null;default:now()" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;type:timestamptz;not null;default:now()" json:"updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at;type:timestamptz" json:"deleted_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by"`
	Version   int64      `gorm:"column:version;type:bigint;not null;default:1" json:"version"`

	// Relationships
	Tenant *Tenant `gorm:"foreignKey:TenantID;references:ID" json:"tenant,omitempty"`
}

// TableName specifies the table name for GORM
func (TenantSSOConfig) TableName() string {
	return "tenant_sso_configs"
}

// BeforeCreate hook
func (tsc *TenantSSOConfig) BeforeCreate(tx *gorm.DB) error {
	if tsc.ID == uuid.Nil {
		tsc.ID = uuid.New()
	}

	// Set defaults
	if tsc.Status == "" {
		tsc.Status = SSOConfigStatusTesting
	}
	if tsc.Scopes == nil {
		tsc.Scopes = []string{}
	}

	return tsc.Validate()
}

// BeforeUpdate hook
func (tsc *TenantSSOConfig) BeforeUpdate(tx *gorm.DB) error {
	tsc.UpdatedAt = time.Now()
	tsc.Version++
	return tsc.Validate()
}

// Validate validates the SSO config
func (tsc *TenantSSOConfig) Validate() error {
	if tsc.Name == "" {
		return errors.New("name is required")
	}

	if !tsc.Provider.IsValid() {
		return errors.New("invalid provider")
	}
	if !tsc.Status.IsValid() {
		return errors.New("invalid status")
	}

	// Validate provider-specific fields
	switch tsc.Provider {
	case SSOProviderSAML:
		if tsc.EntityID == nil || *tsc.EntityID == "" {
			return errors.New("entity_id is required for SAML")
		}
		if tsc.SSOURL == nil || *tsc.SSOURL == "" {
			return errors.New("sso_url is required for SAML")
		}
	case SSOProviderOAuth2, SSOProviderOIDC:
		if tsc.ClientID == nil || *tsc.ClientID == "" {
			return errors.New("client_id is required for OAuth2/OIDC")
		}
		if tsc.ClientSecret == nil || *tsc.ClientSecret == "" {
			return errors.New("client_secret is required for OAuth2/OIDC")
		}
		if tsc.AuthorizationEndpoint == nil || *tsc.AuthorizationEndpoint == "" {
			return errors.New("authorization_endpoint is required for OAuth2/OIDC")
		}
	}

	return nil
}

// IsActive checks if config is active
func (tsc *TenantSSOConfig) IsActive() bool {
	return tsc.Status == SSOConfigStatusActive
}

// IsSAML checks if provider is SAML
func (tsc *TenantSSOConfig) IsSAML() bool {
	return tsc.Provider == SSOProviderSAML
}

// IsOAuth checks if provider is OAuth2/OIDC
func (tsc *TenantSSOConfig) IsOAuth() bool {
	return tsc.Provider == SSOProviderOAuth2 || tsc.Provider == SSOProviderOIDC
}

// IsLDAP checks if provider is LDAP
func (tsc *TenantSSOConfig) IsLDAP() bool {
	return tsc.Provider == SSOProviderLDAP
}

// CreateTenantSSOConfigRequest represents the request to create SSO config
type CreateTenantSSOConfigRequest struct {
	TenantID              uuid.UUID        `json:"tenant_id" binding:"required"`
	Provider              SSOProvider      `json:"provider" binding:"required"`
	Name                  string           `json:"name" binding:"required"`
	Description           *string          `json:"description,omitempty"`
	Status                SSOConfigStatus  `json:"status,omitempty"`
	EntityID              *string          `json:"entity_id,omitempty"`
	SSOURL                *string          `json:"sso_url,omitempty"`
	SLOURL                *string          `json:"slo_url,omitempty"`
	Certificate           *string          `json:"certificate,omitempty"`
	MetadataURL           *string          `json:"metadata_url,omitempty"`
	ClientID              *string          `json:"client_id,omitempty"`
	ClientSecret          *string          `json:"client_secret,omitempty"`
	AuthorizationEndpoint *string          `json:"authorization_endpoint,omitempty"`
	TokenEndpoint         *string          `json:"token_endpoint,omitempty"`
	UserinfoEndpoint      *string          `json:"userinfo_endpoint,omitempty"`
	JWKSURI               *string          `json:"jwks_uri,omitempty"`
	Scopes                []string         `json:"scopes,omitempty"`
	AttributeMapping      AttributeMapping `json:"attribute_mapping,omitempty"`
	Settings              SSOSettings      `json:"settings,omitempty"`
	CreatedBy             *uuid.UUID       `json:"created_by,omitempty"`
}

// UpdateTenantSSOConfigRequest represents the request to update SSO config
type UpdateTenantSSOConfigRequest struct {
	Provider              *SSOProvider     `json:"provider,omitempty"`
	Name                  *string          `json:"name,omitempty"`
	Description           *string          `json:"description,omitempty"`
	Status                *SSOConfigStatus `json:"status,omitempty"`
	EntityID              *string          `json:"entity_id,omitempty"`
	SSOURL                *string          `json:"sso_url,omitempty"`
	SLOURL                *string          `json:"slo_url,omitempty"`
	Certificate           *string          `json:"certificate,omitempty"`
	MetadataURL           *string          `json:"metadata_url,omitempty"`
	ClientID              *string          `json:"client_id,omitempty"`
	ClientSecret          *string          `json:"client_secret,omitempty"`
	AuthorizationEndpoint *string          `json:"authorization_endpoint,omitempty"`
	TokenEndpoint         *string          `json:"token_endpoint,omitempty"`
	UserinfoEndpoint      *string          `json:"userinfo_endpoint,omitempty"`
	JWKSURI               *string          `json:"jwks_uri,omitempty"`
	Scopes                []string         `json:"scopes,omitempty"`
	AttributeMapping      *AttributeMapping `json:"attribute_mapping,omitempty"`
	Settings              *SSOSettings     `json:"settings,omitempty"`
	UpdatedBy             *uuid.UUID       `json:"updated_by,omitempty"`
	Version               int64            `json:"version" binding:"required"`
}

// TenantSSOConfigResponse represents the API response (hides secrets)
type TenantSSOConfigResponse struct {
	ID                    uuid.UUID        `json:"_id"`
	TenantID              uuid.UUID        `json:"tenant_id"`
	Provider              SSOProvider      `json:"provider"`
	Name                  string           `json:"name"`
	Description           *string          `json:"description"`
	Status                SSOConfigStatus  `json:"status"`
	EntityID              *string          `json:"entity_id"`
	SSOURL                *string          `json:"sso_url"`
	SLOURL                *string          `json:"slo_url"`
	Certificate           *string          `json:"certificate"`
	MetadataURL           *string          `json:"metadata_url"`
	ClientID              *string          `json:"client_id"`
	ClientSecret          *string          `json:"client_secret"` // Should be masked
	AuthorizationEndpoint *string          `json:"authorization_endpoint"`
	TokenEndpoint         *string          `json:"token_endpoint"`
	UserinfoEndpoint      *string          `json:"userinfo_endpoint"`
	JWKSURI               *string          `json:"jwks_uri"`
	Scopes                []string         `json:"scopes"`
	AttributeMapping      AttributeMapping `json:"attribute_mapping"`
	Settings              SSOSettings      `json:"settings"`
	CreatedAt             time.Time        `json:"created_at"`
	UpdatedAt             time.Time        `json:"updated_at"`
	DeletedAt             *time.Time       `json:"deleted_at"`
	CreatedBy             *uuid.UUID       `json:"created_by"`
	UpdatedBy             *uuid.UUID       `json:"updated_by"`
	Version               int64            `json:"version"`
}

// ToResponse converts to response (masks client_secret)
func (tsc *TenantSSOConfig) ToResponse() *TenantSSOConfigResponse {
	var maskedSecret *string
	if tsc.ClientSecret != nil && *tsc.ClientSecret != "" {
		masked := "********"
		maskedSecret = &masked
	}

	return &TenantSSOConfigResponse{
		ID:                    tsc.ID,
		TenantID:              tsc.TenantID,
		Provider:              tsc.Provider,
		Name:                  tsc.Name,
		Description:           tsc.Description,
		Status:                tsc.Status,
		EntityID:              tsc.EntityID,
		SSOURL:                tsc.SSOURL,
		SLOURL:                tsc.SLOURL,
		Certificate:           tsc.Certificate,
		MetadataURL:           tsc.MetadataURL,
		ClientID:              tsc.ClientID,
		ClientSecret:          maskedSecret, // Mask secret
		AuthorizationEndpoint: tsc.AuthorizationEndpoint,
		TokenEndpoint:         tsc.TokenEndpoint,
		UserinfoEndpoint:      tsc.UserinfoEndpoint,
		JWKSURI:               tsc.JWKSURI,
		Scopes:                tsc.Scopes,
		AttributeMapping:      tsc.AttributeMapping,
		Settings:              tsc.Settings,
		CreatedAt:             tsc.CreatedAt,
		UpdatedAt:             tsc.UpdatedAt,
		DeletedAt:             tsc.DeletedAt,
		CreatedBy:             tsc.CreatedBy,
		UpdatedBy:             tsc.UpdatedBy,
		Version:               tsc.Version,
	}
}

// SSOConfigStats provides statistics for SSO configs
type SSOConfigStats struct {
	Total        int                          `json:"total"`
	Active       int                          `json:"active"`
	Testing      int                          `json:"testing"`
	ByProvider   map[SSOProvider]int          `json:"by_provider"`
	ByStatus     map[SSOConfigStatus]int      `json:"by_status"`
}

// Query Scopes
func ScopeSSOConfigsByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

func ScopeActiveSSOConfigs(db *gorm.DB) *gorm.DB {
	return db.Where("status = ?", SSOConfigStatusActive)
}

func ScopeSSOConfigsByProvider(provider SSOProvider) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("provider = ?", provider)
	}
}
