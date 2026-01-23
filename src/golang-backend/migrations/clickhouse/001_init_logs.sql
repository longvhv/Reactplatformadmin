-- ClickHouse Logging Schema
-- Authentication Logs
CREATE TABLE IF NOT EXISTS telemetry.auth_logs (
    id UUID DEFAULT generateUUIDv4(),
    user_id UUID,
    email String,
    action LowCardinality(String),
    success Bool,
    ip_address String,
    user_agent String,
    error_message Nullable(String),
    metadata String DEFAULT '{}',
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, user_id)
TTL created_at + INTERVAL 90 DAY;

-- Audit Logs
CREATE TABLE IF NOT EXISTS telemetry.audit_logs (
    id UUID DEFAULT generateUUIDv4(),
    user_id UUID,
    tenant_id Nullable(UUID),
    action LowCardinality(String),
    resource_type LowCardinality(String),
    resource_id UUID,
    changes String DEFAULT '{}',
    ip_address String,
    user_agent String,
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, tenant_id, user_id)
TTL created_at + INTERVAL 365 DAY;

-- Traffic Logs (HTTP Requests)
CREATE TABLE IF NOT EXISTS telemetry.traffic_logs (
    id UUID DEFAULT generateUUIDv4(),
    request_id String,
    method LowCardinality(String),
    path String,
    status_code UInt16,
    duration_ms UInt32,
    request_size UInt32,
    response_size UInt32,
    ip_address String,
    user_agent String,
    user_id Nullable(UUID),
    tenant_id Nullable(UUID),
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, status_code)
TTL created_at + INTERVAL 30 DAY;

-- Error Logs
CREATE TABLE IF NOT EXISTS telemetry.error_logs (
    id UUID DEFAULT generateUUIDv4(),
    error_type LowCardinality(String),
    error_message String,
    stack_trace String,
    request_id Nullable(String),
    user_id Nullable(UUID),
    tenant_id Nullable(UUID),
    metadata String DEFAULT '{}',
    severity LowCardinality(String),
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, severity)
TTL created_at + INTERVAL 90 DAY;

-- API Usage Logs
CREATE TABLE IF NOT EXISTS telemetry.api_usage_logs (
    id UUID DEFAULT generateUUIDv4(),
    user_id UUID,
    tenant_id UUID,
    endpoint String,
    method LowCardinality(String),
    response_time_ms UInt32,
    status_code UInt16,
    request_count UInt32 DEFAULT 1,
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, tenant_id, user_id)
TTL created_at + INTERVAL 180 DAY;

-- Session Logs
CREATE TABLE IF NOT EXISTS telemetry.session_logs (
    id UUID DEFAULT generateUUIDv4(),
    session_id UUID,
    user_id UUID,
    tenant_id Nullable(UUID),
    event_type LowCardinality(String),
    ip_address String,
    user_agent String,
    metadata String DEFAULT '{}',
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, user_id)
TTL created_at + INTERVAL 90 DAY;

-- Webhook Logs
CREATE TABLE IF NOT EXISTS telemetry.webhook_logs (
    id UUID DEFAULT generateUUIDv4(),
    webhook_id UUID,
    tenant_id UUID,
    event_type LowCardinality(String),
    url String,
    method LowCardinality(String),
    status_code UInt16,
    response_time_ms UInt32,
    request_body String,
    response_body String,
    success Bool,
    error_message Nullable(String),
    retry_count UInt8 DEFAULT 0,
    created_at DateTime64(3) DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (created_at, tenant_id)
TTL created_at + INTERVAL 90 DAY;

-- Create materialized views for analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry.auth_stats_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, action, success)
AS SELECT
    toStartOfHour(created_at) AS hour,
    action,
    success,
    count() AS count
FROM telemetry.auth_logs
GROUP BY hour, action, success;

CREATE MATERIALIZED VIEW IF NOT EXISTS telemetry.traffic_stats_hourly
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, status_code)
AS SELECT
    toStartOfHour(created_at) AS hour,
    status_code,
    count() AS request_count,
    avg(duration_ms) AS avg_duration_ms,
    sum(request_size) AS total_request_size,
    sum(response_size) AS total_response_size
FROM telemetry.traffic_logs
GROUP BY hour, status_code;
