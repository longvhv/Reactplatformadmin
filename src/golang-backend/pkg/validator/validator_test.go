package validator

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidateEmail(t *testing.T) {
	tests := []struct {
		name     string
		email    string
		expected bool
	}{
		{"Valid email", "test@example.com", true},
		{"Valid email with subdomain", "user@mail.example.com", true},
		{"Valid email with plus", "user+tag@example.com", true},
		{"Valid email with dots", "first.last@example.com", true},
		{"Invalid - no @", "testexample.com", false},
		{"Invalid - no domain", "test@", false},
		{"Invalid - no username", "@example.com", false},
		{"Invalid - spaces", "test @example.com", false},
		{"Invalid - multiple @", "test@@example.com", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateEmail(tt.email)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		expected bool
	}{
		{"Valid password", "Password123!", true},
		{"Valid password - long", "MySecureP@ssw0rd2024", true},
		{"Invalid - too short", "Pass1!", false},
		{"Invalid - no uppercase", "password123!", false},
		{"Invalid - no lowercase", "PASSWORD123!", false},
		{"Invalid - no number", "Password!!", false},
		{"Invalid - no special char", "Password123", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidatePassword(tt.password)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidatePhone(t *testing.T) {
	tests := []struct {
		name     string
		phone    string
		expected bool
	}{
		{"Valid - Vietnam format", "+84901234567", true},
		{"Valid - US format", "+12125551234", true},
		{"Valid - with spaces", "+84 90 123 4567", true},
		{"Valid - with dashes", "+84-90-123-4567", true},
		{"Valid - with parentheses", "+1 (212) 555-1234", true},
		{"Invalid - too short", "+8490123", false},
		{"Invalid - no plus", "84901234567", false},
		{"Invalid - letters", "+84abc1234567", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidatePhone(tt.phone)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateURL(t *testing.T) {
	tests := []struct {
		name     string
		url      string
		expected bool
	}{
		{"Valid HTTP URL", "http://example.com", true},
		{"Valid HTTPS URL", "https://example.com", true},
		{"Valid with path", "https://example.com/path/to/page", true},
		{"Valid with query", "https://example.com?param=value", true},
		{"Valid with port", "https://example.com:8080", true},
		{"Valid localhost", "http://localhost:3000", true},
		{"Invalid - no protocol", "example.com", false},
		{"Invalid - wrong protocol", "ftp://example.com", false},
		{"Invalid - spaces", "https://example .com", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateURL(tt.url)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateUUID(t *testing.T) {
	tests := []struct {
		name     string
		uuid     string
		expected bool
	}{
		{"Valid UUID v4", "550e8400-e29b-41d4-a716-446655440000", true},
		{"Valid UUID uppercase", "550E8400-E29B-41D4-A716-446655440000", true},
		{"Invalid - wrong format", "550e8400-e29b-41d4-a716", false},
		{"Invalid - no dashes", "550e8400e29b41d4a716446655440000", false},
		{"Invalid - wrong length", "550e8400-e29b-41d4-a716-4466554400001", false},
		{"Invalid - letters only", "abcdefgh-ijkl-mnop-qrst-uvwxyz123456", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateUUID(tt.uuid)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateIPAddress(t *testing.T) {
	tests := []struct {
		name     string
		ip       string
		expected bool
	}{
		{"Valid IPv4", "192.168.1.1", true},
		{"Valid IPv4 - localhost", "127.0.0.1", true},
		{"Valid IPv4 - public", "8.8.8.8", true},
		{"Valid IPv6", "2001:0db8:85a3:0000:0000:8a2e:0370:7334", true},
		{"Valid IPv6 - short", "2001:db8::1", true},
		{"Invalid IPv4 - out of range", "256.1.1.1", false},
		{"Invalid IPv4 - wrong format", "192.168.1", false},
		{"Invalid - text", "not-an-ip", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateIPAddress(tt.ip)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateDateFormat(t *testing.T) {
	tests := []struct {
		name     string
		date     string
		format   string
		expected bool
	}{
		{"Valid RFC3339", "2024-01-15T10:30:00Z", "2006-01-02T15:04:05Z07:00", true},
		{"Valid date only", "2024-01-15", "2006-01-02", true},
		{"Valid custom format", "15/01/2024", "02/01/2006", true},
		{"Invalid format", "2024-01-15", "02/01/2006", false},
		{"Invalid date", "2024-13-32", "2006-01-02", false},
		{"Empty string", "", "2006-01-02", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateDateFormat(tt.date, tt.format)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateJSON(t *testing.T) {
	tests := []struct {
		name     string
		json     string
		expected bool
	}{
		{"Valid object", `{"key":"value"}`, true},
		{"Valid array", `[1,2,3]`, true},
		{"Valid nested", `{"user":{"name":"John"}}`, true},
		{"Valid empty object", `{}`, true},
		{"Invalid - missing brace", `{"key":"value"`, false},
		{"Invalid - wrong quotes", `{'key':'value'}`, false},
		{"Invalid - trailing comma", `{"key":"value",}`, false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateJSON(tt.json)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateMinLength(t *testing.T) {
	tests := []struct {
		name     string
		str      string
		min      int
		expected bool
	}{
		{"Valid - exact length", "hello", 5, true},
		{"Valid - longer", "hello world", 5, true},
		{"Invalid - shorter", "hi", 5, false},
		{"Valid - empty with 0 min", "", 0, true},
		{"Invalid - empty with positive min", "", 1, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateMinLength(tt.str, tt.min)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateMaxLength(t *testing.T) {
	tests := []struct {
		name     string
		str      string
		max      int
		expected bool
	}{
		{"Valid - exact length", "hello", 5, true},
		{"Valid - shorter", "hi", 5, true},
		{"Invalid - longer", "hello world", 5, false},
		{"Valid - empty", "", 10, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateMaxLength(tt.str, tt.max)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateRange(t *testing.T) {
	tests := []struct {
		name     string
		value    int
		min      int
		max      int
		expected bool
	}{
		{"Valid - in range", 5, 1, 10, true},
		{"Valid - at min", 1, 1, 10, true},
		{"Valid - at max", 10, 1, 10, true},
		{"Invalid - below min", 0, 1, 10, false},
		{"Invalid - above max", 11, 1, 10, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateRange(tt.value, tt.min, tt.max)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestValidateAlphanumeric(t *testing.T) {
	tests := []struct {
		name     string
		str      string
		expected bool
	}{
		{"Valid - letters only", "abcXYZ", true},
		{"Valid - numbers only", "123456", true},
		{"Valid - mixed", "abc123XYZ", true},
		{"Invalid - with spaces", "abc 123", false},
		{"Invalid - with special chars", "abc@123", false},
		{"Invalid - with underscore", "abc_123", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateAlphanumeric(tt.str)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestSanitizeInput(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"No changes needed", "hello world", "hello world"},
		{"Remove HTML tags", "<script>alert('xss')</script>", "alert('xss')"},
		{"Remove multiple tags", "<div><p>text</p></div>", "text"},
		{"Trim spaces", "  hello  ", "hello"},
		{"Mixed", "  <b>bold</b> text  ", "bold text"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeInput(tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}
