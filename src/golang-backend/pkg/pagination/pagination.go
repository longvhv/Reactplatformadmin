package pagination

import (
	"net/http"
	"strconv"
)

const (
	DefaultPage  = 1
	DefaultLimit = 10
	MaxLimit     = 100
)

// Params represents pagination parameters
type Params struct {
	Page   int
	Limit  int
	Offset int
}

// Response represents pagination response
type Response struct {
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	Total      int64       `json:"total"`
	TotalPages int         `json:"total_pages"`
	Data       interface{} `json:"data"`
}

// ParseParams parses pagination parameters from request
func ParseParams(r *http.Request) *Params {
	page := parseIntParam(r, "page", DefaultPage)
	limit := parseIntParam(r, "limit", DefaultLimit)
	
	// Validate and adjust values
	if page < 1 {
		page = DefaultPage
	}
	if limit < 1 {
		limit = DefaultLimit
	}
	if limit > MaxLimit {
		limit = MaxLimit
	}
	
	offset := (page - 1) * limit
	
	return &Params{
		Page:   page,
		Limit:  limit,
		Offset: offset,
	}
}

// NewResponse creates a new pagination response
func NewResponse(page, limit int, total int64, data interface{}) *Response {
	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}
	
	return &Response{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		Data:       data,
	}
}

// parseIntParam parses integer parameter from query string
func parseIntParam(r *http.Request, key string, defaultValue int) int {
	value := r.URL.Query().Get(key)
	if value == "" {
		return defaultValue
	}
	
	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}
	
	return intValue
}
