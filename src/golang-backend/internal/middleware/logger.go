package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger middleware logs HTTP requests
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()

		// Process request
		c.Next()

		// Calculate latency
		latency := time.Since(startTime)

		// Get request info
		statusCode := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path
		clientIP := c.ClientIP()

		// Log request
		log.Printf("[%s] %d | %13v | %15s | %-7s %s",
			time.Now().Format("2006-01-02 15:04:05"),
			statusCode,
			latency,
			clientIP,
			method,
			path,
		)
	}
}
