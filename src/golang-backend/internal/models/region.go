package models

import (
	"time"

	"github.com/google/uuid"
)

type Region struct {
	ID          uuid.UUID  `json:"id" db:"_id"`
	Code        string     `json:"code" db:"code"`
	Name        string     `json:"name" db:"name"`
	Type        string     `json:"type" db:"type"` // REGION, NATION, PROVINCE, DISTRICT, COMMUNE
	Order       int        `json:"order" db:"order"`
	Status      int16      `json:"status" db:"status"` // 0=inactive, 1=active
	ParentID    *uuid.UUID `json:"parent_id,omitempty" db:"parent_id"`
	StartDate   *time.Time `json:"start_date,omitempty" db:"start_date"`
	EndDate     *time.Time `json:"end_date,omitempty" db:"end_date"`
	HistoryData []byte     `json:"history_data,omitempty" db:"history_data"`
	Metadata    []byte     `json:"metadata,omitempty" db:"metadata"`
	IsSystem    bool       `json:"is_system" db:"is_system"`
	IsEditable  bool       `json:"is_editable" db:"is_editable"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	CreatedBy   *uuid.UUID `json:"created_by,omitempty" db:"created_by"`
	UpdatedBy   *uuid.UUID `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy   *uuid.UUID `json:"deleted_by,omitempty" db:"deleted_by"`
	Version     int        `json:"version" db:"version"`
}

type CreateRegionRequest struct {
	Code        string     `json:"code" binding:"required"`
	Name        string     `json:"name" binding:"required"`
	Type        string     `json:"type" binding:"required,oneof=REGION NATION PROVINCE DISTRICT COMMUNE"`
	Order       *int       `json:"order"`
	ParentID    *uuid.UUID `json:"parent_id"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	HistoryData []byte     `json:"history_data"`
	Metadata    []byte     `json:"metadata"`
}

type UpdateRegionRequest struct {
	Name        *string    `json:"name"`
	Order       *int       `json:"order"`
	Status      *int16     `json:"status"`
	ParentID    *uuid.UUID `json:"parent_id"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	HistoryData []byte     `json:"history_data"`
	Metadata    []byte     `json:"metadata"`
}
