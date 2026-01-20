package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type TenantSubscription struct {
	ID                    string          `json:"_id" db:"_id"`
	TenantID              string          `json:"tenant_id" db:"tenant_id"`
	PlanID                *string         `json:"plan_id,omitempty" db:"plan_id"`
	OrderID               *string         `json:"order_id,omitempty" db:"order_id"`
	SubscriptionNumber    string          `json:"subscription_number" db:"subscription_number"`
	SubscriptionName      string          `json:"subscription_name" db:"subscription_name"`
	StartDate             time.Time       `json:"start_date" db:"start_date"`
	EndDate               time.Time       `json:"end_date" db:"end_date"`
	TrialEndDate          *time.Time      `json:"trial_end_date,omitempty" db:"trial_end_date"`
	RenewalDate           *time.Time      `json:"renewal_date,omitempty" db:"renewal_date"`
	Status                string          `json:"status" db:"status"`
	AutoRenew             bool            `json:"auto_renew" db:"auto_renew"`
	IsTrial               bool            `json:"is_trial" db:"is_trial"`
	PlanName              *string         `json:"plan_name,omitempty" db:"plan_name"`
	BillingCycle          string          `json:"billing_cycle" db:"billing_cycle"`
	BasePrice             float64         `json:"base_price" db:"base_price"`
	DiscountAmount        float64         `json:"discount_amount" db:"discount_amount"`
	TaxAmount             float64         `json:"tax_amount" db:"tax_amount"`
	TotalAmount           float64         `json:"total_amount" db:"total_amount"`
	Currency              string          `json:"currency" db:"currency"`
	MaxUsers              int             `json:"max_users" db:"max_users"`
	CurrentUsers          int             `json:"current_users" db:"current_users"`
	MaxStorageGB          int             `json:"max_storage_gb" db:"max_storage_gb"`
	CurrentStorageGB      float64         `json:"current_storage_gb" db:"current_storage_gb"`
	Features              JSONB           `json:"features" db:"features"`
	Limits                JSONB           `json:"limits" db:"limits"`
	PaymentMethod         *string         `json:"payment_method,omitempty" db:"payment_method"`
	PaymentStatus         string          `json:"payment_status" db:"payment_status"`
	LastPaymentDate       *time.Time      `json:"last_payment_date,omitempty" db:"last_payment_date"`
	NextPaymentDate       *time.Time      `json:"next_payment_date,omitempty" db:"next_payment_date"`
	BillingContactName    *string         `json:"billing_contact_name,omitempty" db:"billing_contact_name"`
	BillingContactEmail   *string         `json:"billing_contact_email,omitempty" db:"billing_contact_email"`
	BillingContactPhone   *string         `json:"billing_contact_phone,omitempty" db:"billing_contact_phone"`
	Notes                 *string         `json:"notes,omitempty" db:"notes"`
	Metadata              JSONB           `json:"metadata" db:"metadata"`
	Tags                  StringArray     `json:"tags" db:"tags"`
	CreatedAt             time.Time       `json:"created_at" db:"created_at"`
	CreatedBy             *string         `json:"created_by,omitempty" db:"created_by"`
	UpdatedAt             time.Time       `json:"updated_at" db:"updated_at"`
	UpdatedBy             *string         `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt             *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy             *string         `json:"deleted_by,omitempty" db:"deleted_by"`
	Version               int             `json:"version" db:"version"`
}

type CreateTenantSubscriptionRequest struct {
	TenantID            string    `json:"tenant_id" validate:"required,uuid"`
	PlanID              *string   `json:"plan_id,omitempty" validate:"omitempty,uuid"`
	OrderID             *string   `json:"order_id,omitempty" validate:"omitempty,uuid"`
	SubscriptionNumber  string    `json:"subscription_number" validate:"required"`
	SubscriptionName    string    `json:"subscription_name" validate:"required"`
	StartDate           time.Time `json:"start_date" validate:"required"`
	EndDate             time.Time `json:"end_date" validate:"required"`
	TrialEndDate        *time.Time `json:"trial_end_date,omitempty"`
	RenewalDate         *time.Time `json:"renewal_date,omitempty"`
	Status              string    `json:"status" validate:"required,oneof=active trial suspended expired cancelled pending"`
	AutoRenew           bool      `json:"auto_renew"`
	IsTrial             bool      `json:"is_trial"`
	PlanName            *string   `json:"plan_name,omitempty"`
	BillingCycle        string    `json:"billing_cycle" validate:"required,oneof=monthly quarterly yearly custom"`
	BasePrice           float64   `json:"base_price" validate:"min=0"`
	DiscountAmount      float64   `json:"discount_amount,omitempty" validate:"min=0"`
	TaxAmount           float64   `json:"tax_amount,omitempty" validate:"min=0"`
	TotalAmount         float64   `json:"total_amount" validate:"min=0"`
	Currency            string    `json:"currency" validate:"required,len=3"`
	MaxUsers            int       `json:"max_users" validate:"min=1"`
	MaxStorageGB        int       `json:"max_storage_gb" validate:"min=0"`
	Features            JSONB     `json:"features,omitempty"`
	Limits              JSONB     `json:"limits,omitempty"`
	PaymentMethod       *string   `json:"payment_method,omitempty"`
	PaymentStatus       string    `json:"payment_status,omitempty" validate:"omitempty,oneof=paid unpaid partially_paid failed refunded"`
	BillingContactName  *string   `json:"billing_contact_name,omitempty"`
	BillingContactEmail *string   `json:"billing_contact_email,omitempty" validate:"omitempty,email"`
	BillingContactPhone *string   `json:"billing_contact_phone,omitempty"`
	Notes               *string   `json:"notes,omitempty"`
	Metadata            JSONB     `json:"metadata,omitempty"`
	Tags                []string  `json:"tags,omitempty"`
}

type UpdateTenantSubscriptionRequest struct {
	SubscriptionName    *string    `json:"subscription_name,omitempty"`
	StartDate           *time.Time `json:"start_date,omitempty"`
	EndDate             *time.Time `json:"end_date,omitempty"`
	TrialEndDate        *time.Time `json:"trial_end_date,omitempty"`
	RenewalDate         *time.Time `json:"renewal_date,omitempty"`
	Status              *string    `json:"status,omitempty" validate:"omitempty,oneof=active trial suspended expired cancelled pending"`
	AutoRenew           *bool      `json:"auto_renew,omitempty"`
	IsTrial             *bool      `json:"is_trial,omitempty"`
	PlanName            *string    `json:"plan_name,omitempty"`
	BillingCycle        *string    `json:"billing_cycle,omitempty" validate:"omitempty,oneof=monthly quarterly yearly custom"`
	BasePrice           *float64   `json:"base_price,omitempty" validate:"omitempty,min=0"`
	DiscountAmount      *float64   `json:"discount_amount,omitempty" validate:"omitempty,min=0"`
	TaxAmount           *float64   `json:"tax_amount,omitempty" validate:"omitempty,min=0"`
	TotalAmount         *float64   `json:"total_amount,omitempty" validate:"omitempty,min=0"`
	Currency            *string    `json:"currency,omitempty" validate:"omitempty,len=3"`
	MaxUsers            *int       `json:"max_users,omitempty" validate:"omitempty,min=1"`
	CurrentUsers        *int       `json:"current_users,omitempty" validate:"omitempty,min=0"`
	MaxStorageGB        *int       `json:"max_storage_gb,omitempty" validate:"omitempty,min=0"`
	CurrentStorageGB    *float64   `json:"current_storage_gb,omitempty" validate:"omitempty,min=0"`
	Features            JSONB      `json:"features,omitempty"`
	Limits              JSONB      `json:"limits,omitempty"`
	PaymentMethod       *string    `json:"payment_method,omitempty"`
	PaymentStatus       *string    `json:"payment_status,omitempty" validate:"omitempty,oneof=paid unpaid partially_paid failed refunded"`
	LastPaymentDate     *time.Time `json:"last_payment_date,omitempty"`
	NextPaymentDate     *time.Time `json:"next_payment_date,omitempty"`
	BillingContactName  *string    `json:"billing_contact_name,omitempty"`
	BillingContactEmail *string    `json:"billing_contact_email,omitempty" validate:"omitempty,email"`
	BillingContactPhone *string    `json:"billing_contact_phone,omitempty"`
	Notes               *string    `json:"notes,omitempty"`
	Metadata            JSONB      `json:"metadata,omitempty"`
	Tags                []string   `json:"tags,omitempty"`
}

// StringArray for PostgreSQL text[] type
type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = []string{}
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, a)
	case string:
		return json.Unmarshal([]byte(v), a)
	default:
		return nil
	}
}

func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return "{}", nil
	}
	return json.Marshal(a)
}
