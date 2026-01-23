package middleware

import (
	"net/http"
	"runtime/debug"

	"github.com/vhv-platform/backend/internal/models"
	"go.uber.org/zap"
)

// Recovery middleware recovers from panics and logs the error
func Recovery(logger *zap.Logger) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					// Log the panic
					logger.Error("Panic recovered",
						zap.Any("error", err),
						zap.String("path", r.URL.Path),
						zap.String("method", r.Method),
						zap.String("stack", string(debug.Stack())),
					)

					// Return internal server error
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					
					response := models.NewErrorResponse(
						"INTERNAL_ERROR",
						"An unexpected error occurred. Please try again later.",
					)
					
					// Write response (simplified)
					w.Write([]byte(`{"success":false,"error":{"code":"INTERNAL_ERROR","message":"An unexpected error occurred"}}`))
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
