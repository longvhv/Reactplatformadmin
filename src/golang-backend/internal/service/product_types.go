package service

import "github.com/google/uuid"

// CreateProductRequest represents create product request
type CreateProductRequest struct {
	TenantID      uuid.UUID              `json:"tenant_id" binding:"required"`
	Name          string                 `json:"name" binding:"required"`
	Code          string                 `json:"code" binding:"required"`
	Description   *string                `json:"description"`
	Type          string                 `json:"type" binding:"required"`
	Category      *string                `json:"category"`
	Price         float64                `json:"price" binding:"required,min=0"`
	Currency      string                 `json:"currency" binding:"required"`
	IsActive      bool                   `json:"is_active"`
	IsVisible     bool                   `json:"is_visible"`
	Features      []string               `json:"features"`
	Specifications map[string]interface{} `json:"specifications"`
	Metadata      map[string]interface{} `json:"metadata"`
}

// UpdateProductRequest represents update product request
type UpdateProductRequest struct {
	Name          *string                `json:"name"`
	Description   *string                `json:"description"`
	Type          *string                `json:"type"`
	Category      *string                `json:"category"`
	Price         *float64               `json:"price"`
	Currency      *string                `json:"currency"`
	IsActive      *bool                  `json:"is_active"`
	IsVisible     *bool                  `json:"is_visible"`
	Features      []string               `json:"features"`
	Specifications map[string]interface{} `json:"specifications"`
	Metadata      map[string]interface{} `json:"metadata"`
}
