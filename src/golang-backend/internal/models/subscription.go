package models

import (
	"github.com/google/uuid"
)

// TenantSubscription represents tenant subscription
type TenantSubscription struct {
	BaseModel
	TenantID            uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	ProductID           uuid.UUID  `json:"product_id" db:"product_id"`
	PlanID              uuid.UUID  `json:"plan_id" db:"plan_id"`
	Status              string     `json:"status" db:"status"`
	BillingCycle        string     `json:"billing_cycle" db:"billing_cycle"`
	CurrentPeriodStart  string     `json:"current_period_start" db:"current_period_start"`
	CurrentPeriodEnd    string     `json:"current_period_end" db:"current_period_end"`
	TrialStart          *string    `json:"trial_start,omitempty" db:"trial_start"`
	TrialEnd            *string    `json:"trial_end,omitempty" db:"trial_end"`
	CancelledAt         *string    `json:"cancelled_at,omitempty" db:"cancelled_at"`
	CancellationReason  *string    `json:"cancellation_reason,omitempty" db:"cancellation_reason"`
	AutoRenew           bool       `json:"auto_renew" db:"auto_renew"`
	Quantity            int        `json:"quantity" db:"quantity"`
	UnitPrice           float64    `json:"unit_price" db:"unit_price"`
	Currency            string     `json:"currency" db:"currency"`
	Discount            float64    `json:"discount" db:"discount"`
	TotalAmount         float64    `json:"total_amount" db:"total_amount"`
	PaymentMethod       *string    `json:"payment_method,omitempty" db:"payment_method"`
	BillingEmail        *string    `json:"billing_email,omitempty" db:"billing_email"`
	NextBillingDate     *string    `json:"next_billing_date,omitempty" db:"next_billing_date"`
	Metadata            *string    `json:"metadata,omitempty" db:"metadata"`
}

// SaaSProduct represents a SaaS product
type SaaSProduct struct {
	BaseModel
	Code        string  `json:"code" db:"code"`
	Name        string  `json:"name" db:"name"`
	Description *string `json:"description,omitempty" db:"description"`
	Category    string  `json:"category" db:"category"`
	IsActive    bool    `json:"is_active" db:"is_active"`
	IconURL     *string `json:"icon_url,omitempty" db:"icon_url"`
	Features    *string `json:"features,omitempty" db:"features"`
	Metadata    *string `json:"metadata,omitempty" db:"metadata"`
}

// ServicePackage represents subscription plan
type ServicePackage struct {
	BaseModel
	ProductID           uuid.UUID `json:"product_id" db:"product_id"`
	Code                string    `json:"code" db:"code"`
	Name                string    `json:"name" db:"name"`
	Description         *string   `json:"description,omitempty" db:"description"`
	BillingCycle        string    `json:"billing_cycle" db:"billing_cycle"`
	Price               float64   `json:"price" db:"price"`
	Currency            string    `json:"currency" db:"currency"`
	TrialDays           int       `json:"trial_days" db:"trial_days"`
	Features            *string   `json:"features,omitempty" db:"features"`
	Limits              *string   `json:"limits,omitempty" db:"limits"`
	IsActive            bool      `json:"is_active" db:"is_active"`
	IsPopular           bool      `json:"is_popular" db:"is_popular"`
	DisplayOrder        int       `json:"display_order" db:"display_order"`
	Metadata            *string   `json:"metadata,omitempty" db:"metadata"`
}

// SubscriptionOrder represents subscription order
type SubscriptionOrder struct {
	BaseModel
	TenantID         uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	SubscriptionID   *uuid.UUID `json:"subscription_id,omitempty" db:"subscription_id"`
	OrderNumber      string     `json:"order_number" db:"order_number"`
	Status           string     `json:"status" db:"status"`
	TotalAmount      float64    `json:"total_amount" db:"total_amount"`
	Currency         string     `json:"currency" db:"currency"`
	PaymentMethod    string     `json:"payment_method" db:"payment_method"`
	PaymentStatus    string     `json:"payment_status" db:"payment_status"`
	PaidAt           *string    `json:"paid_at,omitempty" db:"paid_at"`
	BillingEmail     string     `json:"billing_email" db:"billing_email"`
	BillingAddress   *string    `json:"billing_address,omitempty" db:"billing_address"`
	TaxAmount        float64    `json:"tax_amount" db:"tax_amount"`
	DiscountAmount   float64    `json:"discount_amount" db:"discount_amount"`
	Metadata         *string    `json:"metadata,omitempty" db:"metadata"`
}

// SubscriptionInvoice represents invoice
type SubscriptionInvoice struct {
	BaseModel
	TenantID         uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	SubscriptionID   uuid.UUID  `json:"subscription_id" db:"subscription_id"`
	InvoiceNumber    string     `json:"invoice_number" db:"invoice_number"`
	Status           string     `json:"status" db:"status"`
	IssueDate        string     `json:"issue_date" db:"issue_date"`
	DueDate          string     `json:"due_date" db:"due_date"`
	PaidDate         *string    `json:"paid_date,omitempty" db:"paid_date"`
	Amount           float64    `json:"amount" db:"amount"`
	TaxAmount        float64    `json:"tax_amount" db:"tax_amount"`
	TotalAmount      float64    `json:"total_amount" db:"total_amount"`
	Currency         string     `json:"currency" db:"currency"`
	PaymentMethod    *string    `json:"payment_method,omitempty" db:"payment_method"`
	BillingPeriod    string     `json:"billing_period" db:"billing_period"`
	LineItems        *string    `json:"line_items,omitempty" db:"line_items"`
	Notes            *string    `json:"notes,omitempty" db:"notes"`
	Metadata         *string    `json:"metadata,omitempty" db:"metadata"`
}

// APIKey represents API key for authentication
type APIKey struct {
	BaseModel
	TenantID     uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	Name         string     `json:"name" db:"name"`
	KeyPrefix    string     `json:"key_prefix" db:"key_prefix"`
	KeyHash      string     `json:"-" db:"key_hash"`
	Scopes       string     `json:"scopes" db:"scopes"`
	AllowedIPs   *string    `json:"allowed_ips,omitempty" db:"allowed_ips"`
	ExpiresAt    *string    `json:"expires_at,omitempty" db:"expires_at"`
	LastUsedAt   *string    `json:"last_used_at,omitempty" db:"last_used_at"`
}

// NewAPIKey creates a new APIKey
func NewAPIKey(tenantID uuid.UUID, name, keyPrefix, keyHash string) *APIKey {
	return &APIKey{
		BaseModel: NewBaseModel(),
		TenantID:  tenantID,
		Name:      name,
		KeyPrefix: keyPrefix,
		KeyHash:   keyHash,
	}
}

// ServiceAccount represents service account
type ServiceAccount struct {
	BaseModel
	TenantID    uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	MemberID    uuid.UUID  `json:"member_id" db:"member_id"`
	Name        string     `json:"name" db:"name"`
	Description *string    `json:"description,omitempty" db:"description"`
	Status      string     `json:"status" db:"status"`
	IsActive    bool       `json:"is_active" db:"is_active"`
	Scopes      *string    `json:"scopes,omitempty" db:"scopes"`
	Metadata    *string    `json:"metadata,omitempty" db:"metadata"`
}

// FeatureFlag represents feature flag
type FeatureFlag struct {
	ID                 uuid.UUID `json:"id" db:"id"`
	FlagKey            string    `json:"flag_key" db:"flag_key"`
	FlagName           string    `json:"flag_name" db:"flag_name"`
	Description        *string   `json:"description,omitempty" db:"description"`
	IsEnabled          bool      `json:"is_enabled" db:"is_enabled"`
	Environment        string    `json:"environment" db:"environment"`
	FlagType           string    `json:"flag_type" db:"flag_type"`
	TargetAudience     *string   `json:"target_audience,omitempty" db:"target_audience"`
	PercentageRollout  int       `json:"percentage_rollout" db:"percentage_rollout"`
	Conditions         *string   `json:"conditions,omitempty" db:"conditions"`
	Metadata           *string   `json:"metadata,omitempty" db:"metadata"`
	CreatedBy          *string   `json:"created_by,omitempty" db:"created_by"`
	CreatedAt          string    `json:"created_at" db:"created_at"`
	UpdatedAt          string    `json:"updated_at" db:"updated_at"`
	EnabledAt          *string   `json:"enabled_at,omitempty" db:"enabled_at"`
	DisabledAt         *string   `json:"disabled_at,omitempty" db:"disabled_at"`
}

// TenantInvitation represents tenant invitation
type TenantInvitation struct {
	BaseModel
	TenantID    uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	Email       string     `json:"email" db:"email"`
	Token       string     `json:"-" db:"token"`
	Role        string     `json:"role" db:"role"`
	Status      string     `json:"status" db:"status"`
	InvitedBy   uuid.UUID  `json:"invited_by" db:"invited_by"`
	AcceptedAt  *string    `json:"accepted_at,omitempty" db:"accepted_at"`
	RejectedAt  *string    `json:"rejected_at,omitempty" db:"rejected_at"`
	ExpiresAt   string     `json:"expires_at" db:"expires_at"`
	Metadata    *string    `json:"metadata,omitempty" db:"metadata"`
}

// NotificationTemplate represents notification template
type NotificationTemplate struct {
	BaseModel
	TenantID         uuid.UUID `json:"tenant_id" db:"tenant_id"`
	TemplateCode     string    `json:"template_code" db:"template_code"`
	TemplateName     string    `json:"template_name" db:"template_name"`
	Description      *string   `json:"description,omitempty" db:"description"`
	Subject          *string   `json:"subject,omitempty" db:"subject"`
	BodyText         *string   `json:"body_text,omitempty" db:"body_text"`
	BodyHTML         *string   `json:"body_html,omitempty" db:"body_html"`
	NotificationType string    `json:"notification_type" db:"notification_type"`
	Category         *string   `json:"category,omitempty" db:"category"`
	Priority         string    `json:"priority" db:"priority"`
	LanguageCode     string    `json:"language_code" db:"language_code"`
	IsActive         bool      `json:"is_active" db:"is_active"`
	Variables        *string   `json:"variables,omitempty" db:"variables"`
	Metadata         *string   `json:"metadata,omitempty" db:"metadata"`
}
