package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds all application configuration
type Config struct {
	Server     ServerConfig
	Database   DatabaseConfig
	ClickHouse ClickHouseConfig
	Cache      CacheConfig
	JWT        JWTConfig
	Auth       AuthConfig
	CORS       CORSConfig
	Logger     LoggerConfig
}

// ServerConfig holds server configuration
type ServerConfig struct {
	Port        int
	Host        string
	Environment string
	APIVersion  string
	BasePath    string
}

// DatabaseConfig holds YugabyteDB configuration
type DatabaseConfig struct {
	Host            string
	Port            int
	User            string
	Password        string
	DBName          string
	SSLMode         string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// ClickHouseConfig holds ClickHouse configuration
type ClickHouseConfig struct {
	Host            string
	Port            int
	User            string
	Password        string
	DBName          string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// CacheConfig holds Dragonfly cache configuration
type CacheConfig struct {
	Host         string
	Port         int
	Password     string
	DB           int
	PoolSize     int
	MinIdleConns int
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret               string
	AccessTokenExpiry    time.Duration
	RefreshTokenExpiry   time.Duration
	Issuer               string
	Audience             string
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	PasswordMinLength      int
	PasswordRequireUpper   bool
	PasswordRequireLower   bool
	PasswordRequireNumber  bool
	PasswordRequireSpecial bool
	MaxLoginAttempts       int
	LockoutDuration        time.Duration
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowedOrigins   []string
	AllowedMethods   []string
	AllowedHeaders   []string
	AllowCredentials bool
	MaxAge           int
}

// LoggerConfig holds logger configuration
type LoggerConfig struct {
	Level      string
	Format     string
	Output     string
	FilePath   string
	MaxSize    int
	MaxBackups int
	MaxAge     int
	Compress   bool
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	cfg := &Config{
		Server: ServerConfig{
			Port:        getEnvAsInt("SERVER_PORT", 8080),
			Host:        getEnv("SERVER_HOST", "0.0.0.0"),
			Environment: getEnv("SERVER_ENV", "development"),
			APIVersion:  getEnv("API_VERSION", "v1"),
			BasePath:    getEnv("API_BASE_PATH", "/api/v1"),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnvAsInt("DB_PORT", 5433),
			User:            getEnv("DB_USER", "yugabyte"),
			Password:        getEnv("DB_PASSWORD", "yugabyte"),
			DBName:          getEnv("DB_NAME", "vhv_platform"),
			SSLMode:         getEnv("DB_SSL_MODE", "disable"),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", 5*time.Minute),
		},
		ClickHouse: ClickHouseConfig{
			Host:            getEnv("CLICKHOUSE_HOST", "localhost"),
			Port:            getEnvAsInt("CLICKHOUSE_PORT", 9000),
			User:            getEnv("CLICKHOUSE_USER", "default"),
			Password:        getEnv("CLICKHOUSE_PASSWORD", ""),
			DBName:          getEnv("CLICKHOUSE_DB", "vhv_logs"),
			MaxOpenConns:    getEnvAsInt("CLICKHOUSE_MAX_OPEN_CONNS", 10),
			MaxIdleConns:    getEnvAsInt("CLICKHOUSE_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: getEnvAsDuration("CLICKHOUSE_CONN_MAX_LIFETIME", 5*time.Minute),
		},
		Cache: CacheConfig{
			Host:         getEnv("REDIS_HOST", "localhost"),
			Port:         getEnvAsInt("REDIS_PORT", 6379),
			Password:     getEnv("REDIS_PASSWORD", ""),
			DB:           getEnvAsInt("REDIS_DB", 0),
			PoolSize:     getEnvAsInt("REDIS_POOL_SIZE", 10),
			MinIdleConns: getEnvAsInt("REDIS_MIN_IDLE_CONNS", 5),
		},
		JWT: JWTConfig{
			Secret:             getEnv("JWT_SECRET", "your-secret-key"),
			AccessTokenExpiry:  getEnvAsDuration("JWT_ACCESS_TOKEN_EXPIRY", 15*time.Minute),
			RefreshTokenExpiry: getEnvAsDuration("JWT_REFRESH_TOKEN_EXPIRY", 7*24*time.Hour),
			Issuer:             getEnv("JWT_ISSUER", "vhv-platform"),
			Audience:           getEnv("JWT_AUDIENCE", "vhv-platform-api"),
		},
		Auth: AuthConfig{
			PasswordMinLength:      getEnvAsInt("AUTH_PASSWORD_MIN_LENGTH", 8),
			PasswordRequireUpper:   getEnvAsBool("AUTH_PASSWORD_REQUIRE_UPPERCASE", true),
			PasswordRequireLower:   getEnvAsBool("AUTH_PASSWORD_REQUIRE_LOWERCASE", true),
			PasswordRequireNumber:  getEnvAsBool("AUTH_PASSWORD_REQUIRE_NUMBER", true),
			PasswordRequireSpecial: getEnvAsBool("AUTH_PASSWORD_REQUIRE_SPECIAL", true),
			MaxLoginAttempts:       getEnvAsInt("AUTH_MAX_LOGIN_ATTEMPTS", 5),
			LockoutDuration:        getEnvAsDuration("AUTH_LOCKOUT_DURATION", 15*time.Minute),
		},
		CORS: CORSConfig{
			AllowedOrigins:   getEnvAsSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
			AllowedMethods:   getEnvAsSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}),
			AllowedHeaders:   getEnvAsSlice("CORS_ALLOWED_HEADERS", []string{"Content-Type", "Authorization", "X-Request-ID"}),
			AllowCredentials: getEnvAsBool("CORS_ALLOW_CREDENTIALS", true),
			MaxAge:           getEnvAsInt("CORS_MAX_AGE", 86400),
		},
		Logger: LoggerConfig{
			Level:      getEnv("LOG_LEVEL", "debug"),
			Format:     getEnv("LOG_FORMAT", "json"),
			Output:     getEnv("LOG_OUTPUT", "stdout"),
			FilePath:   getEnv("LOG_FILE_PATH", "logs/app.log"),
			MaxSize:    getEnvAsInt("LOG_MAX_SIZE", 100),
			MaxBackups: getEnvAsInt("LOG_MAX_BACKUPS", 3),
			MaxAge:     getEnvAsInt("LOG_MAX_AGE", 28),
			Compress:   getEnvAsBool("LOG_COMPRESS", true),
		},
	}

	return cfg, nil
}

// Helper functions

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	valueStr := os.Getenv(key)
	if value, err := time.ParseDuration(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	
	var result []string
	for _, v := range splitString(valueStr, ",") {
		result = append(result, v)
	}
	return result
}

func splitString(s, sep string) []string {
	var result []string
	current := ""
	for _, char := range s {
		if string(char) == sep {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(char)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

// DSN returns database DSN string
func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.DBName, d.SSLMode,
	)
}

// Validate validates configuration
func (c *Config) Validate() error {
	if c.Server.Port < 1 || c.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", c.Server.Port)
	}

	if c.Database.Host == "" {
		return fmt.Errorf("database host is required")
	}

	if c.JWT.Secret == "" || c.JWT.Secret == "your-secret-key" {
		return fmt.Errorf("JWT secret must be set")
	}

	return nil
}
