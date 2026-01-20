package models

import (
	"time"

	"github.com/google/uuid"
)

type SystemAnnouncement struct {
	ID              uuid.UUID  `json:"id" db:"_id"`
	TenantID        uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	Title           string     `json:"title" db:"title"`
	Content         string     `json:"content" db:"content"`
	Type            string     `json:"type" db:"type"` // info, warning, error, success
	Priority        string     `json:"priority" db:"priority"` // low, normal, high, urgent
	Category        *string    `json:"category,omitempty" db:"category"`
	Status          string     `json:"status" db:"status"` // draft, scheduled, published, archived
	IsPublished     bool       `json:"is_published" db:"is_published"`
	IsPinned        bool       `json:"is_pinned" db:"is_pinned"`
	StartDate       *time.Time `json:"start_date,omitempty" db:"start_date"`
	EndDate         *time.Time `json:"end_date,omitempty" db:"end_date"`
	PublishedAt     *time.Time `json:"published_at,omitempty" db:"published_at"`
	TargetAudience  []byte     `json:"target_audience,omitempty" db:"target_audience"`
	DisplayLocation []string   `json:"display_location" db:"display_location"`
	Icon            *string    `json:"icon,omitempty" db:"icon"`
	Color           *string    `json:"color,omitempty" db:"color"`
	LinkURL         *string    `json:"link_url,omitempty" db:"link_url"`
	LinkText        *string    `json:"link_text,omitempty" db:"link_text"`
	Attachments     []byte     `json:"attachments,omitempty" db:"attachments"`
	Metadata        []byte     `json:"metadata,omitempty" db:"metadata"`
	ViewCount       int        `json:"view_count" db:"view_count"`
	ClickCount      int        `json:"click_count" db:"click_count"`
	CreatedAt       time.Time  `json:"created_at" db:"created_at"`
	CreatedBy       *string    `json:"created_by,omitempty" db:"created_by"`
	UpdatedAt       time.Time  `json:"updated_at" db:"updated_at"`
	UpdatedBy       *string    `json:"updated_by,omitempty" db:"updated_by"`
	DeletedAt       *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	DeletedBy       *string    `json:"deleted_by,omitempty" db:"deleted_by"`
	Version         int        `json:"version" db:"version"`
}

type CreateSystemAnnouncementRequest struct {
	TenantID        uuid.UUID  `json:"tenant_id" binding:"required"`
	Title           string     `json:"title" binding:"required"`
	Content         string     `json:"content" binding:"required"`
	Type            string     `json:"type" binding:"required,oneof=info warning error success"`
	Priority        string     `json:"priority" binding:"required,oneof=low normal high urgent"`
	Category        *string    `json:"category"`
	IsPinned        *bool      `json:"is_pinned"`
	StartDate       *time.Time `json:"start_date"`
	EndDate         *time.Time `json:"end_date"`
	TargetAudience  []byte     `json:"target_audience"`
	DisplayLocation []string   `json:"display_location"`
	Icon            *string    `json:"icon"`
	Color           *string    `json:"color"`
	LinkURL         *string    `json:"link_url"`
	LinkText        *string    `json:"link_text"`
	Attachments     []byte     `json:"attachments"`
	Metadata        []byte     `json:"metadata"`
}

type UpdateSystemAnnouncementRequest struct {
	Title           *string    `json:"title"`
	Content         *string    `json:"content"`
	Type            *string    `json:"type"`
	Priority        *string    `json:"priority"`
	Category        *string    `json:"category"`
	Status          *string    `json:"status"`
	IsPinned        *bool      `json:"is_pinned"`
	StartDate       *time.Time `json:"start_date"`
	EndDate         *time.Time `json:"end_date"`
	TargetAudience  []byte     `json:"target_audience"`
	DisplayLocation []string   `json:"display_location"`
	Icon            *string    `json:"icon"`
	Color           *string    `json:"color"`
	LinkURL         *string    `json:"link_url"`
	LinkText        *string    `json:"link_text"`
	Attachments     []byte     `json:"attachments"`
	Metadata        []byte     `json:"metadata"`
}
