package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Claims represents JWT claims
type Claims struct {
	UserID   uuid.UUID `json:"user_id"`
	Email    string    `json:"email"`
	TenantID *uuid.UUID `json:"tenant_id,omitempty"`
	Roles    []string  `json:"roles,omitempty"`
	jwt.RegisteredClaims
}

// JWTManager manages JWT tokens
type JWTManager struct {
	secretKey             string
	accessTokenDuration   time.Duration
	refreshTokenDuration  time.Duration
	issuer                string
	audience              string
}

// NewJWTManager creates a new JWT manager
func NewJWTManager(secretKey string, accessTokenDuration, refreshTokenDuration time.Duration, issuer, audience string) *JWTManager {
	return &JWTManager{
		secretKey:            secretKey,
		accessTokenDuration:  accessTokenDuration,
		refreshTokenDuration: refreshTokenDuration,
		issuer:               issuer,
		audience:             audience,
	}
}

// GenerateAccessToken generates an access token
func (m *JWTManager) GenerateAccessToken(userID uuid.UUID, email string, tenantID *uuid.UUID, roles []string) (string, error) {
	claims := Claims{
		UserID:   userID,
		Email:    email,
		TenantID: tenantID,
		Roles:    roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.accessTokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    m.issuer,
			Audience:  jwt.ClaimStrings{m.audience},
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.secretKey))
}

// GenerateRefreshToken generates a refresh token
func (m *JWTManager) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.refreshTokenDuration)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    m.issuer,
		Audience:  jwt.ClaimStrings{m.audience},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.secretKey))
}

// ValidateToken validates a JWT token
func (m *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(m.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ValidateRefreshToken validates a refresh token
func (m *JWTManager) ValidateRefreshToken(tokenString string) (uuid.UUID, error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(m.secretKey), nil
	})

	if err != nil {
		return uuid.Nil, err
	}

	if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			return uuid.Nil, fmt.Errorf("invalid user ID in token")
		}
		return userID, nil
	}

	return uuid.Nil, fmt.Errorf("invalid refresh token")
}
