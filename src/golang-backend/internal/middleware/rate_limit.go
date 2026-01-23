package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/vhv-platform/backend/pkg/cache"
)

// RateLimiter middleware limits requests per client
type RateLimiter struct {
	cache            *cache.DragonflyCache
	requestsPerMin   int
	windowDuration   time.Duration
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(cache *cache.DragonflyCache, requestsPerMin int) *RateLimiter {
	return &RateLimiter{
		cache:          cache,
		requestsPerMin: requestsPerMin,
		windowDuration: time.Minute,
	}
}

// Limit rate limits requests
func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Use IP address as client identifier
		clientIP := r.RemoteAddr
		key := fmt.Sprintf("rate_limit:%s", clientIP)

		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		// Increment request count
		count, err := rl.cache.IncrementBy(ctx, key, 1)
		if err != nil {
			// If cache fails, allow the request
			next.ServeHTTP(w, r)
			return
		}

		// Set expiry on first request
		if count == 1 {
			rl.cache.Expire(ctx, key, rl.windowDuration)
		}

		// Check if rate limit exceeded
		if count > int64(rl.requestsPerMin) {
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rl.requestsPerMin))
			w.Header().Set("X-RateLimit-Remaining", "0")
			w.Header().Set("Retry-After", "60")
			
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"success":false,"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Too many requests"}}`))
			return
		}

		// Add rate limit headers
		remaining := rl.requestsPerMin - int(count)
		w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rl.requestsPerMin))
		w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

		next.ServeHTTP(w, r)
	})
}
