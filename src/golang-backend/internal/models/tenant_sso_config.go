package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// TenantSSOConfig represents a tenant's SSO configuration
type TenantSSOConfig struct {
	ID                    uuid.UUID      `json:"_id" db:"_id"`
	TenantID              uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	Provider              string         `json:"provider" db:"provider"` // SAML, OAUTH2, OIDC, LDAP, CAS, OTHER
	Name                  string         `json:"name" db:"name"`
	Description           sql.NullString `json:"description,omitempty" db:"description"`
	Status                string         `json:"status" db:"status"` // ACTIVE, INACTIVE, TESTING, DEPRECATED
	EntityID              sql.NullString `json:"entity_id,omitempty" db:"entity_id"`
	SSOURL                sql.NullString `json:"sso_url,omitempty" db:"sso_url"`
	SLOURL                sql.NullString `json:"slo_url,omitempty" db:"slo_url"`
	Certificate           sql.NullString `json:"certificate,omitempty" db:"certificate"`
	MetadataURL           sql.NullString `json:"metadata_url,omitempty" db:"metadata_url"`
	ClientID              sql.NullString `json:"client_id,omitempty" db:"client_id"`
	ClientSecret          sql.NullString `json:"-" db:"client_secret"` // Never expose
	AuthorizationEndpoint sql.NullString `json:"authorization_endpoint,omitempty" db:"authorization_endpoint"`
	TokenEndpoint         sql.NullString `json:"token_endpoint,omitempty" db:"token_endpoint"`
	UserinfoEndpoint      sql.NullString `json:"userinfo_endpoint,omitempty" db:"userinfo_endpoint"`
	JWKSURI               sql.NullString `json:"jwks_uri,omitempty" db:"jwks_uri"`
	Scopes                JSONB          `json:"scopes,omitempty" db:"scopes"`
	AttributeMapping      JSONB          `json:"attribute_mapping,omitempty" db:"attribute_mapping"`
	Settings              JSONB          `json:"settings,omitempty" db:"settings"`
	CreatedAt             time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time      `json:"updated_at" db:"updated_at"`
	CreatedBy             sql.NullString `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy             sql.NullString `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt             sql.NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy             sql.NullString `json:"deleted_by,omitempty" db:"deleted_by"`
	Version               int            `json:"version" db:"version"`
}

// CreateTenantSSOConfigRequest represents the request to create an SSO config
type CreateTenantSSOConfigRequest struct {
	TenantID              uuid.UUID              `json:"tenant_id" validate:"required,uuid"`
	Provider              string                 `json:"provider" validate:"required,oneof=SAML OAUTH2 OIDC LDAP CAS OTHER"`
	Name                  string                 `json:"name" validate:"required,min=1,max=255"`
	Description           string                 `json:"description,omitempty"`
	EntityID              string                 `json:"entity_id,omitempty"`
	SSOURL                string                 `json:"sso_url,omitempty"`
	SLOURL                string                 `json:"slo_url,omitempty"`
	Certificate           string                 `json:"certificate,omitempty"`
	MetadataURL           string                 `json:"metadata_url,omitempty"`
	ClientID              string                 `json:"client_id,omitempty"`
	ClientSecret          string                 `json:"client_secret,omitempty"`
	AuthorizationEndpoint string                 `json:"authorization_endpoint,omitempty"`
	TokenEndpoint         string                 `json:"token_endpoint,omitempty"`
	UserinfoEndpoint      string                 `json:"userinfo_endpoint,omitempty"`
	JWKSURI               string                 `json:"jwks_uri,omitempty"`
	Scopes                []string               `json:"scopes,omitempty"`
	AttributeMapping      map[string]interface{} `json:"attribute_mapping,omitempty"`
	Settings              map[string]interface{} `json:"settings,omitempty"`
}

// UpdateTenantSSOConfigRequest represents the request to update an SSO config
type UpdateTenantSSOConfigRequest struct {
	Name                  *string                 `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Description           *string                 `json:"description,omitempty"`
	Status                *string                 `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE INACTIVE TESTING DEPRECATED"`
	EntityID              *string                 `json:"entity_id,omitempty"`
	SSOURL                *string                 `json:"sso_url,omitempty"`
	SLOURL                *string                 `json:"slo_url,omitempty"`
	Certificate           *string                 `json:"certificate,omitempty"`
	MetadataURL           *string                 `json:"metadata_url,omitempty"`
	ClientID              *string                 `json:"client_id,omitempty"`
	ClientSecret          *string                 `json:"client_secret,omitempty"`
	AuthorizationEndpoint *string                 `json:"authorization_endpoint,omitempty"`
	TokenEndpoint         *string                 `json:"token_endpoint,omitempty"`
	UserinfoEndpoint      *string                 `json:"userinfo_endpoint,omitempty"`
	JWKSURI               *string                 `json:"jwks_uri,omitempty"`
	Scopes                *[]string               `json:"scopes,omitempty"`
	AttributeMapping      *map[string]interface{} `json:"attribute_mapping,omitempty"`
	Settings              *map[string]interface{} `json:"settings,omitempty"`
}

// TableName returns the table name for TenantSSOConfig
func (TenantSSOConfig) TableName() string {
	return "tenant_sso_configs"
}
