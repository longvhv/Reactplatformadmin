package models

import (
	"time"

	"github.com/google/uuid"
)

// BaseModel contains common fields for all entities
type BaseModel struct {
	ID        uuid.UUID  `json:"id" db:"_id"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	CreatedBy *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy *uuid.UUID `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy *uuid.UUID `json:"deleted_by,omitempty" db:"deleted_by"`
	Version   int        `json:"version" db:"version"`
}

// NewBaseModel creates a new BaseModel with defaults
func NewBaseModel() BaseModel {
	now := time.Now()
	return BaseModel{
		ID:        uuid.New(),
		CreatedAt: now,
		UpdatedAt: now,
		Version:   1,
	}
}

// IsDeleted checks if entity is soft deleted
func (b *BaseModel) IsDeleted() bool {
	return b.DeletedAt != nil
}

// SoftDelete marks entity as deleted
func (b *BaseModel) SoftDelete(deletedBy uuid.UUID) {
	now := time.Now()
	b.DeletedAt = &now
	b.DeletedBy = &deletedBy
	b.UpdatedAt = now
}

// Touch updates the updated_at timestamp
func (b *BaseModel) Touch() {
	b.UpdatedAt = time.Now()
	b.Version++
}

// PaginationMeta contains pagination metadata
type PaginationMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

// NewPaginationMeta creates pagination metadata
func NewPaginationMeta(page, limit, total int) PaginationMeta {
	totalPages := total / limit
	if total%limit > 0 {
		totalPages++
	}
	return PaginationMeta{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
	}
}

// Response is the standard API response wrapper
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Meta    interface{} `json:"meta,omitempty"`
	Error   *Error      `json:"error,omitempty"`
}

// Error represents an API error
type Error struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// NewSuccessResponse creates a success response
func NewSuccessResponse(data interface{}) Response {
	return Response{
		Success: true,
		Data:    data,
	}
}

// NewSuccessResponseWithMeta creates a success response with metadata
func NewSuccessResponseWithMeta(data interface{}, meta interface{}) Response {
	return Response{
		Success: true,
		Data:    data,
		Meta:    meta,
	}
}

// NewErrorResponse creates an error response
func NewErrorResponse(code, message string) Response {
	return Response{
		Success: false,
		Error: &Error{
			Code:    code,
			Message: message,
		},
	}
}

// NewErrorResponseWithDetails creates an error response with details
func NewErrorResponseWithDetails(code, message string, details interface{}) Response {
	return Response{
		Success: false,
		Error: &Error{
			Code:    code,
			Message: message,
			Details: details,
		},
	}
}
