package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vhv-platform/backend/internal/utils"
)

// Recovery middleware recovers from panics
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				utils.ErrorResponse(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error")
				c.Abort()
			}
		}()
		c.Next()
	}
}
