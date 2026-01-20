package models

import (
	"time"

	"github.com/google/uuid"
)

type ArticleType struct {
	ID           uuid.UUID `json:"id" db:"_id"`
	AppCode      string    `json:"app_code" db:"app_code"`
	Code         string    `json:"code" db:"code"`
	Name         string    `json:"name" db:"name"`
	IconURL      *string   `json:"icon_url,omitempty" db:"icon_url"`
	ConfigSchema []byte    `json:"config_schema" db:"config_schema"`
	IsSystem     bool      `json:"is_system" db:"is_system"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type CreateArticleTypeRequest struct {
	AppCode      string `json:"app_code" binding:"required"`
	Code         string `json:"code" binding:"required"`
	Name         string `json:"name" binding:"required"`
	IconURL      *string `json:"icon_url"`
	ConfigSchema []byte `json:"config_schema"`
}

type UpdateArticleTypeRequest struct {
	Name         *string `json:"name"`
	IconURL      *string `json:"icon_url"`
	ConfigSchema []byte  `json:"config_schema"`
	IsActive     *bool   `json:"is_active"`
}
