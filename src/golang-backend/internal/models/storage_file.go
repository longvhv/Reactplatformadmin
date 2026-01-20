package models

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// StorageFile represents a storage file
type StorageFile struct {
	ID              uuid.UUID      `json:"_id" db:"_id"`
	TenantID        uuid.UUID      `json:"tenant_id" db:"tenant_id"`
	ParentID        sql.NullString `json:"parent_id,omitempty" db:"parent_id"`
	IsFolder        bool           `json:"is_folder" db:"is_folder"`
	OriginalName    string         `json:"original_name" db:"original_name"`
	StoragePath     sql.NullString `json:"storage_path,omitempty" db:"storage_path"`
	PublicURL       sql.NullString `json:"public_url,omitempty" db:"public_url"`
	Category        string         `json:"category" db:"category"` // MEDIA, DOCUMENT, ARCHIVE, EXPORT, SYSTEM
	MimeType        string         `json:"mime_type" db:"mime_type"`
	Extension       sql.NullString `json:"extension,omitempty" db:"extension"`
	FileSize        int64          `json:"file_size" db:"file_size"`
	ItemsSnapshot   JSONB          `json:"items_snapshot" db:"items_snapshot"`
	Metadata        JSONB          `json:"metadata" db:"metadata"`
	StorageProvider string         `json:"storage_provider" db:"storage_provider"` // S3, R2, MINIO, CLOUDFLARE
	Visibility      string         `json:"visibility" db:"visibility"`             // PRIVATE, PUBLIC
	Status          string         `json:"status" db:"status"`                     // UPLOADING, PROCESSING, READY, FAILED
	UploadedBy      sql.NullString `json:"uploaded_by,omitempty" db:"uploaded_by"`
	CreatedAt       time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at" db:"updated_at"`
	DeletedAt       sql.NullTime   `json:"deleted_at,omitempty" db:"deleted_at"`
	Version         int64          `json:"version" db:"version"`
}

// CreateStorageFileRequest represents the request to create a storage file
type CreateStorageFileRequest struct {
	TenantID        uuid.UUID              `json:"tenant_id" validate:"required,uuid"`
	ParentID        *uuid.UUID             `json:"parent_id,omitempty"`
	IsFolder        bool                   `json:"is_folder"`
	OriginalName    string                 `json:"original_name" validate:"required,min=1"`
	StoragePath     string                 `json:"storage_path,omitempty"`
	PublicURL       string                 `json:"public_url,omitempty"`
	Category        string                 `json:"category" validate:"required,oneof=MEDIA DOCUMENT ARCHIVE EXPORT SYSTEM"`
	MimeType        string                 `json:"mime_type" validate:"required"`
	Extension       string                 `json:"extension,omitempty"`
	FileSize        int64                  `json:"file_size"`
	ItemsSnapshot   []interface{}          `json:"items_snapshot,omitempty"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
	StorageProvider string                 `json:"storage_provider,omitempty"`
	Visibility      string                 `json:"visibility,omitempty"`
	UploadedBy      *uuid.UUID             `json:"uploaded_by,omitempty"`
}

// UpdateStorageFileRequest represents the request to update a storage file
type UpdateStorageFileRequest struct {
	OriginalName  *string                 `json:"original_name,omitempty"`
	StoragePath   *string                 `json:"storage_path,omitempty"`
	PublicURL     *string                 `json:"public_url,omitempty"`
	Category      *string                 `json:"category,omitempty" validate:"omitempty,oneof=MEDIA DOCUMENT ARCHIVE EXPORT SYSTEM"`
	FileSize      *int64                  `json:"file_size,omitempty"`
	ItemsSnapshot *[]interface{}          `json:"items_snapshot,omitempty"`
	Metadata      *map[string]interface{} `json:"metadata,omitempty"`
	Visibility    *string                 `json:"visibility,omitempty"`
	Status        *string                 `json:"status,omitempty" validate:"omitempty,oneof=UPLOADING PROCESSING READY FAILED"`
}

// TableName returns the table name for StorageFile
func (StorageFile) TableName() string {
	return "storage_files"
}
