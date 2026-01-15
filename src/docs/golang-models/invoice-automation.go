package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ============================================================================
// RECURRING INVOICE - Recurring Invoice Templates
// ============================================================================
// Purpose: Automate recurring invoice generation (subscriptions, retainers)
// Table: recurring_invoices
// Primary Key: _id (UUID)
// Features: Flexible schedules, Auto-generation, End conditions
// ============================================================================

type RecurringFrequency string

const (
	RecurringFrequencyDaily     RecurringFrequency = "DAILY"
	RecurringFrequencyWeekly    RecurringFrequency = "WEEKLY"
	RecurringFrequencyBiweekly  RecurringFrequency = "BIWEEKLY"
	RecurringFrequencyMonthly   RecurringFrequency = "MONTHLY"
	RecurringFrequencyQuarterly RecurringFrequency = "QUARTERLY"
	RecurringFrequencyYearly    RecurringFrequency = "YEARLY"
)

type RecurringStatus string

const (
	RecurringStatusActive    RecurringStatus = "ACTIVE"
	RecurringStatusPaused    RecurringStatus = "PAUSED"
	RecurringStatusCompleted RecurringStatus = "COMPLETED"
	RecurringStatusCanceled  RecurringStatus = "CANCELED"
)

type RecurringInvoice struct {
	// Identity (3 fields)
	ID             uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID       *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`
	CustomerID     uuid.UUID  `gorm:"column:customer_id;type:uuid;not null;index" json:"customer_id"`

	// Recurring Info (4 fields)
	Name        string             `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string            `gorm:"column:description;type:text" json:"description,omitempty"`
	Frequency   RecurringFrequency `gorm:"column:frequency;type:varchar(20);not null" json:"frequency"`
	Status      RecurringStatus    `gorm:"column:status;type:varchar(20);not null;index" json:"status"`

	// Invoice Template (6 fields)
	InvoiceTitle   *string       `gorm:"column:invoice_title;type:varchar(255)" json:"invoice_title,omitempty"`
	PaymentTerms   PaymentTerms  `gorm:"column:payment_terms;type:varchar(20);not null" json:"payment_terms"`
	Subtotal       float64       `gorm:"column:subtotal;type:decimal(15,2);not null" json:"subtotal"`
	TaxAmount      float64       `gorm:"column:tax_amount;type:decimal(15,2);default:0" json:"tax_amount"`
	TotalAmount    float64       `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`
	Currency       string        `gorm:"column:currency;type:varchar(3);default:'USD'" json:"currency"`

	// Schedule (5 fields)
	StartDate      time.Time  `gorm:"column:start_date;not null" json:"start_date"`
	EndDate        *time.Time `gorm:"column:end_date" json:"end_date,omitempty"`
	NextInvoiceDate time.Time `gorm:"column:next_invoice_date;not null;index" json:"next_invoice_date"`
	LastInvoiceDate *time.Time `gorm:"column:last_invoice_date" json:"last_invoice_date,omitempty"`
	MaxOccurrences *int       `gorm:"column:max_occurrences" json:"max_occurrences,omitempty"` // Null = unlimited

	// Counters (2 fields)
	InvoicesGenerated int `gorm:"column:invoices_generated;default:0" json:"invoices_generated"`
	TotalRevenue      float64 `gorm:"column:total_revenue;type:decimal(20,2);default:0" json:"total_revenue"`

	// Automation (3 fields)
	AutoSend         bool `gorm:"column:auto_send;default:false" json:"auto_send"` // Auto-send when generated
	SendDaysBefore   int  `gorm:"column:send_days_before;default:0" json:"send_days_before"` // Send X days before due
	AutoReminders    bool `gorm:"column:auto_reminders;default:true" json:"auto_reminders"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete & Version (3 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
	Version   int64      `gorm:"column:version;default:1" json:"version"`

	// Relationships
	LineItems []RecurringInvoiceLineItem `gorm:"foreignKey:RecurringInvoiceID" json:"line_items,omitempty"`
	Invoices  []Invoice                  `gorm:"foreignKey:SubscriptionID" json:"invoices,omitempty"` // Generated invoices
}

func (RecurringInvoice) TableName() string {
	return "recurring_invoices"
}

// Helper Methods
func (ri *RecurringInvoice) IsActive() bool {
	return ri.Status == RecurringStatusActive
}

func (ri *RecurringInvoice) ShouldGenerateInvoice() bool {
	if !ri.IsActive() {
		return false
	}

	// Check if we've reached max occurrences
	if ri.MaxOccurrences != nil && ri.InvoicesGenerated >= *ri.MaxOccurrences {
		return false
	}

	// Check if we've passed end date
	if ri.EndDate != nil && time.Now().After(*ri.EndDate) {
		return false
	}

	// Check if it's time to generate
	return time.Now().After(ri.NextInvoiceDate) || time.Now().Equal(ri.NextInvoiceDate)
}

func (ri *RecurringInvoice) CalculateNextInvoiceDate() time.Time {
	baseDate := ri.NextInvoiceDate

	switch ri.Frequency {
	case RecurringFrequencyDaily:
		return baseDate.AddDate(0, 0, 1)
	case RecurringFrequencyWeekly:
		return baseDate.AddDate(0, 0, 7)
	case RecurringFrequencyBiweekly:
		return baseDate.AddDate(0, 0, 14)
	case RecurringFrequencyMonthly:
		return baseDate.AddDate(0, 1, 0)
	case RecurringFrequencyQuarterly:
		return baseDate.AddDate(0, 3, 0)
	case RecurringFrequencyYearly:
		return baseDate.AddDate(1, 0, 0)
	default:
		return baseDate.AddDate(0, 1, 0)
	}
}

func (ri *RecurringInvoice) Pause() {
	ri.Status = RecurringStatusPaused
}

func (ri *RecurringInvoice) Resume() {
	ri.Status = RecurringStatusActive
}

func (ri *RecurringInvoice) Cancel() {
	ri.Status = RecurringStatusCanceled
}

func (ri *RecurringInvoice) Complete() {
	ri.Status = RecurringStatusCompleted
}

// ============================================================================
// RECURRING INVOICE LINE ITEM - Template Line Items
// ============================================================================

type RecurringInvoiceLineItem struct {
	// Identity (2 fields)
	ID                 uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	RecurringInvoiceID uuid.UUID `gorm:"column:recurring_invoice_id;type:uuid;not null;index" json:"recurring_invoice_id"`

	// Item Info (5 fields)
	ProductID   *uuid.UUID `gorm:"column:product_id;type:uuid" json:"product_id,omitempty"`
	Name        string     `gorm:"column:name;type:varchar(255);not null" json:"name"`
	Description *string    `gorm:"column:description;type:text" json:"description,omitempty"`
	Quantity    float64    `gorm:"column:quantity;type:decimal(10,2);not null" json:"quantity"`
	UnitType    *string    `gorm:"column:unit_type;type:varchar(20)" json:"unit_type,omitempty"`

	// Pricing (4 fields)
	UnitPrice   float64 `gorm:"column:unit_price;type:decimal(15,2);not null" json:"unit_price"`
	Subtotal    float64 `gorm:"column:subtotal;type:decimal(15,2);not null" json:"subtotal"`
	TaxRate     float64 `gorm:"column:tax_rate;type:decimal(5,2);default:0" json:"tax_rate"`
	TaxAmount   float64 `gorm:"column:tax_amount;type:decimal(15,2);default:0" json:"tax_amount"`
	TotalAmount float64 `gorm:"column:total_amount;type:decimal(15,2);not null" json:"total_amount"`

	// Ordering (1 field)
	DisplayOrder int `gorm:"column:display_order;default:0" json:"display_order"`

	// Audit (2 fields)
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`

	// Relationship
	RecurringInvoice *RecurringInvoice `gorm:"foreignKey:RecurringInvoiceID" json:"recurring_invoice,omitempty"`
}

func (RecurringInvoiceLineItem) TableName() string {
	return "recurring_invoice_line_items"
}

func (item *RecurringInvoiceLineItem) CalculateTotal() {
	item.Subtotal = item.Quantity * item.UnitPrice
	item.TaxAmount = item.Subtotal * (item.TaxRate / 100)
	item.TotalAmount = item.Subtotal + item.TaxAmount
}

// ============================================================================
// INVOICE REMINDER - Payment Reminders
// ============================================================================

type ReminderType string

const (
	ReminderTypeBeforeDue ReminderType = "BEFORE_DUE"
	ReminderTypeOnDue     ReminderType = "ON_DUE"
	ReminderTypeOverdue   ReminderType = "OVERDUE"
)

type ReminderStatus string

const (
	ReminderStatusPending   ReminderStatus = "PENDING"
	ReminderStatusSent      ReminderStatus = "SENT"
	ReminderStatusFailed    ReminderStatus = "FAILED"
	ReminderStatusCanceled  ReminderStatus = "CANCELED"
)

type InvoiceReminder struct {
	// Identity (2 fields)
	ID        uuid.UUID `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	InvoiceID uuid.UUID `gorm:"column:invoice_id;type:uuid;not null;index" json:"invoice_id"`

	// Reminder Info (4 fields)
	Type          ReminderType   `gorm:"column:type;type:varchar(20);not null" json:"type"`
	Status        ReminderStatus `gorm:"column:status;type:varchar(20);not null;index" json:"status"`
	Subject       string         `gorm:"column:subject;type:varchar(255);not null" json:"subject"`
	Message       string         `gorm:"column:message;type:text;not null" json:"message"`

	// Schedule (3 fields)
	ScheduledFor time.Time  `gorm:"column:scheduled_for;not null;index" json:"scheduled_for"`
	SentAt       *time.Time `gorm:"column:sent_at" json:"sent_at,omitempty"`
	FailedAt     *time.Time `gorm:"column:failed_at" json:"failed_at,omitempty"`

	// Delivery (2 fields)
	RecipientEmail *string `gorm:"column:recipient_email;type:varchar(255)" json:"recipient_email,omitempty"`
	ErrorMessage   *string `gorm:"column:error_message;type:text" json:"error_message,omitempty"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (2 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`

	// Relationship
	Invoice *Invoice `gorm:"foreignKey:InvoiceID" json:"invoice,omitempty"`
}

func (InvoiceReminder) TableName() string {
	return "invoice_reminders"
}

func (ir *InvoiceReminder) MarkAsSent() {
	now := time.Now()
	ir.Status = ReminderStatusSent
	ir.SentAt = &now
}

func (ir *InvoiceReminder) MarkAsFailed(errorMessage string) {
	now := time.Now()
	ir.Status = ReminderStatusFailed
	ir.FailedAt = &now
	ir.ErrorMessage = &errorMessage
}

// ============================================================================
// REMINDER SCHEDULE - Reminder Schedule Templates
// ============================================================================

type ReminderSchedule struct {
	// Identity (2 fields)
	ID       uuid.UUID  `gorm:"column:_id;type:uuid;primaryKey;default:gen_random_uuid()" json:"_id"`
	TenantID *uuid.UUID `gorm:"column:tenant_id;type:uuid;index" json:"tenant_id,omitempty"`

	// Schedule Info (4 fields)
	Name        string       `gorm:"column:name;type:varchar(100);not null" json:"name"`
	Description *string      `gorm:"column:description;type:text" json:"description,omitempty"`
	Type        ReminderType `gorm:"column:type;type:varchar(20);not null" json:"type"`
	DaysBefore  *int         `gorm:"column:days_before" json:"days_before,omitempty"` // For BEFORE_DUE type
	DaysAfter   *int         `gorm:"column:days_after" json:"days_after,omitempty"`   // For OVERDUE type

	// Email Template (2 fields)
	EmailSubject  string `gorm:"column:email_subject;type:varchar(255);not null" json:"email_subject"`
	EmailTemplate string `gorm:"column:email_template;type:text;not null" json:"email_template"`

	// Status (2 fields)
	IsActive  bool `gorm:"column:is_active;default:true" json:"is_active"`
	IsDefault bool `gorm:"column:is_default;default:false" json:"is_default"`

	// Metadata (1 field)
	Metadata JSONB `gorm:"column:metadata;type:jsonb" json:"metadata,omitempty"`

	// Audit (4 fields)
	CreatedAt time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
	CreatedBy *uuid.UUID `gorm:"column:created_by;type:uuid" json:"created_by,omitempty"`
	UpdatedBy *uuid.UUID `gorm:"column:updated_by;type:uuid" json:"updated_by,omitempty"`

	// Soft Delete (2 fields)
	DeletedAt *time.Time `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	DeletedBy *uuid.UUID `gorm:"column:deleted_by;type:uuid" json:"deleted_by,omitempty"`
}

func (ReminderSchedule) TableName() string {
	return "reminder_schedules"
}

// ============================================================================
// Helper Functions
// ============================================================================

// GenerateRecurringInvoices generates invoices from recurring templates
func GenerateRecurringInvoices(db *gorm.DB) error {
	var recurringInvoices []RecurringInvoice
	
	err := db.Where("status = ? AND next_invoice_date <= ?", 
		RecurringStatusActive, time.Now()).
		Preload("LineItems").
		Find(&recurringInvoices).Error
	
	if err != nil {
		return err
	}

	for _, recurring := range recurringInvoices {
		if !recurring.ShouldGenerateInvoice() {
			continue
		}

		// Generate invoice
		if err := generateInvoiceFromRecurring(db, &recurring); err != nil {
			// Log error but continue with others
			fmt.Printf("Error generating invoice for recurring %s: %v\n", recurring.ID, err)
			continue
		}
	}

	return nil
}

func generateInvoiceFromRecurring(db *gorm.DB, recurring *RecurringInvoice) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// Create invoice
		invoiceDate := time.Now()
		dueDate := calculateDueDate(invoiceDate, recurring.PaymentTerms)

		invoice := &Invoice{
			TenantID:       recurring.TenantID,
			CustomerID:     recurring.CustomerID,
			SubscriptionID: &recurring.ID,
			Type:           InvoiceTypeRecurring,
			Status:         InvoiceStatusDraft,
			Title:          recurring.InvoiceTitle,
			InvoiceDate:    invoiceDate,
			DueDate:        dueDate,
			PaymentTerms:   recurring.PaymentTerms,
			Subtotal:       recurring.Subtotal,
			TaxAmount:      recurring.TaxAmount,
			TotalAmount:    recurring.TotalAmount,
			Currency:       recurring.Currency,
		}

		if err := tx.Create(invoice).Error; err != nil {
			return err
		}

		// Create line items
		for _, recurringItem := range recurring.LineItems {
			item := &InvoiceLineItem{
				InvoiceID:    invoice.ID,
				ProductID:    recurringItem.ProductID,
				Name:         recurringItem.Name,
				Description:  recurringItem.Description,
				Quantity:     recurringItem.Quantity,
				UnitType:     recurringItem.UnitType,
				UnitPrice:    recurringItem.UnitPrice,
				Subtotal:     recurringItem.Subtotal,
				TaxRate:      recurringItem.TaxRate,
				TaxAmount:    recurringItem.TaxAmount,
				TotalAmount:  recurringItem.TotalAmount,
				DisplayOrder: recurringItem.DisplayOrder,
			}

			if err := tx.Create(item).Error; err != nil {
				return err
			}
		}

		// Update recurring invoice
		now := time.Now()
		recurring.LastInvoiceDate = &now
		recurring.NextInvoiceDate = recurring.CalculateNextInvoiceDate()
		recurring.InvoicesGenerated++
		recurring.TotalRevenue += recurring.TotalAmount

		// Check if should complete
		if recurring.MaxOccurrences != nil && 
			recurring.InvoicesGenerated >= *recurring.MaxOccurrences {
			recurring.Complete()
		}

		if recurring.EndDate != nil && time.Now().After(*recurring.EndDate) {
			recurring.Complete()
		}

		if err := tx.Save(recurring).Error; err != nil {
			return err
		}

		// Auto-send if enabled
		if recurring.AutoSend {
			invoice.MarkAsSent()
			if err := tx.Save(invoice).Error; err != nil {
				return err
			}
			// TODO: Send email
		}

		return nil
	})
}

// CreateInvoiceReminders creates reminders for invoices
func CreateInvoiceReminders(db *gorm.DB) error {
	// Get active invoices without reminders sent today
	var invoices []Invoice
	
	err := db.Where("status IN ? AND deleted_at IS NULL", 
		[]InvoiceStatus{InvoiceStatusSent, InvoiceStatusViewed, InvoiceStatusPartiallyPaid, InvoiceStatusOverdue}).
		Find(&invoices).Error
	
	if err != nil {
		return err
	}

	// Get reminder schedules
	var schedules []ReminderSchedule
	if err := db.Where("is_active = ?", true).Find(&schedules).Error; err != nil {
		return err
	}

	for _, invoice := range invoices {
		for _, schedule := range schedules {
			shouldCreate := false
			scheduledFor := time.Now()

			switch schedule.Type {
			case ReminderTypeBeforeDue:
				if schedule.DaysBefore != nil {
					reminderDate := invoice.DueDate.AddDate(0, 0, -*schedule.DaysBefore)
					if time.Now().Format("2006-01-02") == reminderDate.Format("2006-01-02") {
						shouldCreate = true
						scheduledFor = reminderDate
					}
				}

			case ReminderTypeOnDue:
				if time.Now().Format("2006-01-02") == invoice.DueDate.Format("2006-01-02") {
					shouldCreate = true
					scheduledFor = invoice.DueDate
				}

			case ReminderTypeOverdue:
				if invoice.IsOverdue() && schedule.DaysAfter != nil {
					reminderDate := invoice.DueDate.AddDate(0, 0, *schedule.DaysAfter)
					if time.Now().Format("2006-01-02") == reminderDate.Format("2006-01-02") {
						shouldCreate = true
						scheduledFor = reminderDate
					}
				}
			}

			if shouldCreate {
				// Check if reminder already exists
				var existingReminder InvoiceReminder
				err := db.Where("invoice_id = ? AND type = ? AND DATE(scheduled_for) = ?",
					invoice.ID, schedule.Type, scheduledFor.Format("2006-01-02")).
					First(&existingReminder).Error

				if err == gorm.ErrRecordNotFound {
					// Create reminder
					reminder := &InvoiceReminder{
						InvoiceID:    invoice.ID,
						Type:         schedule.Type,
						Status:       ReminderStatusPending,
						Subject:      schedule.EmailSubject,
						Message:      schedule.EmailTemplate,
						ScheduledFor: scheduledFor,
					}

					if err := db.Create(reminder).Error; err != nil {
						fmt.Printf("Error creating reminder for invoice %s: %v\n", invoice.InvoiceNumber, err)
					}
				}
			}
		}
	}

	return nil
}

// SendPendingReminders sends all pending reminders
func SendPendingReminders(db *gorm.DB) error {
	var reminders []InvoiceReminder
	
	err := db.Where("status = ? AND scheduled_for <= ?", 
		ReminderStatusPending, time.Now()).
		Preload("Invoice").
		Find(&reminders).Error
	
	if err != nil {
		return err
	}

	for _, reminder := range reminders {
		// TODO: Send email via email service
		// For now, just mark as sent
		reminder.MarkAsSent()
		if err := db.Save(&reminder).Error; err != nil {
			fmt.Printf("Error updating reminder %s: %v\n", reminder.ID, err)
		}

		// Update invoice
		if reminder.Invoice != nil {
			now := time.Now()
			reminder.Invoice.LastReminderAt = &now
			db.Save(reminder.Invoice)
		}
	}

	return nil
}

// UpdateOverdueInvoices updates invoice statuses for overdue invoices
func UpdateOverdueInvoices(db *gorm.DB) error {
	return db.Model(&Invoice{}).
		Where("status IN ? AND due_date < ? AND deleted_at IS NULL",
			[]InvoiceStatus{InvoiceStatusSent, InvoiceStatusViewed, InvoiceStatusPartiallyPaid},
			time.Now()).
		Update("status", InvoiceStatusOverdue).Error
}
