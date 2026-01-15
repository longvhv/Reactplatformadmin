package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// TEMPLATE - Notification Templates
// ============================================================================
// Purpose: Advanced notification template management
// Table: templates
// Primary Key: _id (UUID)
// Features: Versioning, Variables, Rendering, Inheritance
// ============================================================================

type TemplateType string

const (
	TemplateTypeEmail       TemplateType = "EMAIL"
	TemplateTypeSMS         TemplateType = "SMS"
	TemplateTypePush        TemplateType = "PUSH"
	TemplateTypeInApp       TemplateType = "IN_APP"
	TemplateTypeWebhook     TemplateType = "WEBHOOK"
	TemplateTypeSlack       TemplateType = "SLACK"
	TemplateTypeMultiChannel TemplateType = "MULTI_CHANNEL"
)

type TemplateStatus string

const (
	TemplateStatusDraft      TemplateStatus = "DRAFT"
	TemplateStatusReview     TemplateStatus = "REVIEW"
	TemplateStatusApproved   TemplateStatus = "APPROVED"
	TemplateStatusActive     TemplateStatus = "ACTIVE"
	TemplateStatusDeprecated TemplateStatus = "DEPRECATED"
	TemplateStatusArchived   TemplateStatus = "ARCHIVED"
)

type RenderEngine string

const (
	RenderEngineSimple   RenderEngine = "SIMPLE"    // {{variable}}
	RenderEngineGo       RenderEngine = "GO"        // Go template
	RenderEngineHandlebars RenderEngine = "HANDLEBARS" // Handlebars
	RenderEngineLiquid   RenderEngine = "LIQUID"    // Liquid
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
// Template Model (35 fields)
// ============================================================================

type Template struct {
	// ========== Identity (4 fields) ==========
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`
	ParentID   *uuid.UUID `gorm:"column:parent_id;type:uuid;index" json:"parent_id,omitempty"` // For inheritance

	// ========== Template Info (9 fields) ==========
	Code           string         `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name           string         `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description    *string        `gorm:"column:description;type:text" json:"description,omitempty"`
	Type           TemplateType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status         TemplateStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Version        int            `gorm:"column:version;not null;default:1" json:"version"`
	IsDefault      bool           `gorm:"column:is_default;default:false" json:"is_default"`
	RenderEngine   RenderEngine   `gorm:"column:render_engine;type:varchar(20);default:'SIMPLE'" json:"render_engine"`
	Tags           JSONB          `gorm:"column:tags;type:jsonb" json:"tags,omitempty"`

	// ========== Content (5 fields) ==========
	Subject      *string `gorm:"column:subject;type:text" json:"subject,omitempty"` // For email
	Body         string  `gorm:"column:body;type:text;not null" json:"body"`
	HTMLBody     *string `gorm:"column:html_body;type:text" json:"html_body,omitempty"` // For email
	PreviewText  *string `gorm:"column:preview_text;type:varchar(255)" json:"preview_text,omitempty"`
	PlainText    *string `gorm:"column:plain_text;type:text" json:"plain_text,omitempty"`

	// ========== Variables (4 fields) ==========
	RequiredVariables JSONB `gorm:"column:required_variables;type:jsonb" json:"required_variables,omitempty"` // ["user_name", "order_id"]
	OptionalVariables JSONB `gorm:"column:optional_variables;type:jsonb" json:"optional_variables,omitempty"`
	DefaultValues     JSONB `gorm:"column:default_values;type:jsonb" json:"default_values,omitempty"`
	SampleData        JSONB `gorm:"column:sample_data;type:jsonb" json:"sample_data,omitempty"`

	// ========== Styling (3 fields) ==========
	CSSStyles    *string `gorm:"column:css_styles;type:text" json:"css_styles,omitempty"`
	InlineStyles bool    `gorm:"column:inline_styles;default:true" json:"inline_styles"`
	CustomCSS    *string `gorm:"column:custom_css;type:text" json:"custom_css,omitempty"`

	// ========== Settings (3 fields) ==========
	Settings         JSONB `gorm:"column:settings;type:jsonb" json:"settings,omitempty"` // Channel-specific settings
	MaxLength        *int  `gorm:"column:max_length" json:"max_length,omitempty"` // For SMS
	AllowHTML        bool  `gorm:"column:allow_html;default:true" json:"allow_html"`

	// ========== Statistics (3 fields) ==========
	UsageCount     int64      `gorm:"column:usage_count;default:0" json:"usage_count"`
	LastUsedAt     *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`
	SuccessRate    float64    `gorm:"column:success_rate;type:decimal(5,2)" json:"success_rate"`

	// ========== Metadata (1 field) ==========
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// ========== Audit (4 fields) ==========
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// ========== Soft Delete (2 fields) ==========
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`

	// Relationships
	Category    *TemplateCategory   `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Parent      *Template           `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Versions    []TemplateVersion   `gorm:"foreignKey:TemplateID" json:"versions,omitempty"`
	Translations []TemplateTranslation `gorm:"foreignKey:TemplateID" json:"translations,omitempty"`
}

func (Template) TableName() string {
	return "templates"
}

// Helper Methods
func (t *Template) IsActive() bool {
	return t.Status == TemplateStatusActive
}

func (t *Template) IsPublished() bool {
	return t.Status == TemplateStatusActive || t.Status == TemplateStatusApproved
}

func (t *Template) CanEdit() bool {
	return t.Status == TemplateStatusDraft || t.Status == TemplateStatusReview
}

func (t *Template) Render(data map[string]interface{}) (string, error) {
	// Merge with default values
	mergedData := make(map[string]interface{})
	if t.DefaultValues != nil {
		for k, v := range t.DefaultValues {
			mergedData[k] = v
		}
	}
	for k, v := range data {
		mergedData[k] = v
	}

	// Validate required variables
	if err := t.ValidateVariables(mergedData); err != nil {
		return "", err
	}

	// Render based on engine
	switch t.RenderEngine {
	case RenderEngineSimple:
		return t.renderSimple(t.Body, mergedData), nil
	case RenderEngineGo:
		return t.renderGoTemplate(t.Body, mergedData)
	default:
		return t.renderSimple(t.Body, mergedData), nil
	}
}

func (t *Template) renderSimple(template string, data map[string]interface{}) string {
	result := template
	for key, value := range data {
		placeholder := fmt.Sprintf("{{%s}}", key)
		result = strings.ReplaceAll(result, placeholder, fmt.Sprintf("%v", value))
	}
	return result
}

func (t *Template) renderGoTemplate(template string, data map[string]interface{}) (string, error) {
	// Simplified Go template rendering
	// In production, use text/template package
	return t.renderSimple(template, data), nil
}

func (t *Template) ValidateVariables(data map[string]interface{}) error {
	if t.RequiredVariables == nil {
		return nil
	}

	requiredVars, ok := t.RequiredVariables["variables"].([]interface{})
	if !ok {
		return nil
	}

	missingVars := []string{}
	for _, reqVar := range requiredVars {
		varName, ok := reqVar.(string)
		if !ok {
			continue
		}
		if _, exists := data[varName]; !exists {
			missingVars = append(missingVars, varName)
		}
	}

	if len(missingVars) > 0 {
		return fmt.Errorf("missing required variables: %s", strings.Join(missingVars, ", "))
	}

	return nil
}

func (t *Template) ExtractVariables() []string {
	// Extract variables from template body
	re := regexp.MustCompile(`\{\{([^}]+)\}\}`)
	matches := re.FindAllStringSubmatch(t.Body, -1)

	variables := make(map[string]bool)
	for _, match := range matches {
		if len(match) > 1 {
			varName := strings.TrimSpace(match[1])
			variables[varName] = true
		}
	}

	result := make([]string, 0, len(variables))
	for varName := range variables {
		result = append(result, varName)
	}

	return result
}

func (t *Template) IncrementUsage() {
	t.UsageCount++
	now := time.Now()
	t.LastUsedAt = &now
}

// ============================================================================
// TEMPLATE VERSION - Version History
// ============================================================================

type VersionStatus string

const (
	VersionStatusDraft    VersionStatus = "DRAFT"
	VersionStatusActive   VersionStatus = "ACTIVE"
	VersionStatusArchived VersionStatus = "ARCHIVED"
)

type TemplateVersion struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TemplateID uuid.UUID `gorm:"column:template_id;type:uuid;not null;index" json:"template_id"`

	// Version Info (5 fields)
	VersionNumber int           `gorm:"column:version_number;not null" json:"version_number"`
	Status        VersionStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	ChangeSummary *string       `gorm:"column:change_summary;type:text" json:"change_summary,omitempty"`
	ChangeNotes   *string       `gorm:"column:change_notes;type:text" json:"change_notes,omitempty"`
	IsActive      bool          `gorm:"column:is_active;default:false" json:"is_active"`

	// Content Snapshot (5 fields)
	Subject      *string `gorm:"column:subject;type:text" json:"subject,omitempty"`
	Body         string  `gorm:"column:body;type:text;not null" json:"body"`
	HTMLBody     *string `gorm:"column:html_body;type:text" json:"html_body,omitempty"`
	Variables    JSONB   `gorm:"column:variables;type:jsonb" json:"variables,omitempty"`
	Settings     JSONB   `gorm:"column:settings;type:jsonb" json:"settings,omitempty"`

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

func (TemplateVersion) TableName() string {
	return "template_versions"
}

// ============================================================================
// TEMPLATE CATEGORY - Template Categories
// ============================================================================

type TemplateCategory struct {
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
	TemplateCount int64      `gorm:"column:template_count;default:0" json:"template_count"`
	LastUsedAt    *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	Templates []Template `gorm:"foreignKey:CategoryID" json:"templates,omitempty"`
}

func (TemplateCategory) TableName() string {
	return "template_categories"
}

// ============================================================================
// TEMPLATE VARIABLE - Variable Definitions
// ============================================================================

type VariableType string

const (
	VariableTypeString   VariableType = "STRING"
	VariableTypeNumber   VariableType = "NUMBER"
	VariableTypeBoolean  VariableType = "BOOLEAN"
	VariableTypeDate     VariableType = "DATE"
	VariableTypeDateTime VariableType = "DATETIME"
	VariableTypeURL      VariableType = "URL"
	VariableTypeEmail    VariableType = "EMAIL"
	VariableTypeArray    VariableType = "ARRAY"
	VariableTypeObject   VariableType = "OBJECT"
)

type TemplateVariable struct {
	// Identity (2 fields)
	ID         uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID   *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Variable Info (7 fields)
	Name         string       `gorm:"column:name;type:varchar(100);uniqueIndex;not null" json:"name"`
	DisplayName  string       `gorm:"column:display_name;type:varchar(255);not null" json:"display_name"`
	Description  *string      `gorm:"column:description;type:text" json:"description,omitempty"`
	Type         VariableType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	DefaultValue *string      `gorm:"column:default_value;type:text" json:"default_value,omitempty"`
	Example      *string      `gorm:"column:example;type:text" json:"example,omitempty"`
	IsGlobal     bool         `gorm:"column:is_global;default:false" json:"is_global"` // Available in all templates

	// Validation (3 fields)
	ValidationRules JSONB   `gorm:"column:validation_rules;type:jsonb" json:"validation_rules,omitempty"`
	MinLength       *int    `gorm:"column:min_length" json:"min_length,omitempty"`
	MaxLength       *int    `gorm:"column:max_length" json:"max_length,omitempty"`

	// Format (2 fields)
	Format      *string `gorm:"column:format;type:varchar(100)" json:"format,omitempty"` // date format, number format
	Placeholder *string `gorm:"column:placeholder;type:varchar(255)" json:"placeholder,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
}

func (TemplateVariable) TableName() string {
	return "template_variables"
}

func (v *TemplateVariable) Validate(value interface{}) error {
	// Type validation
	switch v.Type {
	case VariableTypeString:
		str, ok := value.(string)
		if !ok {
			return fmt.Errorf("expected string, got %T", value)
		}
		if v.MinLength != nil && len(str) < *v.MinLength {
			return fmt.Errorf("string too short, minimum length is %d", *v.MinLength)
		}
		if v.MaxLength != nil && len(str) > *v.MaxLength {
			return fmt.Errorf("string too long, maximum length is %d", *v.MaxLength)
		}
	case VariableTypeNumber:
		_, ok := value.(float64)
		if !ok {
			_, ok = value.(int)
			if !ok {
				return fmt.Errorf("expected number, got %T", value)
			}
		}
	case VariableTypeBoolean:
		_, ok := value.(bool)
		if !ok {
			return fmt.Errorf("expected boolean, got %T", value)
		}
	}

	return nil
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateTemplate creates a new template
func CreateTemplate(
	db *gorm.DB,
	template *Template,
	userID *uuid.UUID,
) error {
	template.CreatedBy = userID
	template.Version = 1
	template.Status = TemplateStatusDraft

	return db.Transaction(func(tx *gorm.DB) error {
		// Create template
		if err := tx.Create(template).Error; err != nil {
			return err
		}

		// Create first version
		version := &TemplateVersion{
			TemplateID:    template.ID,
			VersionNumber: 1,
			Status:        VersionStatusDraft,
			Subject:       template.Subject,
			Body:          template.Body,
			HTMLBody:      template.HTMLBody,
			IsActive:      true,
			CreatedBy:     userID,
		}

		return tx.Create(version).Error
	})
}

// PublishTemplate publishes a template
func PublishTemplate(db *gorm.DB, templateID uuid.UUID, userID *uuid.UUID) error {
	var template Template
	if err := db.First(&template, templateID).Error; err != nil {
		return err
	}

	if !template.CanEdit() {
		return fmt.Errorf("template cannot be published in current status")
	}

	template.Status = TemplateStatusActive
	template.UpdatedBy = userID

	return db.Save(&template).Error
}

// CreateNewVersion creates a new version of a template
func CreateNewVersion(
	db *gorm.DB,
	templateID uuid.UUID,
	changes map[string]interface{},
	changeSummary string,
	userID *uuid.UUID,
) (*TemplateVersion, error) {
	return db.Transaction(func(tx *gorm.DB) (*TemplateVersion, error) {
		var template Template
		if err := tx.First(&template, templateID).Error; err != nil {
			return nil, err
		}

		// Deactivate current version
		tx.Model(&TemplateVersion{}).
			Where("template_id = ? AND is_active = ?", templateID, true).
			Update("is_active", false)

		// Create new version
		newVersionNumber := template.Version + 1
		version := &TemplateVersion{
			TemplateID:    templateID,
			VersionNumber: newVersionNumber,
			Status:        VersionStatusDraft,
			ChangeSummary: &changeSummary,
			Subject:       template.Subject,
			Body:          template.Body,
			HTMLBody:      template.HTMLBody,
			IsActive:      true,
			CreatedBy:     userID,
		}

		// Apply changes
		if subject, ok := changes["subject"].(string); ok {
			version.Subject = &subject
		}
		if body, ok := changes["body"].(string); ok {
			version.Body = body
		}
		if htmlBody, ok := changes["html_body"].(string); ok {
			version.HTMLBody = &htmlBody
		}

		if err := tx.Create(version).Error; err != nil {
			return nil, err
		}

		// Update template version number
		template.Version = newVersionNumber
		template.UpdatedBy = userID
		tx.Save(&template)

		return version, nil
	}).(*TemplateVersion), nil
}

// RollbackVersion rollbacks to a previous version
func RollbackVersion(db *gorm.DB, versionID uuid.UUID, userID *uuid.UUID) error {
	return db.Transaction(func(tx *gorm.DB) error {
		var version TemplateVersion
		if err := tx.First(&version, versionID).Error; err != nil {
			return err
		}

		var template Template
		if err := tx.First(&template, version.TemplateID).Error; err != nil {
			return err
		}

		// Deactivate current version
		tx.Model(&TemplateVersion{}).
			Where("template_id = ? AND is_active = ?", version.TemplateID, true).
			Update("is_active", false)

		// Activate selected version
		version.IsActive = true
		tx.Save(&version)

		// Update template
		template.Subject = version.Subject
		template.Body = version.Body
		template.HTMLBody = version.HTMLBody
		template.Version = version.VersionNumber
		template.UpdatedBy = userID
		
		return tx.Save(&template).Error
	})
}

// CloneTemplate clones a template
func CloneTemplate(
	db *gorm.DB,
	templateID uuid.UUID,
	newCode, newName string,
	userID *uuid.UUID,
) (*Template, error) {
	var original Template
	if err := db.First(&original, templateID).Error; err != nil {
		return nil, err
	}

	clone := &Template{
		TenantID:          original.TenantID,
		CategoryID:        original.CategoryID,
		Code:              newCode,
		Name:              newName,
		Description:       original.Description,
		Type:              original.Type,
		Status:            TemplateStatusDraft,
		Version:           1,
		RenderEngine:      original.RenderEngine,
		Subject:           original.Subject,
		Body:              original.Body,
		HTMLBody:          original.HTMLBody,
		RequiredVariables: original.RequiredVariables,
		OptionalVariables: original.OptionalVariables,
		DefaultValues:     original.DefaultValues,
		Settings:          original.Settings,
		CreatedBy:         userID,
	}

	if err := CreateTemplate(db, clone, userID); err != nil {
		return nil, err
	}

	return clone, nil
}

// GetActiveTemplates gets all active templates
func GetActiveTemplates(db *gorm.DB, templateType *TemplateType) ([]Template, error) {
	query := db.Where("status = ?", TemplateStatusActive)

	if templateType != nil {
		query = query.Where("type = ?", templateType)
	}

	var templates []Template
	err := query.Order("name ASC").
		Preload("Category").
		Find(&templates).Error

	return templates, err
}

// GetTemplateByCode gets template by code
func GetTemplateByCode(db *gorm.DB, code string) (*Template, error) {
	var template Template
	err := db.Where("code = ? AND status = ?", code, TemplateStatusActive).
		Preload("Category").
		Preload("Versions", "is_active = ?", true).
		First(&template).Error

	return &template, err
}

// GetTemplateVersions gets all versions of a template
func GetTemplateVersions(db *gorm.DB, templateID uuid.UUID) ([]TemplateVersion, error) {
	var versions []TemplateVersion
	err := db.Where("template_id = ?", templateID).
		Order("version_number DESC").
		Find(&versions).Error

	return versions, err
}

// CompareVersions compares two template versions
func CompareVersions(
	db *gorm.DB,
	version1ID, version2ID uuid.UUID,
) (map[string]interface{}, error) {
	var v1, v2 TemplateVersion
	if err := db.First(&v1, version1ID).Error; err != nil {
		return nil, err
	}
	if err := db.First(&v2, version2ID).Error; err != nil {
		return nil, err
	}

	diff := make(map[string]interface{})

	if v1.Subject != v2.Subject {
		diff["subject"] = map[string]interface{}{
			"v1": v1.Subject,
			"v2": v2.Subject,
		}
	}

	if v1.Body != v2.Body {
		diff["body"] = map[string]interface{}{
			"v1": v1.Body,
			"v2": v2.Body,
		}
	}

	return diff, nil
}

func strPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}
