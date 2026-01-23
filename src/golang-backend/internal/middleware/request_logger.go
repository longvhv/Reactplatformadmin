package middleware

import (
	"net/http"
	"time"

	"go.uber.org/zap"
)

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	written    int64
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
	}
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.written += int64(n)
	return n, err
}

// RequestLogger logs HTTP requests
func RequestLogger(logger *zap.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Wrap response writer
			rw := newResponseWriter(w)

			// Process request
			next.ServeHTTP(rw, r)

			// Log request
			duration := time.Since(start)
			
			fields := []zap.Field{
				zap.String("method", r.Method),
				zap.String("path", r.URL.Path),
				zap.String("query", r.URL.RawQuery),
				zap.Int("status", rw.statusCode),
				zap.Duration("duration", duration),
				zap.Int64("bytes", rw.written),
				zap.String("ip", getIP(r)),
				zap.String("user_agent", r.UserAgent()),
				zap.String("request_id", r.Header.Get("X-Request-ID")),
			}

			// Log with appropriate level based on status code
			if rw.statusCode >= 500 {
				logger.Error("HTTP request", fields...)
			} else if rw.statusCode >= 400 {
				logger.Warn("HTTP request", fields...)
			} else {
				logger.Info("HTTP request", fields...)
			}
		})
	}
}
