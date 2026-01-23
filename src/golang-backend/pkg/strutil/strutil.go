package strutil

import (
	"crypto/rand"
	"encoding/base64"
	"strings"
	"unicode"
)

// Slugify converts string to slug format
func Slugify(s string) string {
	s = strings.ToLower(s)
	s = strings.TrimSpace(s)
	
	// Replace spaces and special characters with hyphens
	var builder strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsNumber(r) {
			builder.WriteRune(r)
		} else if unicode.IsSpace(r) {
			builder.WriteRune('-')
		}
	}
	
	// Remove duplicate hyphens
	result := builder.String()
	for strings.Contains(result, "--") {
		result = strings.ReplaceAll(result, "--", "-")
	}
	
	return strings.Trim(result, "-")
}

// ToCode converts string to uppercase code format
func ToCode(s string) string {
	s = strings.ToUpper(s)
	s = strings.TrimSpace(s)
	
	// Replace spaces with underscores
	s = strings.ReplaceAll(s, " ", "_")
	
	// Remove special characters except underscore
	var builder strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsNumber(r) || r == '_' {
			builder.WriteRune(r)
		}
	}
	
	return builder.String()
}

// Truncate truncates string to specified length
func Truncate(s string, length int) string {
	if len(s) <= length {
		return s
	}
	return s[:length] + "..."
}

// IsEmpty checks if string is empty or contains only whitespace
func IsEmpty(s string) bool {
	return strings.TrimSpace(s) == ""
}

// Contains checks if string contains substring (case insensitive)
func Contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

// GenerateRandomString generates random string of specified length
func GenerateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}

// MaskEmail masks email address
func MaskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return email
	}
	
	username := parts[0]
	domain := parts[1]
	
	if len(username) <= 2 {
		return "**@" + domain
	}
	
	masked := string(username[0]) + strings.Repeat("*", len(username)-2) + string(username[len(username)-1])
	return masked + "@" + domain
}

// MaskPhone masks phone number
func MaskPhone(phone string) string {
	if len(phone) <= 4 {
		return strings.Repeat("*", len(phone))
	}
	
	return strings.Repeat("*", len(phone)-4) + phone[len(phone)-4:]
}

// FirstN returns first n characters of string
func FirstN(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}

// LastN returns last n characters of string
func LastN(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[len(s)-n:]
}

// CamelToSnake converts camelCase to snake_case
func CamelToSnake(s string) string {
	var result strings.Builder
	for i, r := range s {
		if unicode.IsUpper(r) {
			if i > 0 {
				result.WriteRune('_')
			}
			result.WriteRune(unicode.ToLower(r))
		} else {
			result.WriteRune(r)
		}
	}
	return result.String()
}

// SnakeToCamel converts snake_case to camelCase
func SnakeToCamel(s string) string {
	words := strings.Split(s, "_")
	for i := 1; i < len(words); i++ {
		if len(words[i]) > 0 {
			words[i] = strings.ToUpper(string(words[i][0])) + words[i][1:]
		}
	}
	return strings.Join(words, "")
}

// ReverseString reverses a string
func ReverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}
