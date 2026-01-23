package logger

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/sirupsen/logrus"
)

// Logger interface
type Logger interface {
	Debug(args ...interface{})
	Debugf(format string, args ...interface{})
	Info(args ...interface{})
	Infof(format string, args ...interface{})
	Warn(args ...interface{})
	Warnf(format string, args ...interface{})
	Error(args ...interface{})
	Errorf(format string, args ...interface{})
	Fatal(args ...interface{})
	Fatalf(format string, args ...interface{})
	WithField(key string, value interface{}) Logger
	WithFields(fields map[string]interface{}) Logger
	WithContext(ctx context.Context) Logger
}

// LogrusLogger wraps logrus logger
type LogrusLogger struct {
	logger *logrus.Logger
	entry  *logrus.Entry
}

// New creates a new logger
func New(level string) Logger {
	logger := logrus.New()
	
	// Set log level
	logLevel, err := logrus.ParseLevel(level)
	if err != nil {
		logLevel = logrus.InfoLevel
	}
	logger.SetLevel(logLevel)
	
	// Set formatter
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
		FieldMap: logrus.FieldMap{
			logrus.FieldKeyTime:  "timestamp",
			logrus.FieldKeyLevel: "level",
			logrus.FieldKeyMsg:   "message",
		},
	})
	
	// Set output
	logger.SetOutput(os.Stdout)
	
	return &LogrusLogger{
		logger: logger,
		entry:  logrus.NewEntry(logger),
	}
}

// NewWithWriter creates a new logger with custom writer
func NewWithWriter(level string, writer io.Writer) Logger {
	logger := logrus.New()
	
	logLevel, err := logrus.ParseLevel(level)
	if err != nil {
		logLevel = logrus.InfoLevel
	}
	logger.SetLevel(logLevel)
	
	logger.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: time.RFC3339,
	})
	
	logger.SetOutput(writer)
	
	return &LogrusLogger{
		logger: logger,
		entry:  logrus.NewEntry(logger),
	}
}

func (l *LogrusLogger) Debug(args ...interface{}) {
	l.entry.Debug(args...)
}

func (l *LogrusLogger) Debugf(format string, args ...interface{}) {
	l.entry.Debugf(format, args...)
}

func (l *LogrusLogger) Info(args ...interface{}) {
	l.entry.Info(args...)
}

func (l *LogrusLogger) Infof(format string, args ...interface{}) {
	l.entry.Infof(format, args...)
}

func (l *LogrusLogger) Warn(args ...interface{}) {
	l.entry.Warn(args...)
}

func (l *LogrusLogger) Warnf(format string, args ...interface{}) {
	l.entry.Warnf(format, args...)
}

func (l *LogrusLogger) Error(args ...interface{}) {
	l.entry.Error(args...)
}

func (l *LogrusLogger) Errorf(format string, args ...interface{}) {
	l.entry.Errorf(format, args...)
}

func (l *LogrusLogger) Fatal(args ...interface{}) {
	l.entry.Fatal(args...)
}

func (l *LogrusLogger) Fatalf(format string, args ...interface{}) {
	l.entry.Fatalf(format, args...)
}

func (l *LogrusLogger) WithField(key string, value interface{}) Logger {
	return &LogrusLogger{
		logger: l.logger,
		entry:  l.entry.WithField(key, value),
	}
}

func (l *LogrusLogger) WithFields(fields map[string]interface{}) Logger {
	return &LogrusLogger{
		logger: l.logger,
		entry:  l.entry.WithFields(fields),
	}
}

func (l *LogrusLogger) WithContext(ctx context.Context) Logger {
	entry := l.entry
	
	// Extract request ID from context if exists
	if reqID := ctx.Value("request_id"); reqID != nil {
		entry = entry.WithField("request_id", reqID)
	}
	
	// Extract user ID from context if exists
	if userID := ctx.Value("user_id"); userID != nil {
		entry = entry.WithField("user_id", userID)
	}
	
	// Extract tenant ID from context if exists
	if tenantID := ctx.Value("tenant_id"); tenantID != nil {
		entry = entry.WithField("tenant_id", tenantID)
	}
	
	return &LogrusLogger{
		logger: l.logger,
		entry:  entry,
	}
}

// Helper functions for structured logging

// LogError logs an error with context
func LogError(logger Logger, err error, message string, fields map[string]interface{}) {
	if fields == nil {
		fields = make(map[string]interface{})
	}
	fields["error"] = err.Error()
	logger.WithFields(fields).Error(message)
}

// LogRequest logs an HTTP request
func LogRequest(logger Logger, method, path string, statusCode int, duration time.Duration) {
	logger.WithFields(map[string]interface{}{
		"method":      method,
		"path":        path,
		"status_code": statusCode,
		"duration_ms": duration.Milliseconds(),
	}).Info("HTTP request")
}

// LogDBQuery logs a database query
func LogDBQuery(logger Logger, query string, duration time.Duration, err error) {
	fields := map[string]interface{}{
		"query":       query,
		"duration_ms": duration.Milliseconds(),
	}
	
	if err != nil {
		fields["error"] = err.Error()
		logger.WithFields(fields).Error("Database query failed")
	} else {
		logger.WithFields(fields).Debug("Database query executed")
	}
}

// LogCacheOperation logs a cache operation
func LogCacheOperation(logger Logger, operation, key string, hit bool, duration time.Duration) {
	logger.WithFields(map[string]interface{}{
		"operation":   operation,
		"key":         key,
		"hit":         hit,
		"duration_ms": duration.Milliseconds(),
	}).Debug("Cache operation")
}

// LogServiceCall logs a service call
func LogServiceCall(logger Logger, service, method string, duration time.Duration, err error) {
	fields := map[string]interface{}{
		"service":     service,
		"method":      method,
		"duration_ms": duration.Milliseconds(),
	}
	
	if err != nil {
		fields["error"] = err.Error()
		logger.WithFields(fields).Error("Service call failed")
	} else {
		logger.WithFields(fields).Debug("Service call completed")
	}
}

// Default logger instance
var defaultLogger Logger

func init() {
	defaultLogger = New("info")
}

// Default functions using default logger
func Debug(args ...interface{}) {
	defaultLogger.Debug(args...)
}

func Debugf(format string, args ...interface{}) {
	defaultLogger.Debugf(format, args...)
}

func Info(args ...interface{}) {
	defaultLogger.Info(args...)
}

func Infof(format string, args ...interface{}) {
	defaultLogger.Infof(format, args...)
}

func Warn(args ...interface{}) {
	defaultLogger.Warn(args...)
}

func Warnf(format string, args ...interface{}) {
	defaultLogger.Warnf(format, args...)
}

func Error(args ...interface{}) {
	defaultLogger.Error(args...)
}

func Errorf(format string, args ...interface{}) {
	defaultLogger.Errorf(format, args...)
}

func Fatal(args ...interface{}) {
	defaultLogger.Fatal(args...)
}

func Fatalf(format string, args ...interface{}) {
	defaultLogger.Fatalf(format, args...)
}

func WithField(key string, value interface{}) Logger {
	return defaultLogger.WithField(key, value)
}

func WithFields(fields map[string]interface{}) Logger {
	return defaultLogger.WithFields(fields)
}

func WithContext(ctx context.Context) Logger {
	return defaultLogger.WithContext(ctx)
}

// SetDefault sets the default logger
func SetDefault(logger Logger) {
	defaultLogger = logger
}

// Example usage logger
func ExampleUsage() {
	logger := New("debug")
	
	// Simple logging
	logger.Info("Application started")
	
	// With fields
	logger.WithFields(map[string]interface{}{
		"user_id":   "123",
		"tenant_id": "456",
	}).Info("User logged in")
	
	// With error
	err := fmt.Errorf("something went wrong")
	logger.WithField("error", err).Error("Operation failed")
	
	// Chain fields
	logger.
		WithField("service", "user-service").
		WithField("method", "CreateUser").
		Info("Creating user")
}
