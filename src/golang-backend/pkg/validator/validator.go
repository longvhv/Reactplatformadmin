package validator

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
)

var (
	emailRegex    = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	codeRegex     = regexp.MustCompile(`^[A-Z0-9_]+$`)
	slugRegex     = regexp.MustCompile(`^[a-z0-9-]+$`)
	phoneRegex    = regexp.MustCompile(`^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$`)
	urlRegex      = regexp.MustCompile(`^https?://`)
)

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// ValidateEmail validates email format
func ValidateEmail(email string) error {
	if email == "" {
		return &ValidationError{Field: "email", Message: "email is required"}
	}
	if !emailRegex.MatchString(email) {
		return &ValidationError{Field: "email", Message: "invalid email format"}
	}
	return nil
}

// ValidatePassword validates password strength
func ValidatePassword(password string) error {
	if password == "" {
		return &ValidationError{Field: "password", Message: "password is required"}
	}
	if len(password) < 8 {
		return &ValidationError{Field: "password", Message: "password must be at least 8 characters"}
	}
	
	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)
	
	for _, char := range password {
		switch {
		case 'A' <= char && char <= 'Z':
			hasUpper = true
		case 'a' <= char && char <= 'z':
			hasLower = true
		case '0' <= char && char <= '9':
			hasNumber = true
		case strings.ContainsRune("!@#$%^&*()_+-=[]{}|;:,.<>?", char):
			hasSpecial = true
		}
	}
	
	if !hasUpper {
		return &ValidationError{Field: "password", Message: "password must contain at least one uppercase letter"}
	}
	if !hasLower {
		return &ValidationError{Field: "password", Message: "password must contain at least one lowercase letter"}
	}
	if !hasNumber {
		return &ValidationError{Field: "password", Message: "password must contain at least one number"}
	}
	if !hasSpecial {
		return &ValidationError{Field: "password", Message: "password must contain at least one special character"}
	}
	
	return nil
}

// ValidateCode validates code format (uppercase letters, numbers, underscores)
func ValidateCode(code string) error {
	if code == "" {
		return &ValidationError{Field: "code", Message: "code is required"}
	}
	if !codeRegex.MatchString(code) {
		return &ValidationError{Field: "code", Message: "code must contain only uppercase letters, numbers, and underscores"}
	}
	return nil
}

// ValidateSlug validates slug format (lowercase letters, numbers, hyphens)
func ValidateSlug(slug string) error {
	if slug == "" {
		return &ValidationError{Field: "slug", Message: "slug is required"}
	}
	if !slugRegex.MatchString(slug) {
		return &ValidationError{Field: "slug", Message: "slug must contain only lowercase letters, numbers, and hyphens"}
	}
	return nil
}

// ValidatePhone validates phone number format
func ValidatePhone(phone string) error {
	if phone == "" {
		return nil // Phone is optional
	}
	if !phoneRegex.MatchString(phone) {
		return &ValidationError{Field: "phone", Message: "invalid phone format"}
	}
	return nil
}

// ValidateURL validates URL format
func ValidateURL(url string) error {
	if url == "" {
		return &ValidationError{Field: "url", Message: "url is required"}
	}
	if !urlRegex.MatchString(url) {
		return &ValidationError{Field: "url", Message: "url must start with http:// or https://"}
	}
	return nil
}

// ValidateUUID validates UUID format
func ValidateUUID(id string) error {
	if id == "" {
		return &ValidationError{Field: "id", Message: "id is required"}
	}
	if _, err := uuid.Parse(id); err != nil {
		return &ValidationError{Field: "id", Message: "invalid uuid format"}
	}
	return nil
}

// ValidateRequired validates required field
func ValidateRequired(field, value string) error {
	if strings.TrimSpace(value) == "" {
		return &ValidationError{Field: field, Message: fmt.Sprintf("%s is required", field)}
	}
	return nil
}

// ValidateLength validates string length
func ValidateLength(field, value string, min, max int) error {
	length := len(value)
	if length < min {
		return &ValidationError{Field: field, Message: fmt.Sprintf("%s must be at least %d characters", field, min)}
	}
	if max > 0 && length > max {
		return &ValidationError{Field: field, Message: fmt.Sprintf("%s must be at most %d characters", field, max)}
	}
	return nil
}

// ValidateIn validates value is in allowed list
func ValidateIn(field, value string, allowed []string) error {
	for _, v := range allowed {
		if value == v {
			return nil
		}
	}
	return &ValidationError{Field: field, Message: fmt.Sprintf("%s must be one of: %s", field, strings.Join(allowed, ", "))}
}
