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
// APPLICATION - Main Application/App Model
// ============================================================================
// Purpose: Core application entity for multi-tenant SaaS platform
// Table: applications
// Primary Key: _id (UUID)
// Features: OAuth, API Keys, Versioning, Multi-tenant, Soft Delete
// ============================================================================

// ApplicationStatus represents the lifecycle status of an application
type ApplicationStatus string

const (
	ApplicationStatusDraft     ApplicationStatus = "DRAFT"     // Being developed
	ApplicationStatusPublished ApplicationStatus = "PUBLISHED" // Live and available
	ApplicationStatusSuspended ApplicationStatus = "SUSPENDED" // Temporarily disabled
	ApplicationStatusArchived  ApplicationStatus = "ARCHIVED"  // No longer active
)

// ApplicationVisibility controls who can see/use the application
type ApplicationVisibility string

const (
	ApplicationVisibilityPublic   ApplicationVisibility = "PUBLIC"   // Anyone can use
	ApplicationVisibilityPrivate  ApplicationVisibility = "PRIVATE"  // Only owner
	ApplicationVisibilityUnlisted ApplicationVisibility = "UNLISTED" // Only with link
	ApplicationVisibilityInternal ApplicationVisibility = "INTERNAL" // Internal only
)

// ApplicationType categorizes the application
type ApplicationType string

const (
	ApplicationTypeWebApp    ApplicationType = "WEB_APP"    // Web application
	ApplicationTypeMobileApp ApplicationType = "MOBILE_APP" // Mobile app
	ApplicationTypeDesktopApp ApplicationType = "DESKTOP_APP" // Desktop application
	ApplicationTypeAPI       ApplicationType = "API"        // API/Service
	ApplicationTypeIntegration ApplicationType = "INTEGRATION" // Integration/Plugin
	ApplicationTypeBot       ApplicationType = "BOT"        // Bot/Automation
)

// OAuthSettings stores OAuth-related configuration (JSONB)
type OAuthSettings struct {
	ClientID         string   `json:"client_id"`
	ClientSecret     string   `json:"client_secret,omitempty"` // Encrypted in DB
	RedirectURIs     []string `json:"redirect_uris,omitempty"`
	AllowedScopes    []string `json:"allowed_scopes,omitempty"`
	AccessTokenTTL   int      `json:"access_token_ttl"`   // seconds
	RefreshTokenTTL  int      `json:"refresh_token_ttl"`  // seconds
	EnablePKCE       bool     `json:"enable_pkce"`
	EnableRefresh    bool     `json:"enable_refresh"`
	GrantTypes       []string `json:"grant_types,omitempty"` // authorization_code, client_credentials, etc.
}

// Scan implements sql.Scanner for OAuthSettings
func (os *OAuthSettings) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan OAuthSettings")
	}
	return json.Unmarshal(bytes, os)
}

// Value implements driver.Valuer for OAuthSettings
func (os OAuthSettings) Value() (driver.Value, error) {
	return json.Marshal(os)
}

// AppMetadata stores additional app information (JSONB)
type AppMetadata struct {
	IconURL        string   `json:"icon_url,omitempty"`
	CoverImageURL  string   `json:"cover_image_url,omitempty"`
	Screenshots    []string `json:"screenshots,omitempty"`
	WebsiteURL     string   `json:"website_url,omitempty"`
	SupportURL     string   `json:"support_url,omitempty"`
	PrivacyURL     string   `json:"privacy_url,omitempty"`
	TermsURL       string   `json:"terms_url,omitempty"`
	DocumentationURL string `json:"documentation_url,omitempty"`
	Category       string   `json:"category,omitempty"`
	Tags           []string `json:"tags,omitempty"`
	Languages      []string `json:"languages,omitempty"`
}

// Scan implements sql.Scanner for AppMetadata
func (am *AppMetadata) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan AppMetadata")
	}
	return json.Unmarshal(bytes, am)
}

// Value implements driver.Valuer for AppMetadata
func (am AppMetadata) Value() (driver.Value, error) {
	return json.Marshal(am)
}

// StringArray for PostgreSQL text[] type
type StringArray []string

// Scan implements sql.Scanner for StringArray
func (sa *StringArray) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan StringArray")
	}
	str := string(bytes)
	str = strings.Trim(str, "{}")
	if str == "" {
		*sa = []string{}
		return nil
	}
	*sa = strings.Split(str, ",")
	return nil
}

// Value implements driver.Valuer for StringArray
func (sa StringArray) Value() (driver.Value, error) {
	if len(sa) == 0 {
		return "{}", nil
	}
	return "{" + strings.Join(sa, ",") + "}", nil
}

// JSONB type for PostgreSQL jsonb
type JSONB map[string]interface{}

// Scan implements sql.Scanner for JSONB
func (j *JSONB) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan JSONB")
	}
	return json.Unmarshal(bytes, j)
}

// Value implements driver.Valuer for JSONB
func (j JSONB) Value() (driver.Value, error) {
	return json.Marshal(j)
}

// ============================================================================
// Application - Main Model (28 fields)
// ============================================================================

type Application struct {
	// ========== Identity & Relationships (3 fields) ==========
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"` // NULL for platform apps
	OwnerID  uuid.UUID  `gorm:"column:owner_id;type:uuid;not null;index" json:"owner_id"`

	// ========== Basic Information (5 fields) ==========
	Code        string                `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string                `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Slug        string                `gorm:"column:slug;type:varchar(255);uniqueIndex;not null" json:"slug"`
	Description *string               `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        ApplicationType       `gorm:"column:type;type:varchar(50);default:'WEB_APP'" json:"type"`

	// ========== Status & Visibility (3 fields) ==========
	Status     ApplicationStatus     `gorm:"column:status;type:varchar(20);default:'DRAFT';index" json:"status"`
	Visibility ApplicationVisibility `gorm:"column:visibility;type:varchar(20);default:'PRIVATE'" json:"visibility"`
	IsActive   bool                  `gorm:"column:is_active;default:true;index" json:"is_active"`

	// ========== OAuth & Security (2 fields) ==========
	OAuthSettings *OAuthSettings `gorm:"column:oauth_settings;type:jsonb" json:"oauth_settings,omitempty"`
	AllowedOrigins StringArray   `gorm:"column:allowed_origins;type:text[]" json:"allowed_origins,omitempty"`

	// ========== App Information (1 field) ==========
	Metadata *AppMetadata `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Versioning & Publishing (3 fields) ==========
	CurrentVersion   string     `gorm:"column:current_version;type:varchar(50);default:'1.0.0'" json:"current_version"`
	PublishedAt      *time.Time `gorm:"column:published_at" json:"published_at,omitempty"`
	LastDeploymentAt *time.Time `gorm:"column:last_deployment_at" json:"last_deployment_at,omitempty"`

	// ========== Usage Tracking (4 fields) ==========
	InstallCount    int64 `gorm:"column:install_count;default:0" json:"install_count"`
	ActiveUserCount int64 `gorm:"column:active_user_count;default:0" json:"active_user_count"`
	TotalAPIRequests int64 `gorm:"column:total_api_requests;default:0" json:"total_api_requests"`
	TotalRevenue     float64 `gorm:"column:total_revenue;default:0" json:"total_revenue"`

	// ========== Audit Fields (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete & Versioning (3 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"` // Optimistic locking
}

// TableName specifies the table name for Application
func (Application) TableName() string {
	return "applications"
}

// ============================================================================
// GORM Hooks
// ============================================================================

// BeforeCreate hook - Generate slug, validate
func (a *Application) BeforeCreate(tx *gorm.DB) error {
	// Generate UUID if not set
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}

	// Generate slug from name if not set
	if a.Slug == "" {
		a.Slug = generateSlug(a.Name)
	}

	// Validate
	if err := a.Validate(); err != nil {
		return err
	}

	return nil
}

// BeforeUpdate hook - Increment version for optimistic locking
func (a *Application) BeforeUpdate(tx *gorm.DB) error {
	a.Version++

	// Validate
	if err := a.Validate(); err != nil {
		return err
	}

	return nil
}

// BeforeDelete hook - Soft delete
func (a *Application) BeforeDelete(tx *gorm.DB) error {
	now := time.Now()
	a.DeletedAt = &now
	return tx.Save(a).Error
}

// ============================================================================
// Validation
// ============================================================================

func (a *Application) Validate() error {
	// Code validation
	if a.Code == "" {
		return errors.New("application code is required")
	}
	if len(a.Code) > 100 {
		return errors.New("application code must be <= 100 characters")
	}

	// Name validation
	if a.Name == "" {
		return errors.New("application name is required")
	}
	if len(a.Name) > 255 {
		return errors.New("application name must be <= 255 characters")
	}

	// Slug validation
	if a.Slug == "" {
		return errors.New("application slug is required")
	}

	// Status validation
	validStatuses := []ApplicationStatus{
		ApplicationStatusDraft,
		ApplicationStatusPublished,
		ApplicationStatusSuspended,
		ApplicationStatusArchived,
	}
	if !contains(validStatuses, a.Status) {
		return fmt.Errorf("invalid application status: %s", a.Status)
	}

	return nil
}

// ============================================================================
// Helper Methods
// ============================================================================

// IsPublished checks if the application is published
func (a *Application) IsPublished() bool {
	return a.Status == ApplicationStatusPublished && a.IsActive
}

// IsDraft checks if the application is in draft status
func (a *Application) IsDraft() bool {
	return a.Status == ApplicationStatusDraft
}

// IsSuspended checks if the application is suspended
func (a *Application) IsSuspended() bool {
	return a.Status == ApplicationStatusSuspended
}

// IsArchived checks if the application is archived
func (a *Application) IsArchived() bool {
	return a.Status == ApplicationStatusArchived
}

// IsDeleted checks if the application is soft deleted
func (a *Application) IsDeleted() bool {
	return a.DeletedAt != nil
}

// CanBePublished checks if the application can be published
func (a *Application) CanBePublished() bool {
	return a.Status == ApplicationStatusDraft && !a.IsDeleted()
}

// Publish publishes the application
func (a *Application) Publish() error {
	if !a.CanBePublished() {
		return errors.New("application cannot be published")
	}
	now := time.Now()
	a.Status = ApplicationStatusPublished
	a.PublishedAt = &now
	a.IsActive = true
	return nil
}

// Suspend suspends the application
func (a *Application) Suspend() error {
	if !a.IsPublished() {
		return errors.New("only published applications can be suspended")
	}
	a.Status = ApplicationStatusSuspended
	a.IsActive = false
	return nil
}

// Archive archives the application
func (a *Application) Archive() error {
	a.Status = ApplicationStatusArchived
	a.IsActive = false
	return nil
}

// Activate activates the application
func (a *Application) Activate() error {
	if a.IsDeleted() {
		return errors.New("cannot activate deleted application")
	}
	a.IsActive = true
	return nil
}

// Deactivate deactivates the application
func (a *Application) Deactivate() error {
	a.IsActive = false
	return nil
}

// IncrementInstalls increments the install count
func (a *Application) IncrementInstalls(count int64) {
	a.InstallCount += count
}

// IncrementActiveUsers increments the active user count
func (a *Application) IncrementActiveUsers(count int64) {
	a.ActiveUserCount += count
}

// IncrementAPIRequests increments the total API requests
func (a *Application) IncrementAPIRequests(count int64) {
	a.TotalAPIRequests += count
}

// AddRevenue adds revenue to the total
func (a *Application) AddRevenue(amount float64) {
	a.TotalRevenue += amount
}

// SoftDelete performs a soft delete
func (a *Application) SoftDelete(deletedBy uuid.UUID) {
	now := time.Now()
	a.DeletedAt = &now
	a.DeletedBy = &deletedBy
	a.IsActive = false
}

// ============================================================================
// Response DTOs
// ============================================================================

type ApplicationResponse struct {
	ID               uuid.UUID             `json:"_id"`
	TenantID         *uuid.UUID            `json:"tenant_id,omitempty"`
	OwnerID          uuid.UUID             `json:"owner_id"`
	Code             string                `json:"code"`
	Name             string                `json:"name"`
	Slug             string                `json:"slug"`
	Description      *string               `json:"description,omitempty"`
	Type             ApplicationType       `json:"type"`
	Status           ApplicationStatus     `json:"status"`
	Visibility       ApplicationVisibility `json:"visibility"`
	IsActive         bool                  `json:"is_active"`
	Metadata         *AppMetadata          `json:"metadata,omitempty"`
	CurrentVersion   string                `json:"current_version"`
	PublishedAt      *time.Time            `json:"published_at,omitempty"`
	InstallCount     int64                 `json:"install_count"`
	ActiveUserCount  int64                 `json:"active_user_count"`
	TotalAPIRequests int64                 `json:"total_api_requests"`
	CreatedAt        time.Time             `json:"created_at"`
	UpdatedAt        time.Time             `json:"updated_at"`
	Version          int64                 `json:"version"`
}

// ToResponse converts Application to ApplicationResponse (without sensitive data)
func (a *Application) ToResponse() *ApplicationResponse {
	return &ApplicationResponse{
		ID:               a.ID,
		TenantID:         a.TenantID,
		OwnerID:          a.OwnerID,
		Code:             a.Code,
		Name:             a.Name,
		Slug:             a.Slug,
		Description:      a.Description,
		Type:             a.Type,
		Status:           a.Status,
		Visibility:       a.Visibility,
		IsActive:         a.IsActive,
		Metadata:         a.Metadata,
		CurrentVersion:   a.CurrentVersion,
		PublishedAt:      a.PublishedAt,
		InstallCount:     a.InstallCount,
		ActiveUserCount:  a.ActiveUserCount,
		TotalAPIRequests: a.TotalAPIRequests,
		CreatedAt:        a.CreatedAt,
		UpdatedAt:        a.UpdatedAt,
		Version:          a.Version,
	}
}

// ============================================================================
// Request DTOs
// ============================================================================

type CreateApplicationRequest struct {
	TenantID    *uuid.UUID            `json:"tenant_id,omitempty"`
	Code        string                `json:"code" validate:"required,max=100"`
	Name        string                `json:"name" validate:"required,max=255"`
	Description *string               `json:"description,omitempty"`
	Type        ApplicationType       `json:"type"`
	Visibility  ApplicationVisibility `json:"visibility"`
	Metadata    *AppMetadata          `json:"metadata,omitempty"`
}

type UpdateApplicationRequest struct {
	Name        *string               `json:"name,omitempty" validate:"omitempty,max=255"`
	Description *string               `json:"description,omitempty"`
	Type        *ApplicationType      `json:"type,omitempty"`
	Visibility  *ApplicationVisibility `json:"visibility,omitempty"`
	Metadata    *AppMetadata          `json:"metadata,omitempty"`
	IsActive    *bool                 `json:"is_active,omitempty"`
}

// ============================================================================
// Query Scopes
// ============================================================================

// ScopeActive returns only active applications
func ScopeActive(db *gorm.DB) *gorm.DB {
	return db.Where("is_active = ?", true)
}

// ScopeNotDeleted returns only non-deleted applications
func ScopeNotDeleted(db *gorm.DB) *gorm.DB {
	return db.Where("deleted_at IS NULL")
}

// ScopePublished returns only published applications
func ScopePublished(db *gorm.DB) *gorm.DB {
	return db.Where("status = ?", ApplicationStatusPublished)
}

// ScopeByStatus returns applications by status
func ScopeByStatus(status ApplicationStatus) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("status = ?", status)
	}
}

// ScopeByVisibility returns applications by visibility
func ScopeByVisibility(visibility ApplicationVisibility) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("visibility = ?", visibility)
	}
}

// ScopeByType returns applications by type
func ScopeByType(appType ApplicationType) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("type = ?", appType)
	}
}

// ScopeByOwner returns applications by owner
func ScopeByOwner(ownerID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("owner_id = ?", ownerID)
	}
}

// ScopeByTenant returns applications by tenant
func ScopeByTenant(tenantID uuid.UUID) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		return db.Where("tenant_id = ?", tenantID)
	}
}

// ScopeSearch searches applications by name or code
func ScopeSearch(query string) func(*gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		searchPattern := "%" + query + "%"
		return db.Where("name ILIKE ? OR code ILIKE ?", searchPattern, searchPattern)
	}
}

// ============================================================================
// Utility Functions
// ============================================================================

func generateSlug(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	// Remove special characters
	slug = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, slug)
	return slug
}

func contains[T comparable](slice []T, item T) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}
