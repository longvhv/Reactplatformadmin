package auth

import (
	"fmt"
	"regexp"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

const (
	bcryptCost = 12
)

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hash), nil
}

// VerifyPassword verifies a password against a hash
func VerifyPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// PasswordValidator validates password strength
type PasswordValidator struct {
	MinLength      int
	RequireUpper   bool
	RequireLower   bool
	RequireNumber  bool
	RequireSpecial bool
}

// NewPasswordValidator creates a new password validator
func NewPasswordValidator(minLength int, requireUpper, requireLower, requireNumber, requireSpecial bool) *PasswordValidator {
	return &PasswordValidator{
		MinLength:      minLength,
		RequireUpper:   requireUpper,
		RequireLower:   requireLower,
		RequireNumber:  requireNumber,
		RequireSpecial: requireSpecial,
	}
}

// Validate validates a password
func (v *PasswordValidator) Validate(password string) error {
	if len(password) < v.MinLength {
		return fmt.Errorf("password must be at least %d characters long", v.MinLength)
	}

	if v.RequireUpper && !hasUpperCase(password) {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}

	if v.RequireLower && !hasLowerCase(password) {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}

	if v.RequireNumber && !hasNumber(password) {
		return fmt.Errorf("password must contain at least one number")
	}

	if v.RequireSpecial && !hasSpecialChar(password) {
		return fmt.Errorf("password must contain at least one special character")
	}

	return nil
}

func hasUpperCase(s string) bool {
	for _, r := range s {
		if unicode.IsUpper(r) {
			return true
		}
	}
	return false
}

func hasLowerCase(s string) bool {
	for _, r := range s {
		if unicode.IsLower(r) {
			return true
		}
	}
	return false
}

func hasNumber(s string) bool {
	for _, r := range s {
		if unicode.IsDigit(r) {
			return true
		}
	}
	return false
}

func hasSpecialChar(s string) bool {
	specialChar := regexp.MustCompile(`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`)
	return specialChar.MatchString(s)
}
