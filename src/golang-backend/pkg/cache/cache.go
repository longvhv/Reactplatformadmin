package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache interface
type Cache interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
	Exists(ctx context.Context, key string) (bool, error)
	Expire(ctx context.Context, key string, ttl time.Duration) error
	GetJSON(ctx context.Context, key string, dest interface{}) error
	SetJSON(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Increment(ctx context.Context, key string) (int64, error)
	Decrement(ctx context.Context, key string) (int64, error)
	GetMultiple(ctx context.Context, keys []string) (map[string]string, error)
	SetMultiple(ctx context.Context, items map[string]interface{}, ttl time.Duration) error
	DeleteMultiple(ctx context.Context, keys []string) error
	Clear(ctx context.Context, pattern string) error
	Ping(ctx context.Context) error
}

// RedisCache implements Cache using Redis
type RedisCache struct {
	client *redis.Client
	prefix string
}

// NewRedisCache creates a new Redis cache
func NewRedisCache(client *redis.Client, prefix string) Cache {
	return &RedisCache{
		client: client,
		prefix: prefix,
	}
}

// prefixKey adds prefix to key
func (c *RedisCache) prefixKey(key string) string {
	if c.prefix == "" {
		return key
	}
	return fmt.Sprintf("%s:%s", c.prefix, key)
}

// Get gets value from cache
func (c *RedisCache) Get(ctx context.Context, key string) (string, error) {
	return c.client.Get(ctx, c.prefixKey(key)).Result()
}

// Set sets value in cache
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	return c.client.Set(ctx, c.prefixKey(key), value, ttl).Err()
}

// Delete deletes key from cache
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, c.prefixKey(key)).Err()
}

// Exists checks if key exists
func (c *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	n, err := c.client.Exists(ctx, c.prefixKey(key)).Result()
	return n > 0, err
}

// Expire sets expiration on key
func (c *RedisCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	return c.client.Expire(ctx, c.prefixKey(key), ttl).Err()
}

// GetJSON gets JSON value from cache
func (c *RedisCache) GetJSON(ctx context.Context, key string, dest interface{}) error {
	val, err := c.Get(ctx, key)
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(val), dest)
}

// SetJSON sets JSON value in cache
func (c *RedisCache) SetJSON(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.Set(ctx, key, string(data), ttl)
}

// Increment increments counter
func (c *RedisCache) Increment(ctx context.Context, key string) (int64, error) {
	return c.client.Incr(ctx, c.prefixKey(key)).Result()
}

// Decrement decrements counter
func (c *RedisCache) Decrement(ctx context.Context, key string) (int64, error) {
	return c.client.Decr(ctx, c.prefixKey(key)).Result()
}

// GetMultiple gets multiple values
func (c *RedisCache) GetMultiple(ctx context.Context, keys []string) (map[string]string, error) {
	prefixedKeys := make([]string, len(keys))
	for i, key := range keys {
		prefixedKeys[i] = c.prefixKey(key)
	}
	
	vals, err := c.client.MGet(ctx, prefixedKeys...).Result()
	if err != nil {
		return nil, err
	}
	
	result := make(map[string]string)
	for i, val := range vals {
		if val != nil {
			result[keys[i]] = val.(string)
		}
	}
	
	return result, nil
}

// SetMultiple sets multiple values
func (c *RedisCache) SetMultiple(ctx context.Context, items map[string]interface{}, ttl time.Duration) error {
	pipe := c.client.Pipeline()
	
	for key, value := range items {
		pipe.Set(ctx, c.prefixKey(key), value, ttl)
	}
	
	_, err := pipe.Exec(ctx)
	return err
}

// DeleteMultiple deletes multiple keys
func (c *RedisCache) DeleteMultiple(ctx context.Context, keys []string) error {
	prefixedKeys := make([]string, len(keys))
	for i, key := range keys {
		prefixedKeys[i] = c.prefixKey(key)
	}
	
	return c.client.Del(ctx, prefixedKeys...).Err()
}

// Clear clears all keys matching pattern
func (c *RedisCache) Clear(ctx context.Context, pattern string) error {
	iter := c.client.Scan(ctx, 0, c.prefixKey(pattern), 0).Iterator()
	
	var keys []string
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}
	
	if err := iter.Err(); err != nil {
		return err
	}
	
	if len(keys) > 0 {
		return c.client.Del(ctx, keys...).Err()
	}
	
	return nil
}

// Ping checks connection
func (c *RedisCache) Ping(ctx context.Context) error {
	return c.client.Ping(ctx).Err()
}

// CacheKey builders
func UserCacheKey(userID string) string {
	return fmt.Sprintf("user:%s", userID)
}

func TenantCacheKey(tenantID string) string {
	return fmt.Sprintf("tenant:%s", tenantID)
}

func SessionCacheKey(sessionID string) string {
	return fmt.Sprintf("session:%s", sessionID)
}

func RateLimitCacheKey(identifier string) string {
	return fmt.Sprintf("ratelimit:%s", identifier)
}

func PermissionCacheKey(userID, tenantID string) string {
	return fmt.Sprintf("permissions:%s:%s", tenantID, userID)
}

// Cache TTLs
const (
	DefaultTTL       = 1 * time.Hour
	ShortTTL         = 5 * time.Minute
	MediumTTL        = 30 * time.Minute
	LongTTL          = 24 * time.Hour
	SessionTTL       = 7 * 24 * time.Hour
	RateLimitTTL     = 1 * time.Minute
	PermissionTTL    = 15 * time.Minute
)

// Helper function to get or set cache
func GetOrSet(ctx context.Context, cache Cache, key string, ttl time.Duration, fn func() (interface{}, error)) (interface{}, error) {
	// Try to get from cache
	var result interface{}
	err := cache.GetJSON(ctx, key, &result)
	if err == nil {
		return result, nil
	}
	
	// If not in cache, call function
	result, err = fn()
	if err != nil {
		return nil, err
	}
	
	// Set in cache
	_ = cache.SetJSON(ctx, key, result, ttl)
	
	return result, nil
}
