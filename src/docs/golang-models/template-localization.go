package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// TEMPLATE TRANSLATION - Multi-language Translations
// ============================================================================
// Purpose: Manage template translations for i18n
// Table: template_translations
// Primary Key: _id (UUID)
// Features: Multi-language, Fallback, Regional variants
// ============================================================================

type TranslationStatus string

const (
	TranslationStatusDraft      TranslationStatus = "DRAFT"
	TranslationStatusReview     TranslationStatus = "REVIEW"
	TranslationStatusApproved   TranslationStatus = "APPROVED"
	TranslationStatusPublished  TranslationStatus = "PUBLISHED"
	TranslationStatusDeprecated TranslationStatus = "DEPRECATED"
)

type TemplateTranslation struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TemplateID uuid.UUID `gorm:"column:template_id;type:uuid;not null;index" json:"template_id"`

	// Language Info (5 fields)
	LanguageCode string            `gorm:"column:language_code;type:varchar(10);not null;index" json:"language_code"` // en, vi, fr
	LocaleCode   string            `gorm:"column:locale_code;type:varchar(10);not null;index" json:"locale_code"` // en-US, vi-VN
	CountryCode  *string           `gorm:"column:country_code;type:varchar(5)" json:"country_code,omitempty"` // US, VN
	Status       TranslationStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	IsDefault    bool              `gorm:"column:is_default;default:false" json:"is_default"`

	// Content (5 fields)
	Subject      *string `gorm:"column:subject;type:text" json:"subject,omitempty"`
	Body         string  `gorm:"column:body;type:text;not null" json:"body"`
	HTMLBody     *string `gorm:"column:html_body;type:text" json:"html_body,omitempty"`
	PreviewText  *string `gorm:"column:preview_text;type:varchar(255)" json:"preview_text,omitempty"`
	PlainText    *string `gorm:"column:plain_text;type:text" json:"plain_text,omitempty"`

	// Variables (2 fields)
	Variables     JSONB `gorm:"column:variables;type:jsonb" json:"variables,omitempty"`
	TranslatedVars JSONB `gorm:"column:translated_vars;type:jsonb" json:"translated_vars,omitempty"` // Variable labels

	// Translation Info (4 fields)
	TranslatedBy     *uuid.UUID `gorm:"column:translated_by;type:uuid" json:"translated_by,omitempty"`
	TranslatedAt     *time.Time `gorm:"column:translated_at" json:"translated_at,omitempty"`
	ReviewedBy       *uuid.UUID `gorm:"column:reviewed_by;type:uuid" json:"reviewed_by,omitempty"`
	ReviewedAt       *time.Time `gorm:"column:reviewed_at" json:"reviewed_at,omitempty"`

	// Quality (2 fields)
	Quality         *string `gorm:"column:quality;type:varchar(20)" json:"quality,omitempty"` // AUTO, MANUAL, PROFESSIONAL
	TranslationNotes *string `gorm:"column:translation_notes;type:text" json:"translation_notes,omitempty"`

	// Statistics (2 fields)
	UsageCount int64      `gorm:"column:usage_count;default:0" json:"usage_count"`
	LastUsedAt *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Template *Template `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
}

func (TemplateTranslation) TableName() string {
	return "template_translations"
}

func (t *TemplateTranslation) IsPublished() bool {
	return t.Status == TranslationStatusPublished
}

func (t *TemplateTranslation) Render(data map[string]interface{}) string {
	result := t.Body
	for key, value := range data {
		placeholder := fmt.Sprintf("{{%s}}", key)
		result = fmt.Sprintf(result, placeholder, fmt.Sprintf("%v", value))
	}
	return result
}

// ============================================================================
// TEMPLATE LOCALE - Locale/Regional Settings
// ============================================================================

type TemplateLocale struct {
	// Identity (2 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Locale Info (7 fields)
	LocaleCode   string  `gorm:"column:locale_code;type:varchar(10);uniqueIndex;not null" json:"locale_code"` // en-US
	LanguageCode string  `gorm:"column:language_code;type:varchar(10);not null" json:"language_code"` // en
	CountryCode  string  `gorm:"column:country_code;type:varchar(5);not null" json:"country_code"` // US
	Name         string  `gorm:"column:name;type:varchar(255);not null" json:"name"` // English (United States)
	NativeName   string  `gorm:"column:native_name;type:varchar(255);not null" json:"native_name"`
	IsActive     bool    `gorm:"column:is_active;default:true" json:"is_active"`
	IsDefault    bool    `gorm:"column:is_default;default:false" json:"is_default"`

	// Formatting (5 fields)
	DateFormat     string  `gorm:"column:date_format;type:varchar(50);default:'MM/DD/YYYY'" json:"date_format"`
	TimeFormat     string  `gorm:"column:time_format;type:varchar(50);default:'hh:mm A'" json:"time_format"`
	NumberFormat   string  `gorm:"column:number_format;type:varchar(50);default:'1,234.56'" json:"number_format"`
	CurrencyFormat string  `gorm:"column:currency_format;type:varchar(50);default:'$1,234.56'" json:"currency_format"`
	Timezone       *string `gorm:"column:timezone;type:varchar(50)" json:"timezone,omitempty"`

	// Regional Settings (3 fields)
	Direction       string `gorm:"column:direction;type:varchar(5);default:'LTR'" json:"direction"` // LTR or RTL
	FirstDayOfWeek  int    `gorm:"column:first_day_of_week;default:0" json:"first_day_of_week"` // 0=Sunday, 1=Monday
	DecimalSeparator string `gorm:"column:decimal_separator;type:varchar(5);default:'.'" json:"decimal_separator"`

	// Statistics (1 field)
	UsageCount int64 `gorm:"column:usage_count;default:0" json:"usage_count"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
}

func (TemplateLocale) TableName() string {
	return "template_locales"
}

func (l *TemplateLocale) IsRTL() bool {
	return l.Direction == "RTL"
}

// ============================================================================
// TEMPLATE REGION - Regional Templates
// ============================================================================

type TemplateRegion struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TemplateID uuid.UUID `gorm:"column:template_id;type:uuid;not null;index" json:"template_id"`

	// Region Info (4 fields)
	RegionCode  string `gorm:"column:region_code;type:varchar(10);not null;index" json:"region_code"` // US, EU, APAC
	RegionName  string `gorm:"column:region_name;type:varchar(255);not null" json:"region_name"`
	CountryCodes JSONB `gorm:"column:country_codes;type:jsonb" json:"country_codes,omitempty"` // ["US", "CA", "MX"]
	IsActive    bool   `gorm:"column:is_active;default:true" json:"is_active"`

	// Content Overrides (4 fields)
	Subject     *string `gorm:"column:subject;type:text" json:"subject,omitempty"`
	Body        *string `gorm:"column:body;type:text" json:"body,omitempty"`
	HTMLBody    *string `gorm:"column:html_body;type:text" json:"html_body,omitempty"`
	PreviewText *string `gorm:"column:preview_text;type:varchar(255)" json:"preview_text,omitempty"`

	// Regional Settings (2 fields)
	Settings JSONB  `gorm:"column:settings;type:jsonb" json:"settings,omitempty"`
	Priority int    `gorm:"column:priority;default:0" json:"priority"` // Higher priority wins

	// Statistics (2 fields)
	UsageCount int64      `gorm:"column:usage_count;default:0" json:"usage_count"`
	LastUsedAt *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Template *Template `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
}

func (TemplateRegion) TableName() string {
	return "template_regions"
}

func (r *TemplateRegion) MatchesCountry(countryCode string) bool {
	if r.CountryCodes == nil {
		return false
	}

	countries, ok := r.CountryCodes["countries"].([]interface{})
	if !ok {
		return false
	}

	for _, c := range countries {
		if code, ok := c.(string); ok && code == countryCode {
			return true
		}
	}

	return false
}

// ============================================================================
// LANGUAGE - Supported Languages
// ============================================================================

type Language struct {
	// Identity (1 field)
	ID uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`

	// Language Info (7 fields)
	Code       string  `gorm:"column:code;type:varchar(10);uniqueIndex;not null" json:"code"` // en, vi, fr
	Name       string  `gorm:"column:name;type:varchar(255);not null" json:"name"` // English
	NativeName string  `gorm:"column:native_name;type:varchar(255);not null" json:"native_name"` // English
	Icon       *string `gorm:"column:icon;type:varchar(100)" json:"icon,omitempty"`
	FlagIcon   *string `gorm:"column:flag_icon;type:varchar(100)" json:"flag_icon,omitempty"`
	Direction  string  `gorm:"column:direction;type:varchar(5);default:'LTR'" json:"direction"`
	IsActive   bool    `gorm:"column:is_active;default:true" json:"is_active"`

	// Statistics (2 fields)
	TemplateCount int64      `gorm:"column:template_count;default:0" json:"template_count"`
	LastUsedAt    *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
}

func (Language) TableName() string {
	return "languages"
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateTranslation creates a translation for a template
func CreateTranslation(
	db *gorm.DB,
	translation *TemplateTranslation,
	userID *uuid.UUID,
) error {
	translation.CreatedBy = userID
	translation.Status = TranslationStatusDraft

	return db.Create(translation).Error
}

// GetTranslation gets translation for a template and locale
func GetTranslation(
	db *gorm.DB,
	templateID uuid.UUID,
	localeCode string,
) (*TemplateTranslation, error) {
	var translation TemplateTranslation

	// Try exact locale match (e.g., en-US)
	err := db.Where(
		"template_id = ? AND locale_code = ? AND status = ?",
		templateID, localeCode, TranslationStatusPublished,
	).First(&translation).Error

	if err == gorm.ErrRecordNotFound {
		// Try language fallback (e.g., en)
		languageCode := localeCode
		if len(localeCode) > 2 {
			languageCode = localeCode[:2]
		}

		err = db.Where(
			"template_id = ? AND language_code = ? AND status = ?",
			templateID, languageCode, TranslationStatusPublished,
		).First(&translation).Error
	}

	if err == gorm.ErrRecordNotFound {
		// Try default translation
		err = db.Where(
			"template_id = ? AND is_default = ? AND status = ?",
			templateID, true, TranslationStatusPublished,
		).First(&translation).Error
	}

	return &translation, err
}

// GetTemplateWithTranslation gets template with translation
func GetTemplateWithTranslation(
	db *gorm.DB,
	templateCode string,
	localeCode string,
) (*Template, *TemplateTranslation, error) {
	// Get template
	template, err := GetTemplateByCode(db, templateCode)
	if err != nil {
		return nil, nil, err
	}

	// Get translation
	translation, err := GetTranslation(db, template.ID, localeCode)
	if err != nil {
		// Use original template if no translation
		return template, nil, nil
	}

	return template, translation, nil
}

// PublishTranslation publishes a translation
func PublishTranslation(
	db *gorm.DB,
	translationID uuid.UUID,
	userID *uuid.UUID,
) error {
	var translation TemplateTranslation
	if err := db.First(&translation, translationID).Error; err != nil {
		return err
	}

	translation.Status = TranslationStatusPublished
	translation.UpdatedBy = userID

	return db.Save(&translation).Error
}

// GetMissingTranslations gets templates missing translations for a locale
func GetMissingTranslations(
	db *gorm.DB,
	localeCode string,
) ([]Template, error) {
	var templates []Template

	// Get all active templates
	err := db.Where("status = ?", TemplateStatusActive).Find(&templates).Error
	if err != nil {
		return nil, err
	}

	// Filter templates without translation
	missingTranslations := []Template{}
	for _, template := range templates {
		var count int64
		db.Model(&TemplateTranslation{}).
			Where("template_id = ? AND locale_code = ?", template.ID, localeCode).
			Count(&count)

		if count == 0 {
			missingTranslations = append(missingTranslations, template)
		}
	}

	return missingTranslations, nil
}

// GetTranslationProgress gets translation progress for a locale
func GetTranslationProgress(
	db *gorm.DB,
	localeCode string,
) (map[string]interface{}, error) {
	progress := make(map[string]interface{})

	// Total templates
	var totalTemplates int64
	db.Model(&Template{}).Where("status = ?", TemplateStatusActive).Count(&totalTemplates)
	progress["total"] = totalTemplates

	// Translated
	var translatedCount int64
	db.Model(&TemplateTranslation{}).
		Where("locale_code = ? AND status = ?", localeCode, TranslationStatusPublished).
		Count(&translatedCount)
	progress["translated"] = translatedCount

	// Draft translations
	var draftCount int64
	db.Model(&TemplateTranslation{}).
		Where("locale_code = ? AND status = ?", localeCode, TranslationStatusDraft).
		Count(&draftCount)
	progress["draft"] = draftCount

	// Review translations
	var reviewCount int64
	db.Model(&TemplateTranslation{}).
		Where("locale_code = ? AND status = ?", localeCode, TranslationStatusReview).
		Count(&reviewCount)
	progress["review"] = reviewCount

	// Progress percentage
	if totalTemplates > 0 {
		progress["percentage"] = (float64(translatedCount) / float64(totalTemplates)) * 100
	} else {
		progress["percentage"] = 0.0
	}

	return progress, nil
}

// CreateRegionalVariant creates a regional variant of a template
func CreateRegionalVariant(
	db *gorm.DB,
	region *TemplateRegion,
	userID *uuid.UUID,
) error {
	region.CreatedBy = userID
	return db.Create(region).Error
}

// GetRegionalTemplate gets regional variant for a country
func GetRegionalTemplate(
	db *gorm.DB,
	templateID uuid.UUID,
	countryCode string,
) (*TemplateRegion, error) {
	var regions []TemplateRegion
	err := db.Where("template_id = ? AND is_active = ?", templateID, true).
		Order("priority DESC").
		Find(&regions).Error

	if err != nil {
		return nil, err
	}

	// Find matching region
	for _, region := range regions {
		if region.MatchesCountry(countryCode) {
			return &region, nil
		}
	}

	return nil, gorm.ErrRecordNotFound
}

// SetupLocale creates or updates a locale
func SetupLocale(db *gorm.DB, locale *TemplateLocale, userID *uuid.UUID) error {
	locale.CreatedBy = userID

	// Check if locale exists
	var existing TemplateLocale
	err := db.Where("locale_code = ?", locale.LocaleCode).First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		return db.Create(locale).Error
	}

	locale.ID = existing.ID
	locale.UpdatedBy = userID
	return db.Save(locale).Error
}

// GetSupportedLanguages gets all active languages
func GetSupportedLanguages(db *gorm.DB) ([]Language, error) {
	var languages []Language
	err := db.Where("is_active = ?", true).
		Order("name ASC").
		Find(&languages).Error

	return languages, err
}

// GetSupportedLocales gets all active locales
func GetSupportedLocales(db *gorm.DB) ([]TemplateLocale, error) {
	var locales []TemplateLocale
	err := db.Where("is_active = ?", true).
		Order("name ASC").
		Find(&locales).Error

	return locales, err
}

// DetectLocale detects locale from language and country
func DetectLocale(db *gorm.DB, languageCode, countryCode string) (*TemplateLocale, error) {
	localeCode := fmt.Sprintf("%s-%s", languageCode, countryCode)

	var locale TemplateLocale
	err := db.Where("locale_code = ? AND is_active = ?", localeCode, true).
		First(&locale).Error

	if err == gorm.ErrRecordNotFound {
		// Try language only
		err = db.Where("language_code = ? AND is_active = ?", languageCode, true).
			First(&locale).Error
	}

	if err == gorm.ErrRecordNotFound {
		// Get default locale
		err = db.Where("is_default = ? AND is_active = ?", true, true).
			First(&locale).Error
	}

	return &locale, err
}

// AutoTranslate auto-translates a template (placeholder for integration)
func AutoTranslate(
	db *gorm.DB,
	templateID uuid.UUID,
	targetLocale string,
	provider string, // google, aws, deepl
	userID *uuid.UUID,
) (*TemplateTranslation, error) {
	var template Template
	if err := db.First(&template, templateID).Error; err != nil {
		return nil, err
	}

	// TODO: Integrate with translation API
	// For now, create a draft translation
	translation := &TemplateTranslation{
		TemplateID:   templateID,
		LanguageCode: targetLocale[:2],
		LocaleCode:   targetLocale,
		Status:       TranslationStatusDraft,
		Subject:      template.Subject,
		Body:         template.Body,
		HTMLBody:     template.HTMLBody,
		Quality:      strPtr("AUTO"),
		CreatedBy:    userID,
	}

	if err := db.Create(translation).Error; err != nil {
		return nil, err
	}

	return translation, nil
}
