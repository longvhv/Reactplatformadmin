package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

// HashIdentifier creates a hash for identifier (email, phone, etc)
func HashIdentifier(identifier string) []byte {
	// Normalize identifier (lowercase for email)
	normalized := strings.ToLower(strings.TrimSpace(identifier))
	
	// Create SHA256 hash
	hash := sha256.Sum256([]byte(normalized))
	return hash[:]
}

// HashIdentifierHex returns hex string of hashed identifier
func HashIdentifierHex(identifier string) string {
	hash := HashIdentifier(identifier)
	return hex.EncodeToString(hash)
}
