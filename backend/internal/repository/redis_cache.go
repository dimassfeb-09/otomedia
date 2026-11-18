package repository

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisCache struct {
	redisClient *redis.Client
}

func NewRedisCache(redisClient *redis.Client) *RedisCache {
	return &RedisCache{redisClient: redisClient}
}

func (redisCache *RedisCache) Get(ctx context.Context, key string) ([]byte, error) {
	value, err := redisCache.redisClient.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return value, nil
}

func (redisCache *RedisCache) Set(ctx context.Context, key string, value []byte, ttlSeconds int) error {
	return redisCache.redisClient.Set(ctx, key, value, time.Duration(ttlSeconds)*time.Second).Err()
}

func (redisCache *RedisCache) Delete(ctx context.Context, key string) error {
	return redisCache.redisClient.Del(ctx, key).Err()
}

func (redisCache *RedisCache) DeletePrefix(ctx context.Context, prefix string) error {
	var cursor uint64

	for {
		keys, nextCursor, err := redisCache.redisClient.Scan(ctx, cursor, prefix+"*", 100).Result()
		if err != nil {
			return err
		}

		if len(keys) > 0 {
			if err := redisCache.redisClient.Del(ctx, keys...).Err(); err != nil {
				return err
			}
		}

		cursor = nextCursor

		if cursor == 0 {
			break
		}
	}

	return nil
}
