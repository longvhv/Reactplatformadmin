package utils

import (
	"github.com/gin-gonic/gin"
)

// Response represents standard API response
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Meta    *MetaInfo   `json:"meta,omitempty"`
}

// ErrorInfo represents error information
type ErrorInfo struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// MetaInfo represents pagination metadata
type MetaInfo struct {
	Page       int `json:"page"`
	PageSize   int `json:"page_size"`
	TotalPages int `json:"total_pages"`
	TotalCount int `json:"total_count"`
}

// SuccessResponse sends a successful response
func SuccessResponse(c *gin.Context, statusCode int, data interface{}) {
	c.JSON(statusCode, Response{
		Success: true,
		Data:    data,
	})
}

// SuccessResponseWithMeta sends a successful response with pagination metadata
func SuccessResponseWithMeta(c *gin.Context, statusCode int, data interface{}, meta *MetaInfo) {
	c.JSON(statusCode, Response{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

// ErrorResponse sends an error response
func ErrorResponse(c *gin.Context, statusCode int, code, message string) {
	c.JSON(statusCode, Response{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
		},
	})
}

// ValidationErrorResponse sends a validation error response
func ValidationErrorResponse(c *gin.Context, message string) {
	ErrorResponse(c, 400, "VALIDATION_ERROR", message)
}

// NotFoundResponse sends a not found response
func NotFoundResponse(c *gin.Context, resource string) {
	ErrorResponse(c, 404, "NOT_FOUND", resource+" not found")
}

// InternalErrorResponse sends an internal server error response
func InternalErrorResponse(c *gin.Context, err error) {
	ErrorResponse(c, 500, "INTERNAL_ERROR", err.Error())
}

// UnauthorizedResponse sends an unauthorized response
func UnauthorizedResponse(c *gin.Context) {
	ErrorResponse(c, 401, "UNAUTHORIZED", "Authentication required")
}

// ForbiddenResponse sends a forbidden response
func ForbiddenResponse(c *gin.Context) {
	ErrorResponse(c, 403, "FORBIDDEN", "Access denied")
}
