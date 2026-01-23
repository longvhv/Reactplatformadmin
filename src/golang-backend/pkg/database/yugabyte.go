package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/lib/pq" // PostgreSQL/YugabyteDB driver
	"github.com/vhv-platform/backend/internal/config"
)

// YugabyteDB is PostgreSQL-compatible distributed SQL database
type YugabyteDB struct {
	DB *sql.DB
}

// NewYugabyteDB creates a new YugabyteDB connection
func NewYugabyteDB(cfg config.DatabaseConfig) (*YugabyteDB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host,
		cfg.Port,
		cfg.User,
		cfg.Password,
		cfg.DBName,
		cfg.SSLMode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open YugabyteDB: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(cfg.MaxOpenConns)
	db.SetMaxIdleConns(cfg.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	// Verify connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping YugabyteDB: %w", err)
	}

	return &YugabyteDB{DB: db}, nil
}

// Close closes the database connection
func (y *YugabyteDB) Close() error {
	return y.DB.Close()
}

// Health checks database health
func (y *YugabyteDB) Health(ctx context.Context) error {
	return y.DB.PingContext(ctx)
}

// BeginTx starts a new transaction
func (y *YugabyteDB) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return y.DB.BeginTx(ctx, nil)
}
