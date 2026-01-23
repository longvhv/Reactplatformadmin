package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/vhv-platform/backend/internal/models"
	"go.uber.org/zap"
)

// RateLimiter implements token bucket rate limiting
type RateLimiter struct {
	visitors map[string]*visitor
	mu       sync.RWMutex
	rate     int           // requests per window
	window   time.Duration // time window
	cleanup  time.Duration // cleanup interval
}

type visitor struct {
	tokens     int
	lastUpdate time.Time
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(rate int, window, cleanup time.Duration) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rate:     rate,
		window:   window,
		cleanup:  cleanup,
	}

	go rl.cleanupVisitors()
	return rl
}

// Middleware returns rate limiting middleware
func (rl *RateLimiter) Middleware(logger *zap.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := getIP(r)

			if !rl.allow(ip) {
				logger.Warn("Rate limit exceeded",
					zap.String("ip", ip),
					zap.String("path", r.URL.Path),
				)

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				response := models.NewErrorResponse(
					"RATE_LIMIT_EXCEEDED",
					"Too many requests. Please try again later.",
				)
				respondJSON(w, response)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// allow checks if request is allowed
func (rl *RateLimiter) allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[key]
	now := time.Now()

	if !exists {
		rl.visitors[key] = &visitor{
			tokens:     rl.rate - 1,
			lastUpdate: now,
		}
		return true
	}

	// Calculate tokens to add based on time elapsed
	elapsed := now.Sub(v.lastUpdate)
	tokensToAdd := int(elapsed / rl.window * time.Duration(rl.rate))

	if tokensToAdd > 0 {
		v.tokens = min(rl.rate, v.tokens+tokensToAdd)
		v.lastUpdate = now
	}

	if v.tokens > 0 {
		v.tokens--
		return true
	}

	return false
}

// cleanupVisitors removes old visitors
func (rl *RateLimiter) cleanupVisitors() {
	ticker := time.NewTicker(rl.cleanup)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, v := range rl.visitors {
			if now.Sub(v.lastUpdate) > rl.window*2 {
				delete(rl.visitors, key)
			}
		}
		rl.mu.Unlock()
	}
}

// getIP extracts client IP from request
func getIP(r *http.Request) string {
	// Check X-Forwarded-For header
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded
	}

	// Check X-Real-IP header
	realIP := r.Header.Get("X-Real-IP")
	if realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	return r.RemoteAddr
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func respondJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	// Implementation would serialize v to JSON
}
