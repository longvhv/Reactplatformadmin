package errors

import (
	"errors"
	"fmt"
)

// Common errors
var (
	ErrNotFound            = errors.New("resource not found")
	ErrUnauthorized        = errors.New("unauthorized")
	ErrForbidden           = errors.New("forbidden")
	ErrBadRequest          = errors.New("bad request")
	ErrConflict            = errors.New("resource already exists")
	ErrInternalServer      = errors.New("internal server error")
	ErrInvalidInput        = errors.New("invalid input")
	ErrValidation          = errors.New("validation failed")
	ErrDatabaseConnection  = errors.New("database connection failed")
	ErrCacheConnection     = errors.New("cache connection failed")
)

// Authentication errors
var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailNotVerified   = errors.New("email not verified")
	ErrAccountLocked      = errors.New("account is locked")
	ErrAccountDisabled    = errors.New("account is disabled")
	ErrAccountBanned      = errors.New("account is banned")
	ErrTokenExpired       = errors.New("token has expired")
	ErrTokenInvalid       = errors.New("token is invalid")
	ErrPasswordWeak       = errors.New("password is too weak")
)

// Business logic errors
var (
	ErrTenantNotFound     = errors.New("tenant not found")
	ErrUserNotFound       = errors.New("user not found")
	ErrRoleNotFound       = errors.New("role not found")
	ErrPermissionDenied   = errors.New("permission denied")
	ErrResourceNotFound   = errors.New("resource not found")
	ErrDuplicateEntry     = errors.New("duplicate entry")
	ErrInvalidOperation   = errors.New("invalid operation")
	ErrQuotaExceeded      = errors.New("quota exceeded")
	ErrSubscriptionExpired = errors.New("subscription has expired")
)

// AppError represents an application error with context
type AppError struct {
	Code    string
	Message string
	Err     error
	Details map[string]interface{}
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// NewAppError creates a new application error
func NewAppError(code, message string, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
		Details: make(map[string]interface{}),
	}
}

// WithDetails adds details to the error
func (e *AppError) WithDetails(key string, value interface{}) *AppError {
	e.Details[key] = value
	return e
}

// Validation error
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidationErrors is a collection of validation errors
type ValidationErrors []ValidationError

func (e ValidationErrors) Error() string {
	if len(e) == 0 {
		return "validation failed"
	}
	return fmt.Sprintf("validation failed: %s", e[0].Error())
}

// NewValidationError creates a new validation error
func NewValidationError(field, message string) *ValidationError {
	return &ValidationError{
		Field:   field,
		Message: message,
	}
}

// Helper functions
func IsNotFound(err error) bool {
	return errors.Is(err, ErrNotFound) ||
		errors.Is(err, ErrTenantNotFound) ||
		errors.Is(err, ErrUserNotFound) ||
		errors.Is(err, ErrRoleNotFound) ||
		errors.Is(err, ErrResourceNotFound)
}

func IsUnauthorized(err error) bool {
	return errors.Is(err, ErrUnauthorized) ||
		errors.Is(err, ErrInvalidCredentials) ||
		errors.Is(err, ErrTokenExpired) ||
		errors.Is(err, ErrTokenInvalid)
}

func IsForbidden(err error) bool {
	return errors.Is(err, ErrForbidden) ||
		errors.Is(err, ErrPermissionDenied) ||
		errors.Is(err, ErrAccountLocked) ||
		errors.Is(err, ErrAccountDisabled) ||
		errors.Is(err, ErrAccountBanned)
}

func IsBadRequest(err error) bool {
	return errors.Is(err, ErrBadRequest) ||
		errors.Is(err, ErrInvalidInput) ||
		errors.Is(err, ErrValidation)
}

func IsConflict(err error) bool {
	return errors.Is(err, ErrConflict) ||
		errors.Is(err, ErrDuplicateEntry)
}

// Wrap wraps an error with a message
func Wrap(err error, message string) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", message, err)
}

// Wrapf wraps an error with a formatted message
func Wrapf(err error, format string, args ...interface{}) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", fmt.Sprintf(format, args...), err)
}
