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
// TERMS OF SERVICE - Terms and Policies
// ============================================================================
// Purpose: Manage terms of service and privacy policies
// Table: terms_of_services
// Primary Key: _id (UUID)
// Features: Versioning, Multi-language, User acceptance
// ============================================================================

type TermsType string

const (
	TermsTypeToS          TermsType = "TERMS_OF_SERVICE"
	TermsTypePrivacy      TermsType = "PRIVACY_POLICY"
	TermsTypeCookie       TermsType = "COOKIE_POLICY"
	TermsTypeAcceptable   TermsType = "ACCEPTABLE_USE"
	TermsTypeSLA          TermsType = "SERVICE_LEVEL"
	TermsTypeDataProcessing TermsType = "DATA_PROCESSING"
	TermsTypeEULA         TermsType = "END_USER_LICENSE"
)

type TermsStatus string

const (
	TermsStatusDraft     TermsStatus = "DRAFT"
	TermsStatusReview    TermsStatus = "REVIEW"
	TermsStatusActive    TermsStatus = "ACTIVE"
	TermsStatusArchived  TermsStatus = "ARCHIVED"
	TermsStatusSuperseded TermsStatus = "SUPERSEDED"
)

type TermsScope string

const (
	TermsScopeGlobal  TermsScope = "GLOBAL"
	TermsScopeTenant  TermsScope = "TENANT"
	TermsScopeProduct TermsScope = "PRODUCT"
	TermsScopeService TermsScope = "SERVICE"
	TermsScopeRegion  TermsScope = "REGION"
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
// TermsOfService Model (32 fields)
// ============================================================================

type TermsOfService struct {
	// ========== Identity (4 fields) ==========
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	ParentID *uuid.UUID `gorm:"column:parent_id;type:uuid;index" json:"parent_id,omitempty"` // Previous version
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`

	// ========== Terms Info (9 fields) ==========
	Code        string      `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Type        TermsType   `gorm:"column:type;type:varchar(30);not null;index" json:"type"`
	Status      TermsStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Scope       TermsScope  `gorm:"column:scope;type:varchar(20);not null" json:"scope"`
	Title       string      `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Subtitle    *string     `gorm:"column:subtitle;type:varchar(255)" json:"subtitle,omitempty"`
	Description *string     `gorm:"column:description;type:text" json:"description,omitempty"`
	Language    string      `gorm:"column:language;type:varchar(10);not null;default:'en'" json:"language"`
	Region      *string     `gorm:"column:region;type:varchar(10)" json:"region,omitempty"` // US, EU, etc

	// ========== Version (4 fields) ==========
	Version       string     `gorm:"column:version;type:varchar(50);not null;index" json:"version"`
	VersionNumber int        `gorm:"column:version_number;not null;default:1" json:"version_number"`
	IsLatest      bool       `gorm:"column:is_latest;default:false;index" json:"is_latest"`
	IsMajorUpdate bool       `gorm:"column:is_major_update;default:false" json:"is_major_update"`

	// ========== Content (3 fields) ==========
	Content     string `gorm:"column:content;type:text;not null" json:"content"` // HTML/Markdown
	ContentType string `gorm:"column:content_type;type:varchar(20);default:'html'" json:"content_type"`
	Summary     *string `gorm:"column:summary;type:text" json:"summary,omitempty"`

	// ========== Effective Dates (3 fields) ==========
	EffectiveDate time.Time  `gorm:"column:effective_date;not null;index" json:"effective_date"`
	ExpiryDate    *time.Time `gorm:"column:expiry_date;index" json:"expiry_date,omitempty"`
	NoticeDate    *time.Time `gorm:"column:notice_date" json:"notice_date,omitempty"` // When users were notified

	// ========== Acceptance (3 fields) ==========
	RequiresAcceptance bool `gorm:"column:requires_acceptance;default:true" json:"requires_acceptance"`
	AcceptanceCount    int64 `gorm:"column:acceptance_count;default:0" json:"acceptance_count"`
	RejectionCount     int64 `gorm:"column:rejection_count;default:0" json:"rejection_count"`

	// ========== Configuration (2 fields) ==========
	IsMandatory     bool  `gorm:"column:is_mandatory;default:true" json:"is_mandatory"`
	ShowOnSignup    bool  `gorm:"column:show_on_signup;default:true" json:"show_on_signup"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Parent   *TermsOfService   `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Category *TermsCategory    `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Sections []TermsSection    `gorm:"foreignKey:TermsID" json:"sections,omitempty"`
	Acceptances []TermsAcceptance `gorm:"foreignKey:TermsID" json:"acceptances,omitempty"`
}

func (TermsOfService) TableName() string {
	return "terms_of_services"
}

func (t *TermsOfService) IsActive() bool {
	now := time.Now()
	
	if t.Status != TermsStatusActive {
		return false
	}
	
	if now.Before(t.EffectiveDate) {
		return false
	}
	
	if t.ExpiryDate != nil && now.After(*t.ExpiryDate) {
		return false
	}
	
	return true
}

func (t *TermsOfService) IsEffective() bool {
	return time.Now().After(t.EffectiveDate)
}

func (t *TermsOfService) GetAcceptanceRate() float64 {
	total := t.AcceptanceCount + t.RejectionCount
	if total == 0 {
		return 0
	}
	return (float64(t.AcceptanceCount) / float64(total)) * 100
}

// ============================================================================
// TERMS SECTION - Sections within Terms
// ============================================================================

type SectionType string

const (
	SectionTypeIntroduction SectionType = "INTRODUCTION"
	SectionTypeDefinitions  SectionType = "DEFINITIONS"
	SectionTypeRights       SectionType = "RIGHTS"
	SectionTypeObligations  SectionType = "OBLIGATIONS"
	SectionTypePrivacy      SectionType = "PRIVACY"
	SectionTypePayment      SectionType = "PAYMENT"
	SectionTypeLiability    SectionType = "LIABILITY"
	SectionTypeTermination  SectionType = "TERMINATION"
	SectionTypeDispute      SectionType = "DISPUTE"
	SectionTypeMiscellaneous SectionType = "MISCELLANEOUS"
)

type TermsSection struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TermsID uuid.UUID `gorm:"column:terms_id;type:uuid;not null;index" json:"terms_id"`

	// Section Info (7 fields)
	Type        SectionType `gorm:"column:type;type:varchar(30);not null" json:"type"`
	Number      string      `gorm:"column:number;type:varchar(20);not null" json:"number"` // 1, 1.1, 1.1.1
	Title       string      `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Content     string      `gorm:"column:content;type:text;not null" json:"content"`
	ContentType string      `gorm:"column:content_type;type:varchar(20);default:'html'" json:"content_type"`
	SortOrder   int         `gorm:"column:sort_order;not null;default:0" json:"sort_order"`
	IsRequired  bool        `gorm:"column:is_required;default:false" json:"is_required"`

	// Hierarchy (1 field)
	ParentSectionID *uuid.UUID `gorm:"column:parent_section_id;type:uuid" json:"parent_section_id,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Terms         *TermsOfService `gorm:"foreignKey:TermsID" json:"terms,omitempty"`
	ParentSection *TermsSection   `gorm:"foreignKey:ParentSectionID" json:"parent_section,omitempty"`
	SubSections   []TermsSection  `gorm:"foreignKey:ParentSectionID" json:"sub_sections,omitempty"`
}

func (TermsSection) TableName() string {
	return "terms_sections"
}

// ============================================================================
// TERMS CATEGORY - Categories
// ============================================================================

type TermsCategory struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Category Info (7 fields)
	Code        string  `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string  `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string `gorm:"column:description;type:text" json:"description,omitempty"`
	Icon        *string `gorm:"column:icon;type:varchar(100)" json:"icon,omitempty"`
	Color       *string `gorm:"column:color;type:varchar(20)" json:"color,omitempty"`
	SortOrder   int     `gorm:"column:sort_order;default:0" json:"sort_order"`
	IsActive    bool    `gorm:"column:is_active;default:true" json:"is_active"`

	// Statistics (2 fields)
	TermsCount int64      `gorm:"column:terms_count;default:0" json:"terms_count"`
	LastUsedAt *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Terms []TermsOfService `gorm:"foreignKey:CategoryID" json:"terms,omitempty"`
}

func (TermsCategory) TableName() string {
	return "terms_categories"
}

// ============================================================================
// PRIVACY POLICY - Privacy Policy (extends TermsOfService)
// ============================================================================

type DataProcessingType string

const (
	DataProcessingCollection DataProcessingType = "COLLECTION"
	DataProcessingStorage    DataProcessingType = "STORAGE"
	DataProcessingUsage      DataProcessingType = "USAGE"
	DataProcessingSharing    DataProcessingType = "SHARING"
	DataProcessingRetention  DataProcessingType = "RETENTION"
	DataProcessingDeletion   DataProcessingType = "DELETION"
)

type PrivacyPolicy struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TermsID uuid.UUID `gorm:"column:terms_id;type:uuid;not null;uniqueIndex" json:"terms_id"`

	// Data Collection (4 fields)
	CollectsPersonalData     bool   `gorm:"column:collects_personal_data;default:true" json:"collects_personal_data"`
	CollectsSensitiveData    bool   `gorm:"column:collects_sensitive_data;default:false" json:"collects_sensitive_data"`
	DataTypes                JSONB  `gorm:"column:data_types;type:jsonb" json:"data_types,omitempty"`
	CollectionPurpose        string `gorm:"column:collection_purpose;type:text;not null" json:"collection_purpose"`

	// Data Usage (3 fields)
	UsagePurpose        string `gorm:"column:usage_purpose;type:text;not null" json:"usage_purpose"`
	SharesWithThirdParty bool  `gorm:"column:shares_with_third_party;default:false" json:"shares_with_third_party"`
	ThirdParties         JSONB `gorm:"column:third_parties;type:jsonb" json:"third_parties,omitempty"`

	// Data Rights (5 fields)
	AllowsDataAccess     bool `gorm:"column:allows_data_access;default:true" json:"allows_data_access"`
	AllowsDataCorrection bool `gorm:"column:allows_data_correction;default:true" json:"allows_data_correction"`
	AllowsDataDeletion   bool `gorm:"column:allows_data_deletion;default:true" json:"allows_data_deletion"`
	AllowsDataPortability bool `gorm:"column:allows_data_portability;default:true" json:"allows_data_portability"`
	AllowsDataOptOut     bool `gorm:"column:allows_data_opt_out;default:true" json:"allows_data_opt_out"`

	// Data Security (3 fields)
	SecurityMeasures    string `gorm:"column:security_measures;type:text;not null" json:"security_measures"`
	EncryptionUsed      bool   `gorm:"column:encryption_used;default:true" json:"encryption_used"`
	DataBreachNotification bool `gorm:"column:data_breach_notification;default:true" json:"data_breach_notification"`

	// Data Retention (2 fields)
	RetentionPeriod    *string `gorm:"column:retention_period;type:varchar(100)" json:"retention_period,omitempty"`
	RetentionPolicy    *string `gorm:"column:retention_policy;type:text" json:"retention_policy,omitempty"`

	// Compliance (3 fields)
	GDPRCompliant  bool `gorm:"column:gdpr_compliant;default:false" json:"gdpr_compliant"`
	CCPACompliant  bool `gorm:"column:ccpa_compliant;default:false" json:"ccpa_compliant"`
	COPPACompliant bool `gorm:"column:coppa_compliant;default:false" json:"coppa_compliant"`

	// Contact (2 fields)
	DataProtectionOfficer *string `gorm:"column:data_protection_officer;type:varchar(255)" json:"data_protection_officer,omitempty"`
	ContactEmail          *string `gorm:"column:contact_email;type:varchar(255)" json:"contact_email,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Terms *TermsOfService `gorm:"foreignKey:TermsID" json:"terms,omitempty"`
}

func (PrivacyPolicy) TableName() string {
	return "privacy_policies"
}

func (p *PrivacyPolicy) IsCompliant(standard string) bool {
	switch standard {
	case "GDPR":
		return p.GDPRCompliant
	case "CCPA":
		return p.CCPACompliant
	case "COPPA":
		return p.COPPACompliant
	default:
		return false
	}
}

// ============================================================================
// COOKIE POLICY - Cookie Policy
// ============================================================================

type CookieType string

const (
	CookieTypeEssential   CookieType = "ESSENTIAL"
	CookieTypeFunctional  CookieType = "FUNCTIONAL"
	CookieTypeAnalytics   CookieType = "ANALYTICS"
	CookieTypeMarketing   CookieType = "MARKETING"
	CookieTypePerformance CookieType = "PERFORMANCE"
	CookieTypeThirdParty  CookieType = "THIRD_PARTY"
)

type CookiePolicy struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TermsID uuid.UUID `gorm:"column:terms_id;type:uuid;not null;uniqueIndex" json:"terms_id"`

	// Cookie Usage (4 fields)
	UsesCookies       bool   `gorm:"column:uses_cookies;default:true" json:"uses_cookies"`
	CookiePurpose     string `gorm:"column:cookie_purpose;type:text;not null" json:"cookie_purpose"`
	CookieTypes       JSONB  `gorm:"column:cookie_types;type:jsonb" json:"cookie_types,omitempty"`
	ThirdPartyCookies JSONB  `gorm:"column:third_party_cookies;type:jsonb" json:"third_party_cookies,omitempty"`

	// User Control (3 fields)
	AllowsCookieControl   bool `gorm:"column:allows_cookie_control;default:true" json:"allows_cookie_control"`
	RequiresCookieConsent bool `gorm:"column:requires_cookie_consent;default:true" json:"requires_cookie_consent"`
	ShowCookieBanner      bool `gorm:"column:show_cookie_banner;default:true" json:"show_cookie_banner"`

	// Cookie Details (2 fields)
	CookieDuration *string `gorm:"column:cookie_duration;type:varchar(100)" json:"cookie_duration,omitempty"`
	CookieList     JSONB   `gorm:"column:cookie_list;type:jsonb" json:"cookie_list,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Terms *TermsOfService `gorm:"foreignKey:TermsID" json:"terms,omitempty"`
}

func (CookiePolicy) TableName() string {
	return "cookie_policies"
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateTerms creates new terms of service
func CreateTerms(
	db *gorm.DB,
	terms *TermsOfService,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		terms.CreatedBy = userID
		terms.Status = TermsStatusDraft
		terms.VersionNumber = 1
		terms.Version = "1.0"
		terms.IsLatest = true

		return tx.Create(terms).Error
	})
}

// PublishTerms publishes draft terms
func PublishTerms(
	db *gorm.DB,
	termsID uuid.UUID,
	effectiveDate time.Time,
	userID *uuid.UUID,
) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var terms TermsOfService
		if err := tx.First(&terms, termsID).Error; err != nil {
			return err
		}

		if terms.Status != TermsStatusDraft {
			return fmt.Errorf("terms must be in draft status")
		}

		terms.Status = TermsStatusActive
		terms.EffectiveDate = effectiveDate
		terms.UpdatedBy = userID

		return tx.Save(&terms).Error
	})
}

// CreateNewVersion creates a new version of terms
func CreateNewVersion(
	db *gorm.DB,
	currentTermsID uuid.UUID,
	isMajorUpdate bool,
	userID *uuid.UUID,
) (*TermsOfService, error) {
	var newTerms *TermsOfService

	err := db.Transaction(func(tx *gorm.DB) error {
		// Get current terms
		var currentTerms TermsOfService
		if err := tx.Preload("Sections").First(&currentTerms, currentTermsID).Error; err != nil {
			return err
		}

		// Mark current as no longer latest
		currentTerms.IsLatest = false
		tx.Save(&currentTerms)

		// Create new version
		newTerms = &TermsOfService{
			TenantID:      currentTerms.TenantID,
			ParentID:      &currentTerms.ID,
			CategoryID:    currentTerms.CategoryID,
			Code:          currentTerms.Code,
			Type:          currentTerms.Type,
			Status:        TermsStatusDraft,
			Scope:         currentTerms.Scope,
			Title:         currentTerms.Title,
			Subtitle:      currentTerms.Subtitle,
			Description:   currentTerms.Description,
			Language:      currentTerms.Language,
			Region:        currentTerms.Region,
			VersionNumber: currentTerms.VersionNumber + 1,
			IsLatest:      true,
			IsMajorUpdate: isMajorUpdate,
			Content:       currentTerms.Content,
			ContentType:   currentTerms.ContentType,
			Summary:       currentTerms.Summary,
			RequiresAcceptance: currentTerms.RequiresAcceptance,
			IsMandatory:   currentTerms.IsMandatory,
			ShowOnSignup:  currentTerms.ShowOnSignup,
			CreatedBy:     userID,
		}

		// Set version string
		if isMajorUpdate {
			newTerms.Version = fmt.Sprintf("%d.0", newTerms.VersionNumber)
		} else {
			newTerms.Version = fmt.Sprintf("%d.%d", currentTerms.VersionNumber, 1)
		}

		if err := tx.Create(newTerms).Error; err != nil {
			return err
		}

		// Copy sections
		for _, section := range currentTerms.Sections {
			newSection := TermsSection{
				TermsID:     newTerms.ID,
				Type:        section.Type,
				Number:      section.Number,
				Title:       section.Title,
				Content:     section.Content,
				ContentType: section.ContentType,
				SortOrder:   section.SortOrder,
				IsRequired:  section.IsRequired,
			}
			tx.Create(&newSection)
		}

		return nil
	})

	return newTerms, err
}

// GetActiveTerms gets active terms by type
func GetActiveTerms(
	db *gorm.DB,
	termsType TermsType,
	language string,
) (*TermsOfService, error) {
	var terms TermsOfService

	err := db.Where("type = ? AND status = ? AND language = ? AND is_latest = ?", 
		termsType, TermsStatusActive, language, true).
		Preload("Sections", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&terms).Error

	return &terms, err
}

// GetLatestTerms gets latest terms regardless of status
func GetLatestTerms(
	db *gorm.DB,
	termsType TermsType,
	language string,
) (*TermsOfService, error) {
	var terms TermsOfService

	err := db.Where("type = ? AND language = ? AND is_latest = ?", 
		termsType, language, true).
		Preload("Sections", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&terms).Error

	return &terms, err
}

// GetTermsVersion gets specific version of terms
func GetTermsVersion(
	db *gorm.DB,
	code string,
	version string,
) (*TermsOfService, error) {
	var terms TermsOfService

	err := db.Where("code = ? AND version = ?", code, version).
		Preload("Sections", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		First(&terms).Error

	return &terms, err
}

// GetTermsHistory gets version history
func GetTermsHistory(
	db *gorm.DB,
	code string,
) ([]TermsOfService, error) {
	var history []TermsOfService

	err := db.Where("code = ?", code).
		Order("version_number DESC").
		Find(&history).Error

	return history, err
}

// AddSection adds a section to terms
func AddSection(
	db *gorm.DB,
	termsID uuid.UUID,
	section *TermsSection,
) error {
	section.TermsID = termsID
	return db.Create(section).Error
}

// ArchiveTerms archives old terms
func ArchiveTerms(db *gorm.DB, termsID uuid.UUID) error {
	return db.Model(&TermsOfService{}).
		Where("_id = ?", termsID).
		Update("status", TermsStatusArchived).Error
}

// SupersedeTerms marks terms as superseded by new version
func SupersedeTerms(db *gorm.DB, oldTermsID, newTermsID uuid.UUID) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Mark old as superseded
		tx.Model(&TermsOfService{}).
			Where("_id = ?", oldTermsID).
			Updates(map[string]interface{}{
				"status":    TermsStatusSuperseded,
				"is_latest": false,
			})

		// Update new terms parent
		tx.Model(&TermsOfService{}).
			Where("_id = ?", newTermsID).
			Update("parent_id", oldTermsID)

		return nil
	})
}

func strPtr(s string) *string {
	return &s
}

func timePtr(t time.Time) *time.Time {
	return &t
}
