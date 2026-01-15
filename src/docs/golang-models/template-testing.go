package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// TEMPLATE TEST - Template Testing
// ============================================================================
// Purpose: Test templates before deployment
// Table: template_tests
// Primary Key: _id (UUID)
// Features: Preview, Validation, Send test
// ============================================================================

type TestStatus string

const (
	TestStatusPending   TestStatus = "PENDING"
	TestStatusRunning   TestStatus = "RUNNING"
	TestStatusPassed    TestStatus = "PASSED"
	TestStatusFailed    TestStatus = "FAILED"
	TestStatusCanceled  TestStatus = "CANCELED"
)

type TestType string

const (
	TestTypeValidation TestType = "VALIDATION"
	TestTypeRender     TestType = "RENDER"
	TestTypeDelivery   TestType = "DELIVERY"
	TestTypeSpam       TestType = "SPAM"
	TestTypeLinks      TestType = "LINKS"
	TestTypeResponsive TestType = "RESPONSIVE"
)

type TemplateTest struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TemplateID uuid.UUID `gorm:"column:template_id;type:uuid;not null;index" json:"template_id"`

	// Test Info (5 fields)
	TestNumber string     `gorm:"column:test_number;type:varchar(50);uniqueIndex;not null" json:"test_number"`
	Type       TestType   `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Status     TestStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Name       string     `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string   `gorm:"column:description;type:text" json:"description,omitempty"`

	// Test Data (2 fields)
	TestData    JSONB `gorm:"column:test_data;type:jsonb" json:"test_data,omitempty"`
	SampleData  JSONB `gorm:"column:sample_data;type:jsonb" json:"sample_data,omitempty"`

	// Results (5 fields)
	Passed       bool    `gorm:"column:passed;default:false" json:"passed"`
	Score        float64 `gorm:"column:score;type:decimal(5,2)" json:"score"` // 0-100
	Results      JSONB   `gorm:"column:results;type:jsonb" json:"results,omitempty"`
	Errors       JSONB   `gorm:"column:errors;type:jsonb" json:"errors,omitempty"`
	Warnings     JSONB   `gorm:"column:warnings;type:jsonb" json:"warnings,omitempty"`

	// Timing (3 fields)
	StartedAt   *time.Time `gorm:"column:started_at" json:"started_at,omitempty"`
	CompletedAt *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`
	Duration    *int       `gorm:"column:duration" json:"duration,omitempty"` // Milliseconds

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationships
	Template *Template `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
}

func (TemplateTest) TableName() string {
	return "template_tests"
}

func (t *TemplateTest) IsPassed() bool {
	return t.Passed && t.Status == TestStatusPassed
}

// ============================================================================
// TEMPLATE VALIDATION - Validation Rules
// ============================================================================

type ValidationType string

const (
	ValidationTypeRequired    ValidationType = "REQUIRED"
	ValidationTypeFormat      ValidationType = "FORMAT"
	ValidationTypeLength      ValidationType = "LENGTH"
	ValidationTypePattern     ValidationType = "PATTERN"
	ValidationTypeSpamCheck   ValidationType = "SPAM_CHECK"
	ValidationTypeLinkCheck   ValidationType = "LINK_CHECK"
	ValidationTypeImageCheck  ValidationType = "IMAGE_CHECK"
)

type ValidationSeverity string

const (
	ValidationSeverityError   ValidationSeverity = "ERROR"
	ValidationSeverityWarning ValidationSeverity = "WARNING"
	ValidationSeverityInfo    ValidationSeverity = "INFO"
)

type TemplateValidation struct {
	// Identity (2 fields)
	ID         uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TemplateID uuid.UUID `gorm:"column:template_id;type:uuid;not null;index" json:"template_id"`

	// Validation Info (5 fields)
	Type        ValidationType     `gorm:"column:type;type:varchar(20);not null;index" json:"type"`
	Severity    ValidationSeverity `gorm:"column:severity;type:varchar(20);not null" json:"severity"`
	Field       string             `gorm:"column:field;type:varchar(100);not null" json:"field"`
	Message     string             `gorm:"column:message;type:text;not null" json:"message"`
	Suggestion  *string            `gorm:"column:suggestion;type:text" json:"suggestion,omitempty"`

	// Rule (2 fields)
	Rule       JSONB  `gorm:"column:rule;type:jsonb" json:"rule,omitempty"`
	RuleValue  *string `gorm:"column:rule_value;type:text" json:"rule_value,omitempty"`

	// Status (2 fields)
	IsResolved bool       `gorm:"column:is_resolved;default:false" json:"is_resolved"`
	ResolvedAt *time.Time `gorm:"column:resolved_at" json:"resolved_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationships
	Template *Template `gorm:"foreignKey:TemplateID" json:"template,omitempty"`
}

func (TemplateValidation) TableName() string {
	return "template_validations"
}

// ============================================================================
// TEMPLATE AB TEST - A/B Testing
// ============================================================================

type ABTestStatus string

const (
	ABTestStatusDraft     ABTestStatus = "DRAFT"
	ABTestStatusActive    ABTestStatus = "ACTIVE"
	ABTestStatusPaused    ABTestStatus = "PAUSED"
	ABTestStatusCompleted ABTestStatus = "COMPLETED"
	ABTestStatusCanceled  ABTestStatus = "CANCELED"
)

type TemplateABTest struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Test Info (5 fields)
	TestNumber  string       `gorm:"column:test_number;type:varchar(50);uniqueIndex;not null" json:"test_number"`
	Name        string       `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string      `gorm:"column:description;type:text" json:"description,omitempty"`
	Status      ABTestStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Hypothesis  *string      `gorm:"column:hypothesis;type:text" json:"hypothesis,omitempty"`

	// Variants (2 fields)
	ControlTemplateID uuid.UUID `gorm:"column:control_template_id;type:uuid;not null" json:"control_template_id"`
	VariantTemplateID uuid.UUID `gorm:"column:variant_template_id;type:uuid;not null" json:"variant_template_id"`

	// Traffic Split (2 fields)
	ControlSplit int `gorm:"column:control_split;default:50" json:"control_split"` // Percentage
	VariantSplit int `gorm:"column:variant_split;default:50" json:"variant_split"` // Percentage

	// Goals (2 fields)
	PrimaryMetric   string `gorm:"column:primary_metric;type:varchar(50);not null" json:"primary_metric"` // open_rate, click_rate
	SecondaryMetrics JSONB `gorm:"column:secondary_metrics;type:jsonb" json:"secondary_metrics,omitempty"`

	// Duration (3 fields)
	StartDate    *time.Time `gorm:"column:start_date" json:"start_date,omitempty"`
	EndDate      *time.Time `gorm:"column:end_date" json:"end_date,omitempty"`
	MinimumSize  int        `gorm:"column:minimum_size;default:100" json:"minimum_size"` // Min sample size

	// Results - Control (5 fields)
	ControlSent      int64   `gorm:"column:control_sent;default:0" json:"control_sent"`
	ControlDelivered int64   `gorm:"column:control_delivered;default:0" json:"control_delivered"`
	ControlOpened    int64   `gorm:"column:control_opened;default:0" json:"control_opened"`
	ControlClicked   int64   `gorm:"column:control_clicked;default:0" json:"control_clicked"`
	ControlRate      float64 `gorm:"column:control_rate;type:decimal(5,2)" json:"control_rate"`

	// Results - Variant (5 fields)
	VariantSent      int64   `gorm:"column:variant_sent;default:0" json:"variant_sent"`
	VariantDelivered int64   `gorm:"column:variant_delivered;default:0" json:"variant_delivered"`
	VariantOpened    int64   `gorm:"column:variant_opened;default:0" json:"variant_opened"`
	VariantClicked   int64   `gorm:"column:variant_clicked;default:0" json:"variant_clicked"`
	VariantRate      float64 `gorm:"column:variant_rate;type:decimal(5,2)" json:"variant_rate"`

	// Statistical Significance (3 fields)
	Confidence      float64 `gorm:"column:confidence;type:decimal(5,2)" json:"confidence"` // 0-100%
	PValue          float64 `gorm:"column:p_value;type:decimal(10,8)" json:"p_value"`
	IsSignificant   bool    `gorm:"column:is_significant;default:false" json:"is_significant"`

	// Winner (2 fields)
	Winner       *string    `gorm:"column:winner;type:varchar(20)" json:"winner,omitempty"` // CONTROL, VARIANT, TIE
	CompletedAt  *time.Time `gorm:"column:completed_at" json:"completed_at,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Relationships
	ControlTemplate *Template `gorm:"foreignKey:ControlTemplateID" json:"control_template,omitempty"`
	VariantTemplate *Template `gorm:"foreignKey:VariantTemplateID" json:"variant_template,omitempty"`
}

func (TemplateABTest) TableName() string {
	return "template_ab_tests"
}

func (t *TemplateABTest) IsActive() bool {
	return t.Status == ABTestStatusActive
}

func (t *TemplateABTest) CalculateRates() {
	if t.ControlDelivered > 0 {
		switch t.PrimaryMetric {
		case "open_rate":
			t.ControlRate = (float64(t.ControlOpened) / float64(t.ControlDelivered)) * 100
		case "click_rate":
			t.ControlRate = (float64(t.ControlClicked) / float64(t.ControlDelivered)) * 100
		}
	}

	if t.VariantDelivered > 0 {
		switch t.PrimaryMetric {
		case "open_rate":
			t.VariantRate = (float64(t.VariantOpened) / float64(t.VariantDelivered)) * 100
		case "click_rate":
			t.VariantRate = (float64(t.VariantClicked) / float64(t.VariantDelivered)) * 100
		}
	}
}

func (t *TemplateABTest) DetermineWinner(confidenceThreshold float64) {
	t.CalculateRates()

	// Simple winner determination (in production, use proper statistical tests)
	if t.ControlSent < int64(t.MinimumSize) || t.VariantSent < int64(t.MinimumSize) {
		return // Not enough data
	}

	improvement := ((t.VariantRate - t.ControlRate) / t.ControlRate) * 100

	if improvement > 10 && t.Confidence >= confidenceThreshold {
		t.Winner = strPtr("VARIANT")
		t.IsSignificant = true
	} else if improvement < -10 && t.Confidence >= confidenceThreshold {
		t.Winner = strPtr("CONTROL")
		t.IsSignificant = true
	} else {
		t.Winner = strPtr("TIE")
		t.IsSignificant = false
	}
}

func (t *TemplateABTest) GetImprovement() float64 {
	if t.ControlRate == 0 {
		return 0
	}
	return ((t.VariantRate - t.ControlRate) / t.ControlRate) * 100
}

// ============================================================================
// Helper Functions
// ============================================================================

// CreateTest creates a new template test
func CreateTest(
	db *gorm.DB,
	test *TemplateTest,
	userID *uuid.UUID,
) error {
	test.CreatedBy = userID
	test.Status = TestStatusPending
	test.TestNumber = generateTestNumber()

	return db.Create(test).Error
}

// RunValidation runs validation on a template
func RunValidation(db *gorm.DB, templateID uuid.UUID) ([]TemplateValidation, error) {
	var template Template
	if err := db.First(&template, templateID).Error; err != nil {
		return nil, err
	}

	validations := []TemplateValidation{}

	// Check required fields
	if template.Body == "" {
		validations = append(validations, TemplateValidation{
			TemplateID: templateID,
			Type:       ValidationTypeRequired,
			Severity:   ValidationSeverityError,
			Field:      "body",
			Message:    "Template body is required",
		})
	}

	// Check subject for email templates
	if template.Type == TemplateTypeEmail && template.Subject == nil {
		validations = append(validations, TemplateValidation{
			TemplateID: templateID,
			Type:       ValidationTypeRequired,
			Severity:   ValidationSeverityError,
			Field:      "subject",
			Message:    "Email subject is required",
		})
	}

	// Check length for SMS
	if template.Type == TemplateTypeSMS && len(template.Body) > 160 {
		validations = append(validations, TemplateValidation{
			TemplateID: templateID,
			Type:       ValidationTypeLength,
			Severity:   ValidationSeverityWarning,
			Field:      "body",
			Message:    fmt.Sprintf("SMS body is %d characters, consider splitting", len(template.Body)),
			Suggestion: strPtr("Keep SMS messages under 160 characters"),
		})
	}

	// Check for spam words
	spamWords := []string{"FREE", "WIN", "CLICK HERE", "LIMITED TIME"}
	for _, word := range spamWords {
		if containsWord(template.Body, word) {
			validations = append(validations, TemplateValidation{
				TemplateID: templateID,
				Type:       ValidationTypeSpamCheck,
				Severity:   ValidationSeverityWarning,
				Field:      "body",
				Message:    fmt.Sprintf("Contains potential spam word: %s", word),
				Suggestion: strPtr("Avoid spam trigger words to improve deliverability"),
			})
		}
	}

	// Save validations
	for i := range validations {
		db.Create(&validations[i])
	}

	return validations, nil
}

func containsWord(text, word string) bool {
	return fmt.Sprintf(" %s ", text) != text && 
		   fmt.Sprintf(" %s ", word) == word
}

// TestRender tests template rendering
func TestRender(
	db *gorm.DB,
	templateID uuid.UUID,
	testData map[string]interface{},
	userID *uuid.UUID,
) (*TemplateTest, error) {
	var template Template
	if err := db.First(&template, templateID).Error; err != nil {
		return nil, err
	}

	test := &TemplateTest{
		TemplateID: templateID,
		Type:       TestTypeRender,
		Name:       "Render Test",
		Status:     TestStatusRunning,
		SampleData: testData,
		CreatedBy:  userID,
	}

	startTime := time.Now()
	now := time.Now()
	test.StartedAt = &now

	// Try rendering
	rendered, err := template.Render(testData)
	
	endTime := time.Now()
	duration := int(endTime.Sub(startTime).Milliseconds())
	test.Duration = &duration
	test.CompletedAt = &endTime

	if err != nil {
		test.Status = TestStatusFailed
		test.Passed = false
		test.Errors = JSONB{
			"render_error": err.Error(),
		}
	} else {
		test.Status = TestStatusPassed
		test.Passed = true
		test.Score = 100
		test.Results = JSONB{
			"rendered": rendered,
		}
	}

	db.Create(test)

	return test, nil
}

// CreateABTest creates an A/B test
func CreateABTest(
	db *gorm.DB,
	abTest *TemplateABTest,
	userID *uuid.UUID,
) error {
	abTest.CreatedBy = userID
	abTest.Status = ABTestStatusDraft
	abTest.TestNumber = generateABTestNumber()

	// Validate split
	if abTest.ControlSplit+abTest.VariantSplit != 100 {
		return fmt.Errorf("traffic split must total 100%%")
	}

	return db.Create(abTest).Error
}

// StartABTest starts an A/B test
func StartABTest(db *gorm.DB, testID uuid.UUID, userID *uuid.UUID) error {
	var test TemplateABTest
	if err := db.First(&test, testID).Error; err != nil {
		return err
	}

	if test.Status != ABTestStatusDraft {
		return fmt.Errorf("test must be in draft status")
	}

	now := time.Now()
	test.Status = ABTestStatusActive
	test.StartDate = &now
	test.UpdatedBy = userID

	return db.Save(&test).Error
}

// UpdateABTestResults updates A/B test results
func UpdateABTestResults(
	db *gorm.DB,
	testID uuid.UUID,
	variant string, // "control" or "variant"
	sent, delivered, opened, clicked int64,
) error {
	var test TemplateABTest
	if err := db.First(&test, testID).Error; err != nil {
		return err
	}

	if variant == "control" {
		test.ControlSent = sent
		test.ControlDelivered = delivered
		test.ControlOpened = opened
		test.ControlClicked = clicked
	} else {
		test.VariantSent = sent
		test.VariantDelivered = delivered
		test.VariantOpened = opened
		test.VariantClicked = clicked
	}

	test.CalculateRates()

	// Check if test should complete
	if test.ControlSent >= int64(test.MinimumSize) && 
	   test.VariantSent >= int64(test.MinimumSize) {
		test.DetermineWinner(95.0) // 95% confidence

		if test.Winner != nil {
			test.Status = ABTestStatusCompleted
			now := time.Now()
			test.CompletedAt = &now
		}
	}

	return db.Save(&test).Error
}

// GetActiveABTests gets active A/B tests
func GetActiveABTests(db *gorm.DB) ([]TemplateABTest, error) {
	var tests []TemplateABTest
	err := db.Where("status = ?", ABTestStatusActive).
		Preload("ControlTemplate").
		Preload("VariantTemplate").
		Find(&tests).Error

	return tests, err
}

// SelectABTestVariant selects which variant to use
func SelectABTestVariant(test *TemplateABTest) (uuid.UUID, string) {
	// Simple random selection based on split
	// In production, use proper randomization
	random := time.Now().UnixNano() % 100

	if random < int64(test.ControlSplit) {
		return test.ControlTemplateID, "control"
	}
	return test.VariantTemplateID, "variant"
}

// GetTestResults gets test results for a template
func GetTestResults(db *gorm.DB, templateID uuid.UUID) ([]TemplateTest, error) {
	var tests []TemplateTest
	err := db.Where("template_id = ?", templateID).
		Order("created_at DESC").
		Find(&tests).Error

	return tests, err
}

// GetValidationIssues gets validation issues for a template
func GetValidationIssues(
	db *gorm.DB,
	templateID uuid.UUID,
	severity *ValidationSeverity,
) ([]TemplateValidation, error) {
	query := db.Where("template_id = ? AND is_resolved = ?", templateID, false)

	if severity != nil {
		query = query.Where("severity = ?", severity)
	}

	var validations []TemplateValidation
	err := query.Order("severity ASC, created_at DESC").Find(&validations).Error

	return validations, err
}

// ResolveValidation resolves a validation issue
func ResolveValidation(db *gorm.DB, validationID uuid.UUID) error {
	now := time.Now()
	return db.Model(&TemplateValidation{}).
		Where("_id = ?", validationID).
		Updates(map[string]interface{}{
			"is_resolved": true,
			"resolved_at": now,
		}).Error
}

func generateTestNumber() string {
	now := time.Now()
	return fmt.Sprintf("TST-%s-%05d", 
		now.Format("20060102"), 
		now.Unix()%100000)
}

func generateABTestNumber() string {
	now := time.Now()
	return fmt.Sprintf("ABT-%s-%05d", 
		now.Format("20060102"), 
		now.Unix()%100000)
}
