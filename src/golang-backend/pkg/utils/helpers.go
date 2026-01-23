package utils

import (
	"regexp"
	"strings"
)

// IsValidEmail validates email format
func IsValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// IsValidCode validates code format (uppercase alphanumeric and underscore)
func IsValidCode(code string) bool {
	if len(code) == 0 || len(code) > 50 {
		return false
	}
	codeRegex := regexp.MustCompile(`^[A-Z0-9_]+$`)
	return codeRegex.MatchString(code)
}

// IsValidRoleCode validates role code format (lowercase alphanumeric and underscore)
func IsValidRoleCode(code string) bool {
	if len(code) == 0 || len(code) > 50 {
		return false
	}
	codeRegex := regexp.MustCompile(`^[a-z0-9_]+$`)
	return codeRegex.MatchString(code)
}

// IsValidPhoneNumber validates phone number format
func IsValidPhoneNumber(phone string) bool {
	phoneRegex := regexp.MustCompile(`^\+?[1-9]\d{1,14}$`)
	return phoneRegex.MatchString(phone)
}

// SanitizeString removes unwanted characters from string
func SanitizeString(s string) string {
	return strings.TrimSpace(s)
}

// ToUpperSnakeCase converts string to UPPER_SNAKE_CASE
func ToUpperSnakeCase(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ToUpper(s)
	s = strings.ReplaceAll(s, " ", "_")
	s = strings.ReplaceAll(s, "-", "_")
	return s
}

// ToLowerSnakeCase converts string to lower_snake_case
func ToLowerSnakeCase(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, " ", "_")
	s = strings.ReplaceAll(s, "-", "_")
	return s
}

// StringPtr returns a pointer to the string
func StringPtr(s string) *string {
	return &s
}

// IntPtr returns a pointer to the int
func IntPtr(i int) *int {
	return &i
}

// BoolPtr returns a pointer to the bool
func BoolPtr(b bool) *bool {
	return &b
}

// StringValue returns the value of string pointer or empty string
func StringValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

// IntValue returns the value of int pointer or 0
func IntValue(i *int) int {
	if i == nil {
		return 0
	}
	return *i
}

// BoolValue returns the value of bool pointer or false
func BoolValue(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}

// Contains checks if string slice contains a string
func Contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// RemoveDuplicates removes duplicate strings from slice
func RemoveDuplicates(slice []string) []string {
	keys := make(map[string]bool)
	list := []string{}
	for _, entry := range slice {
		if _, value := keys[entry]; !value {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
}
