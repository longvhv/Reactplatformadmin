package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// TERMS TEMPLATE - Templates for Terms
// ============================================================================
// Purpose: Reusable templates for creating terms
// Table: terms_templates
// Primary Key: _id (UUID)
// Features: Template management, Variables, Localization
// ============================================================================

type TemplateStatus string

const (
	TemplateStatusActive   TemplateStatus = "ACTIVE"
	TemplateStatusInactive TemplateStatus = "INACTIVE"
	TemplateStatusArchived TemplateStatus = "ARCHIVED"
)

type TermsTemplate struct {
	// Identity (3 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CategoryID *uuid.UUID `gorm:"column:category_id;type:uuid;index" json:"category_id,omitempty"`

	// Template Info (7 fields)
	Code        string         `gorm:"column:code;type:varchar(100);uniqueIndex;not null" json:"code"`
	Name        string         `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string        `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        TermsType      `gorm:"column:type;type:varchar(30);not null" json:"type"`
	Status      TemplateStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Language    string         `gorm:"column:language;type:varchar(10);not null;default:'en'" json:"language"`
	Version     string         `gorm:"column:version;type:varchar(50);not null" json:"version"`

	// Content (3 fields)
	Content     string  `gorm:"column:content;type:text;not null" json:"content"`
	ContentType string  `gorm:"column:content_type;type:varchar(20);default:'html'" json:"content_type"`
	Variables   JSONB   `gorm:"column:variables;type:jsonb" json:"variables,omitempty"` // Template variables

	// Configuration (2 fields)
	IsDefault   bool `gorm:"column:is_default;default:false" json:"is_default"`
	IsPublic    bool `gorm:"column:is_public;default:false" json:"is_public"`

	// Usage Stats (2 fields)
	UsageCount int64      `gorm:"column:usage_count;default:0" json:"usage_count"`
	LastUsedAt *time.Time `gorm:"column:last_used_at" json:"last_used_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`
}

func (TermsTemplate) TableName() string {
	return "terms_templates"
}

// ============================================================================
// TERMS CHANGELOG - Version Change History
// ============================================================================

type ChangeType string

const (
	ChangeTypeCreated  ChangeType = "CREATED"
	ChangeTypeUpdated  ChangeType = "UPDATED"
	ChangeTypePublished ChangeType = "PUBLISHED"
	ChangeTypeArchived ChangeType = "ARCHIVED"
	ChangeTypeMajor    ChangeType = "MAJOR_UPDATE"
	ChangeTypeMinor    ChangeType = "MINOR_UPDATE"
	ChangeTypeFix      ChangeType = "FIX"
)

type TermsChangelog struct {
	// Identity (2 fields)
	ID      uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TermsID uuid.UUID `gorm:"column:terms_id;type:uuid;not null;index" json:"terms_id"`

	// Change Info (6 fields)
	Type           ChangeType `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Version        string     `gorm:"column:version;type:varchar(50);not null" json:"version"`
	PreviousVersion *string   `gorm:"column:previous_version;type:varchar(50)" json:"previous_version,omitempty"`
	Summary        string     `gorm:"column:summary;type:text;not null" json:"summary"`
	Description    *string    `gorm:"column:description;type:text" json:"description,omitempty"`
	IsMajorChange  bool       `gorm:"column:is_major_change;default:false" json:"is_major_change"`

	// Changes (2 fields)
	Changes      JSONB `gorm:"column:changes;type:jsonb" json:"changes,omitempty"`
	AffectedSections JSONB `gorm:"column:affected_sections;type:jsonb" json:"affected_sections,omitempty"`

	// Impact (2 fields)
	ImpactLevel  *string `gorm:"column:impact_level;type:varchar(20)" json:"impact_level,omitempty"` // LOW, MEDIUM, HIGH
	ImpactedUsers int64  `gorm:"column:impacted_users;default:0" json:"impacted_users"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime;index" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationships
	Terms *TermsOfService `gorm:"foreignKey:TermsID" json:"terms,omitempty"`
}

func (TermsChangelog) TableName() string {
	return "terms_changelogs"
}

// ============================================================================
// TERMS ANALYTICS - Analytics and Metrics
// ============================================================================

type AnalyticsInterval string

const (
	AnalyticsIntervalHour  AnalyticsInterval = "HOUR"
	AnalyticsIntervalDay   AnalyticsInterval = "DAY"
	AnalyticsIntervalWeek  AnalyticsInterval = "WEEK"
	AnalyticsIntervalMonth AnalyticsInterval = "MONTH"
)

type TermsAnalytics struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Time Bucket (3 fields)
	Interval    AnalyticsInterval `gorm:"column:interval;type:varchar(20);not null;index" json:"interval"`
	BucketStart time.Time         `gorm:"column:bucket_start;not null;index" json:"bucket_start"`
	BucketEnd   time.Time         `gorm:"column:bucket_end;not null" json:"bucket_end"`

	// Terms Stats (3 fields)
	ActiveTerms   int64 `gorm:"column:active_terms;default:0" json:"active_terms"`
	DraftTerms    int64 `gorm:"column:draft_terms;default:0" json:"draft_terms"`
	ArchivedTerms int64 `gorm:"column:archived_terms;default:0" json:"archived_terms"`

	// Acceptance Stats (6 fields)
	TotalAcceptances   int64 `gorm:"column:total_acceptances;default:0" json:"total_acceptances"`
	NewAcceptances     int64 `gorm:"column:new_acceptances;default:0" json:"new_acceptances"`
	TotalRejections    int64 `gorm:"column:total_rejections;default:0" json:"total_rejections"`
	NewRejections      int64 `gorm:"column:new_rejections;default:0" json:"new_rejections"`
	UniqueUsers        int64 `gorm:"column:unique_users;default:0" json:"unique_users"`
	AcceptanceRate     float64 `gorm:"column:acceptance_rate;type:decimal(5,2)" json:"acceptance_rate"`

	// Compliance Stats (4 fields)
	CompliantUsers    int64 `gorm:"column:compliant_users;default:0" json:"compliant_users"`
	NonCompliantUsers int64 `gorm:"column:non_compliant_users;default:0" json:"non_compliant_users"`
	ComplianceRate    float64 `gorm:"column:compliance_rate;type:decimal(5,2)" json:"compliance_rate"`
	ComplianceChecks  int64 `gorm:"column:compliance_checks;default:0" json:"compliance_checks"`

	// Reminder Stats (3 fields)
	RemindersSent      int64 `gorm:"column:reminders_sent;default:0" json:"reminders_sent"`
	RemindersViewed    int64 `gorm:"column:reminders_viewed;default:0" json:"reminders_viewed"`
	RemindersResponded int64 `gorm:"column:reminders_responded;default:0" json:"reminders_responded"`

	// Top Terms (2 fields)
	TopAcceptedTerms JSONB `gorm:"column:top_accepted_terms;type:jsonb" json:"top_accepted_terms,omitempty"`
	TopRejectedTerms JSONB `gorm:"column:top_rejected_terms;type:jsonb" json:"top_rejected_terms,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (TermsAnalytics) TableName() string {
	return "terms_analytics"
}

func (t *TermsAnalytics) GetAcceptanceRate() float64 {
	total := t.TotalAcceptances + t.TotalRejections
	if total == 0 {
		return 0
	}
	return (float64(t.TotalAcceptances) / float64(total)) * 100
}

func (t *TermsAnalytics) GetComplianceRate() float64 {
	total := t.CompliantUsers + t.NonCompliantUsers
	if total == 0 {
		return 0
	}
	return (float64(t.CompliantUsers) / float64(total)) * 100
}

// ============================================================================
// TERMS REPORT - Reports
// ============================================================================

type ReportType string

const (
	ReportTypeAcceptance  ReportType = "ACCEPTANCE"
	ReportTypeCompliance  ReportType = "COMPLIANCE"
	ReportTypeActivity    ReportType = "ACTIVITY"
	ReportTypeAudit       ReportType = "AUDIT"
)

type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "PENDING"
	ReportStatusGenerating ReportStatus = "GENERATING"
	ReportStatusCompleted ReportStatus = "COMPLETED"
	ReportStatusFailed    ReportStatus = "FAILED"
)

type TermsReport struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Report Info (5 fields)
	ReportNumber string       `gorm:"column:report_number;type:varchar(50);uniqueIndex;not null" json:"report_number"`
	Type         ReportType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status       ReportStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Title        string       `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Description  *string      `gorm:"column:description;type:text" json:"description,omitempty"`

	// Period (2 fields)
	PeriodStart time.Time `gorm:"column:period_start;not null;index" json:"period_start"`
	PeriodEnd   time.Time `gorm:"column:period_end;not null;index" json:"period_end"`

	// Summary (12 fields)
	TotalTerms         int64   `gorm:"column:total_terms;default:0" json:"total_terms"`
	ActiveTerms        int64   `gorm:"column:active_terms;default:0" json:"active_terms"`
	TotalAcceptances   int64   `gorm:"column:total_acceptances;default:0" json:"total_acceptances"`
	TotalRejections    int64   `gorm:"column:total_rejections;default:0" json:"total_rejections"`
	UniqueUsers        int64   `gorm:"column:unique_users;default:0" json:"unique_users"`
	CompliantUsers     int64   `gorm:"column:compliant_users;default:0" json:"compliant_users"`
	NonCompliantUsers  int64   `gorm:"column:non_compliant_users;default:0" json:"non_compliant_users"`
	RemindersSent      int64   `gorm:"column:reminders_sent;default:0" json:"reminders_sent"`
	AcceptanceRate     float64 `gorm:"column:acceptance_rate;type:decimal(5,2)" json:"acceptance_rate"`
	ComplianceRate     float64 `gorm:"column:compliance_rate;type:decimal(5,2)" json:"compliance_rate"`
	AverageTimeToAccept float64 `gorm:"column:average_time_to_accept;type:decimal(10,2)" json:"average_time_to_accept"` // Days
	VersionChanges     int64   `gorm:"column:version_changes;default:0" json:"version_changes"`

	// Analysis (3 fields)
	TopTerms    JSONB `gorm:"column:top_terms;type:jsonb" json:"top_terms,omitempty"`
	Trends      JSONB `gorm:"column:trends;type:jsonb" json:"trends,omitempty"`
	Findings    JSONB `gorm:"column:findings;type:jsonb" json:"findings,omitempty"`

	// Generation (4 fields)
	GeneratedAt    *time.Time `gorm:"column:generated_at" json:"generated_at,omitempty"`
	GeneratedBy    *uuid.UUID `gorm:"column:generated_by;type:uuid" json:"generated_by,omitempty"`
	GenerationTime *int       `gorm:"column:generation_time" json:"generation_time,omitempty"` // Seconds
	ErrorMessage   *string    `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Export (2 fields)
	FileURL  *string `gorm:"column:file_url;type:text" json:"file_url,omitempty"`
	FileSize *int64  `gorm:"column:file_size" json:"file_size,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (TermsReport) TableName() string {
	return "terms_reports"
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateTemplate creates a terms template
func CreateTemplate(
	db *gorm.DB,
	template *TermsTemplate,
	userID *uuid.UUID,
) error {
	template.CreatedBy = userID
	template.Status = TemplateStatusActive
	return db.Create(template).Error
}

// CreateTermsFromTemplate creates terms from a template
func CreateTermsFromTemplate(
	db *gorm.DB,
	templateID uuid.UUID,
	variables map[string]string,
	userID *uuid.UUID,
) (*TermsOfService, error) {
	var template TermsTemplate
	if err := db.First(&template, templateID).Error; err != nil {
		return nil, err
	}

	// Replace variables in content
	content := template.Content
	for key, value := range variables {
		placeholder := fmt.Sprintf("{{%s}}", key)
		content = replaceAll(content, placeholder, value)
	}

	terms := &TermsOfService{
		TenantID:    template.TenantID,
		CategoryID:  template.CategoryID,
		Code:        generateTermsCode(),
		Type:        template.Type,
		Status:      TermsStatusDraft,
		Scope:       TermsScopeGlobal,
		Title:       variables["title"],
		Language:    template.Language,
		Version:     "1.0",
		VersionNumber: 1,
		IsLatest:    true,
		Content:     content,
		ContentType: template.ContentType,
		RequiresAcceptance: true,
		IsMandatory: true,
		ShowOnSignup: true,
		CreatedBy:   userID,
		EffectiveDate: time.Now(),
	}

	if err := db.Create(terms).Error; err != nil {
		return nil, err
	}

	// Update template usage
	template.UsageCount++
	now := time.Now()
	template.LastUsedAt = &now
	db.Save(&template)

	return terms, nil
}

// LogChange logs a change to terms
func LogChange(
	db *gorm.DB,
	termsID uuid.UUID,
	changeType ChangeType,
	summary string,
	userID *uuid.UUID,
	options map[string]interface{},
) error {
	var terms TermsOfService
	if err := db.First(&terms, termsID).Error; err != nil {
		return err
	}

	changelog := &TermsChangelog{
		TermsID:       termsID,
		Type:          changeType,
		Version:       terms.Version,
		Summary:       summary,
		IsMajorChange: terms.IsMajorUpdate,
		CreatedBy:     userID,
	}

	// Apply options
	if description, ok := options["description"].(string); ok {
		changelog.Description = &description
	}
	if changes, ok := options["changes"].(map[string]interface{}); ok {
		changelog.Changes = changes
	}

	return db.Create(changelog).Error
}

// AggregateAnalytics aggregates terms analytics
func AggregateAnalytics(
	db *gorm.DB,
	interval AnalyticsInterval,
	bucketStart, bucketEnd time.Time,
	tenantID *uuid.UUID,
) error {
	analytics := &TermsAnalytics{
		TenantID:    tenantID,
		Interval:    interval,
		BucketStart: bucketStart,
		BucketEnd:   bucketEnd,
	}

	// Count terms
	query := db.Model(&TermsOfService{})
	if tenantID != nil {
		query = query.Where("tenant_id = ?", tenantID)
	}

	query.Where("status = ?", TermsStatusActive).Count(&analytics.ActiveTerms)
	db.Model(&TermsOfService{}).Where("status = ?", TermsStatusDraft).Count(&analytics.DraftTerms)

	// Count acceptances
	acceptanceQuery := db.Model(&TermsAcceptance{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd)

	acceptanceQuery.Where("is_accepted = ?", true).Count(&analytics.NewAcceptances)
	acceptanceQuery.Where("is_accepted = ?", false).Count(&analytics.NewRejections)

	// Total acceptances
	db.Model(&TermsAcceptance{}).Where("is_accepted = ?", true).Count(&analytics.TotalAcceptances)
	db.Model(&TermsAcceptance{}).Where("is_accepted = ?", false).Count(&analytics.TotalRejections)

	// Unique users
	db.Model(&TermsAcceptance{}).
		Where("created_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Distinct("user_id").
		Count(&analytics.UniqueUsers)

	// Compliance
	db.Model(&ComplianceRecord{}).
		Where("check_date BETWEEN ? AND ? AND is_compliant = ?", 
			bucketStart, bucketEnd, true).
		Count(&analytics.CompliantUsers)

	db.Model(&ComplianceRecord{}).
		Where("check_date BETWEEN ? AND ? AND is_compliant = ?", 
			bucketStart, bucketEnd, false).
		Count(&analytics.NonCompliantUsers)

	// Reminders
	db.Model(&AcceptanceReminder{}).
		Where("sent_at BETWEEN ? AND ?", bucketStart, bucketEnd).
		Count(&analytics.RemindersSent)

	// Calculate rates
	analytics.AcceptanceRate = analytics.GetAcceptanceRate()
	analytics.ComplianceRate = analytics.GetComplianceRate()

	return db.Create(analytics).Error
}

// GenerateReport generates a terms report
func GenerateReport(
	db *gorm.DB,
	reportType ReportType,
	startDate, endDate time.Time,
	userID *uuid.UUID,
) (*TermsReport, error) {
	startTime := time.Now()

	report := &TermsReport{
		ReportNumber: generateReportNumber(),
		Type:         reportType,
		Status:       ReportStatusGenerating,
		Title:        fmt.Sprintf("%s Report", reportType),
		PeriodStart:  startDate,
		PeriodEnd:    endDate,
		GeneratedBy:  userID,
	}

	if err := db.Create(report).Error; err != nil {
		return nil, err
	}

	// Calculate statistics
	if err := calculateReportStats(db, report, startDate, endDate); err != nil {
		report.Status = ReportStatusFailed
		report.ErrorMessage = strPtr(err.Error())
		db.Save(report)
		return report, err
	}

	// Complete report
	now := time.Now()
	generationTime := int(now.Sub(startTime).Seconds())
	report.Status = ReportStatusCompleted
	report.GeneratedAt = &now
	report.GenerationTime = &generationTime

	db.Save(report)

	return report, nil
}

func calculateReportStats(
	db *gorm.DB,
	report *TermsReport,
	startDate, endDate time.Time,
) error {
	// Count terms
	db.Model(&TermsOfService{}).Count(&report.TotalTerms)
	db.Model(&TermsOfService{}).Where("status = ?", TermsStatusActive).Count(&report.ActiveTerms)

	// Count acceptances
	db.Model(&TermsAcceptance{}).
		Where("created_at BETWEEN ? AND ? AND is_accepted = ?", 
			startDate, endDate, true).
		Count(&report.TotalAcceptances)

	db.Model(&TermsAcceptance{}).
		Where("created_at BETWEEN ? AND ? AND is_accepted = ?", 
			startDate, endDate, false).
		Count(&report.TotalRejections)

	// Unique users
	db.Model(&TermsAcceptance{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Distinct("user_id").
		Count(&report.UniqueUsers)

	// Compliance
	db.Model(&ComplianceRecord{}).
		Where("check_date BETWEEN ? AND ? AND is_compliant = ?", 
			startDate, endDate, true).
		Count(&report.CompliantUsers)

	db.Model(&ComplianceRecord{}).
		Where("check_date BETWEEN ? AND ? AND is_compliant = ?", 
			startDate, endDate, false).
		Count(&report.NonCompliantUsers)

	// Reminders
	db.Model(&AcceptanceReminder{}).
		Where("sent_at BETWEEN ? AND ?", startDate, endDate).
		Count(&report.RemindersSent)

	// Version changes
	db.Model(&TermsChangelog{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&report.VersionChanges)

	// Calculate rates
	total := report.TotalAcceptances + report.TotalRejections
	if total > 0 {
		report.AcceptanceRate = (float64(report.TotalAcceptances) / float64(total)) * 100
	}

	totalUsers := report.CompliantUsers + report.NonCompliantUsers
	if totalUsers > 0 {
		report.ComplianceRate = (float64(report.CompliantUsers) / float64(totalUsers)) * 100
	}

	return nil
}

func generateTermsCode() string {
	now := time.Now()
	return fmt.Sprintf("TERMS-%s-%05d", 
		now.Format("20060102"), 
		now.Unix()%100000)
}

func generateReportNumber() string {
	now := time.Now()
	return fmt.Sprintf("TRPT-%s-%05d", 
		now.Format("20060102"), 
		now.Unix()%100000)
}

func replaceAll(s, old, new string) string {
	// Simple string replacement
	result := s
	for i := 0; i < len(s); i++ {
		if len(result) >= len(old)+i && result[i:i+len(old)] == old {
			result = result[:i] + new + result[i+len(old):]
			i += len(new) - 1
		}
	}
	return result
}

// GetAnalytics gets analytics for a period
func GetAnalytics(
	db *gorm.DB,
	interval AnalyticsInterval,
	startDate, endDate time.Time,
) ([]TermsAnalytics, error) {
	var analytics []TermsAnalytics

	err := db.Where("interval = ? AND bucket_start BETWEEN ? AND ?", 
		interval, startDate, endDate).
		Order("bucket_start ASC").
		Find(&analytics).Error

	return analytics, err
}

// GetChangelog gets changelog for terms
func GetChangelog(
	db *gorm.DB,
	termsID uuid.UUID,
	limit int,
) ([]TermsChangelog, error) {
	var changelog []TermsChangelog

	err := db.Where("terms_id = ?", termsID).
		Order("created_at DESC").
		Limit(limit).
		Find(&changelog).Error

	return changelog, err
}
