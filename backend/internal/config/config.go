package config

import (
	"os"
)

type Config struct {
	MySQLDSN  string
	RedisAddr string
	Port      string
}

func Load() Config {
	mysqlDsn := os.Getenv("MYSQL_DSN")
	if mysqlDsn == "" {
		mysqlDsn = "root:password@tcp(localhost:3306)/taskmanager?parseTime=true&multiStatements=true"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	return Config{MySQLDSN: mysqlDsn, RedisAddr: redisAddr, Port: port}
}
