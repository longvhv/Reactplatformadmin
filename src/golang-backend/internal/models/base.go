package models

import "time"

// BaseModel contains common fields for all models
type BaseModel struct {
	ID        string     `json:"_id" db:"_id"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
	Version   int64      `json:"version" db:"version"`
}
