package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/vhv-platform/backend/internal/config"
)

// ClickHouse for analytics and logging
type ClickHouse struct {
	DB *sql.DB
}

// NewClickHouse creates a new ClickHouse connection
func NewClickHouse(cfg config.ClickHouseConfig) (*ClickHouse, error) {
	dsn := fmt.Sprintf(
		"clickhouse://%s:%s@%s:%d/%s?dial_timeout=10s&max_execution_time=60",
		cfg.User,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.DBName,
	)

	db, err := sql.Open("clickhouse", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open ClickHouse: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	// Verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping ClickHouse: %w", err)
	}

	return &ClickHouse{DB: db}, nil
}

// Close closes the ClickHouse connection
func (c *ClickHouse) Close() error {
	return c.DB.Close()
}

// Health checks ClickHouse health
func (c *ClickHouse) Health(ctx context.Context) error {
	return c.DB.PingContext(ctx)
}

// BatchInsert inserts data in batches for better performance
func (c *ClickHouse) BatchInsert(ctx context.Context, query string, data [][]interface{}) error {
	tx, err := c.DB.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.PrepareContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, row := range data {
		if _, err := stmt.ExecContext(ctx, row...); err != nil {
			return fmt.Errorf("failed to insert row: %w", err)
		}
	}

	return tx.Commit()
}
