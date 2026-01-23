package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/vhv-platform/backend/internal/config"
)

// DragonflyCache wraps Redis Dragonfly client
type DragonflyCache struct {
	client *redis.Client
}

// NewDragonflyCache creates a new Dragonfly cache client
func NewDragonflyCache(cfg config.CacheConfig) (*DragonflyCache, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     cfg.PoolSize,
		MinIdleConns: cfg.MinIdleConns,
		MaxRetries:   3,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Dragonfly: %w", err)
	}

	return &DragonflyCache{client: client}, nil
}

// Get retrieves a value from cache
func (d *DragonflyCache) Get(ctx context.Context, key string) (string, error) {
	val, err := d.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", nil
	}
	return val, err
}

// Set stores a value in cache with TTL
func (d *DragonflyCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	return d.client.Set(ctx, key, value, ttl).Err()
}

// GetJSON retrieves and unmarshals JSON from cache
func (d *DragonflyCache) GetJSON(ctx context.Context, key string, dest interface{}) error {
	val, err := d.Get(ctx, key)
	if err != nil {
		return err
	}
	if val == "" {
		return redis.Nil
	}
	return json.Unmarshal([]byte(val), dest)
}

// SetJSON marshals and stores JSON in cache
func (d *DragonflyCache) SetJSON(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}
	return d.Set(ctx, key, data, ttl)
}

// Delete removes a key from cache
func (d *DragonflyCache) Delete(ctx context.Context, keys ...string) error {
	return d.client.Del(ctx, keys...).Err()
}

// Exists checks if key exists
func (d *DragonflyCache) Exists(ctx context.Context, key string) (bool, error) {
	result, err := d.client.Exists(ctx, key).Result()
	return result > 0, err
}

// Expire sets TTL for a key
func (d *DragonflyCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	return d.client.Expire(ctx, key, ttl).Err()
}

// Increment increments a counter
func (d *DragonflyCache) Increment(ctx context.Context, key string) (int64, error) {
	return d.client.Incr(ctx, key).Result()
}

// IncrementBy increments a counter by value
func (d *DragonflyCache) IncrementBy(ctx context.Context, key string, value int64) (int64, error) {
	return d.client.IncrBy(ctx, key, value).Result()
}

// GetMulti retrieves multiple keys
func (d *DragonflyCache) GetMulti(ctx context.Context, keys ...string) ([]interface{}, error) {
	return d.client.MGet(ctx, keys...).Result()
}

// SetMulti stores multiple key-value pairs
func (d *DragonflyCache) SetMulti(ctx context.Context, pairs map[string]interface{}, ttl time.Duration) error {
	pipe := d.client.Pipeline()
	for key, value := range pairs {
		pipe.Set(ctx, key, value, ttl)
	}
	_, err := pipe.Exec(ctx)
	return err
}

// FlushDB clears all keys in current DB
func (d *DragonflyCache) FlushDB(ctx context.Context) error {
	return d.client.FlushDB(ctx).Err()
}

// Close closes the cache connection
func (d *DragonflyCache) Close() error {
	return d.client.Close()
}

// Health checks cache health
func (d *DragonflyCache) Health(ctx context.Context) error {
	return d.client.Ping(ctx).Err()
}

// GetKeys returns all keys matching pattern
func (d *DragonflyCache) GetKeys(ctx context.Context, pattern string) ([]string, error) {
	return d.client.Keys(ctx, pattern).Result()
}

// SetNX sets key only if it doesn't exist (atomic)
func (d *DragonflyCache) SetNX(ctx context.Context, key string, value interface{}, ttl time.Duration) (bool, error) {
	return d.client.SetNX(ctx, key, value, ttl).Result()
}

// GetDel gets and deletes a key atomically
func (d *DragonflyCache) GetDel(ctx context.Context, key string) (string, error) {
	return d.client.GetDel(ctx, key).Result()
}
