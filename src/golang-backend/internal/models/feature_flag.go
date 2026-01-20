package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// FeatureFlag represents a feature flag
type FeatureFlag struct {
	ID                uuid.UUID      `json:"id" db:"id"`
	FlagKey           string         `json:"flag_key" db:"flag_key"`
	FlagName          string         `json:"flag_name" db:"flag_name"`
	Description       sql.NullString `json:"description,omitempty" db:"description"`
	IsEnabled         bool           `json:"is_enabled" db:"is_enabled"`
	Environment       string         `json:"environment" db:"environment"` // development, staging, production
	FlagType          string         `json:"flag_type" db:"flag_type"`     // boolean, percentage, targeted
	TargetAudience    sql.NullString `json:"target_audience,omitempty" db:"target_audience"`
	PercentageRollout int            `json:"percentage_rollout" db:"percentage_rollout"`
	Conditions        JSONB          `json:"conditions,omitempty" db:"conditions"`
	Metadata          JSONB          `json:"metadata,omitempty" db:"metadata"`
	CreatedBy         sql.NullString `json:"created_by,omitempty" db:"created_by"`
	CreatedAt         time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at" db:"updated_at"`
	EnabledAt         sql.NullTime   `json:"enabled_at,omitempty" db:"enabled_at"`
	DisabledAt        sql.NullTime   `json:"disabled_at,omitempty" db:"disabled_at"`
}

// CreateFeatureFlagRequest represents the request to create a feature flag
type CreateFeatureFlagRequest struct {
	FlagKey           string                 `json:"flag_key" validate:"required,min=1,max=200"`
	FlagName          string                 `json:"flag_name" validate:"required,min=1,max=500"`
	Description       string                 `json:"description,omitempty"`
	IsEnabled         bool                   `json:"is_enabled"`
	Environment       string                 `json:"environment,omitempty"`
	FlagType          string                 `json:"flag_type,omitempty" validate:"omitempty,oneof=boolean percentage targeted"`
	TargetAudience    string                 `json:"target_audience,omitempty"`
	PercentageRollout int                    `json:"percentage_rollout,omitempty" validate:"omitempty,min=0,max=100"`
	Conditions        map[string]interface{} `json:"conditions,omitempty"`
	Metadata          map[string]interface{} `json:"metadata,omitempty"`
	CreatedBy         string                 `json:"created_by,omitempty"`
}

// UpdateFeatureFlagRequest represents the request to update a feature flag
type UpdateFeatureFlagRequest struct {
	FlagName          *string                 `json:"flag_name,omitempty" validate:"omitempty,min=1,max=500"`
	Description       *string                 `json:"description,omitempty"`
	IsEnabled         *bool                   `json:"is_enabled,omitempty"`
	Environment       *string                 `json:"environment,omitempty"`
	FlagType          *string                 `json:"flag_type,omitempty" validate:"omitempty,oneof=boolean percentage targeted"`
	TargetAudience    *string                 `json:"target_audience,omitempty"`
	PercentageRollout *int                    `json:"percentage_rollout,omitempty" validate:"omitempty,min=0,max=100"`
	Conditions        *map[string]interface{} `json:"conditions,omitempty"`
	Metadata          *map[string]interface{} `json:"metadata,omitempty"`
}

// TableName returns the table name for FeatureFlag
func (FeatureFlag) TableName() string {
	return "feature_flags"
}
