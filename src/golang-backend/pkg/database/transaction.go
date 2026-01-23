package database

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
)

// TxFunc is a function that runs within a transaction
type TxFunc func(*sqlx.Tx) error

// WithTransaction runs a function within a database transaction
func WithTransaction(ctx context.Context, db *sqlx.DB, fn TxFunc) error {
	tx, err := db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("transaction error: %v, rollback error: %w", err, rbErr)
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// WithTransactionRetry runs a function within a transaction with retry logic
func WithTransactionRetry(ctx context.Context, db *sqlx.DB, maxRetries int, fn TxFunc) error {
	var err error
	for i := 0; i < maxRetries; i++ {
		err = WithTransaction(ctx, db, fn)
		if err == nil {
			return nil
		}
		
		// Check if error is retryable (e.g., deadlock, serialization failure)
		if !isRetryableError(err) {
			return err
		}
	}
	return fmt.Errorf("transaction failed after %d retries: %w", maxRetries, err)
}

// isRetryableError checks if error is retryable
func isRetryableError(err error) bool {
	// Add PostgreSQL specific error codes for retryable errors
	// 40001 - serialization_failure
	// 40P01 - deadlock_detected
	return false // Simplified for now
}

// ExecContext executes a query with context
func ExecContext(ctx context.Context, db *sqlx.DB, query string, args ...interface{}) (sql.Result, error) {
	return db.ExecContext(ctx, query, args...)
}

// QueryRowContext queries a single row with context
func QueryRowContext(ctx context.Context, db *sqlx.DB, dest interface{}, query string, args ...interface{}) error {
	return db.GetContext(ctx, dest, query, args...)
}

// QueryContext queries multiple rows with context
func QueryContext(ctx context.Context, db *sqlx.DB, dest interface{}, query string, args ...interface{}) error {
	return db.SelectContext(ctx, dest, query, args...)
}

// NamedExecContext executes a named query with context
func NamedExecContext(ctx context.Context, db *sqlx.DB, query string, arg interface{}) (sql.Result, error) {
	return db.NamedExecContext(ctx, query, arg)
}

// NamedQueryContext queries with named parameters
func NamedQueryContext(ctx context.Context, db *sqlx.DB, query string, arg interface{}) (*sqlx.Rows, error) {
	return db.NamedQueryContext(ctx, query, arg)
}

// Ping checks database connection
func Ping(ctx context.Context, db *sqlx.DB) error {
	return db.PingContext(ctx)
}

// Close closes database connection
func Close(db *sqlx.DB) error {
	return db.Close()
}

// GetStats returns database statistics
func GetStats(db *sqlx.DB) sql.DBStats {
	return db.Stats()
}

// SetMaxOpenConns sets maximum open connections
func SetMaxOpenConns(db *sqlx.DB, n int) {
	db.SetMaxOpenConns(n)
}

// SetMaxIdleConns sets maximum idle connections
func SetMaxIdleConns(db *sqlx.DB, n int) {
	db.SetMaxIdleConns(n)
}

// BuildPagination builds pagination SQL
func BuildPagination(page, limit int) (offset, actualLimit int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	
	offset = (page - 1) * limit
	return offset, limit
}

// BuildOrderBy builds ORDER BY clause
func BuildOrderBy(sortBy, order string, allowedFields []string) string {
	// Validate sortBy is in allowed fields
	isAllowed := false
	for _, field := range allowedFields {
		if field == sortBy {
			isAllowed = true
			break
		}
	}
	
	if !isAllowed {
		sortBy = "created_at"
	}
	
	// Validate order
	if order != "ASC" && order != "DESC" {
		order = "DESC"
	}
	
	return fmt.Sprintf("%s %s", sortBy, order)
}

// BuildWhereClause builds WHERE clause from conditions
func BuildWhereClause(conditions map[string]interface{}) (string, []interface{}) {
	if len(conditions) == 0 {
		return "", nil
	}
	
	where := "WHERE "
	args := make([]interface{}, 0, len(conditions))
	i := 1
	
	for key, value := range conditions {
		if i > 1 {
			where += " AND "
		}
		where += fmt.Sprintf("%s = $%d", key, i)
		args = append(args, value)
		i++
	}
	
	return where, args
}

// InTransaction checks if we're in a transaction
func InTransaction(db interface{}) bool {
	_, ok := db.(*sqlx.Tx)
	return ok
}
