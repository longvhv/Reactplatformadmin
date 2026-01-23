# ⚡ PERFORMANCE TEST STRATEGY - GOLANG BACKEND

**Complete strategy for performance testing, benchmarking, and optimization**

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Benchmark Tests](#benchmark-tests)
3. [Load Testing](#load-testing)
4. [Profiling](#profiling)
5. [Optimization](#optimization)
6. [Monitoring](#monitoring)

---

## 🎯 OVERVIEW

### Performance Goals

| Metric | Target | Critical |
|--------|--------|----------|
| **API Response Time** | <100ms (p95) | <200ms |
| **Database Query** | <50ms (p95) | <100ms |
| **Cache Hit Rate** | >80% | >60% |
| **Throughput** | >1000 req/s | >500 req/s |
| **Memory Usage** | <512MB | <1GB |
| **CPU Usage** | <50% | <80% |

### Testing Phases

```
Phase 1: Benchmark Tests     ✅ Measure individual functions
Phase 2: Load Testing        🎯 Test under realistic load
Phase 3: Stress Testing      🎯 Find breaking points
Phase 4: Endurance Testing   🎯 Long-running stability
Phase 5: Spike Testing       🎯 Handle traffic spikes
```

---

## 🏃 BENCHMARK TESTS

### Go Benchmark Basics

```go
// Example: internal/service/region_service_benchmark_test.go
package service

import (
    "context"
    "testing"

    "github.com/google/uuid"
    "golang-backend/internal/models"
)

func BenchmarkRegionService_GetByID(b *testing.B) {
    // Setup
    mockRepo := new(MockRegionRepository)
    service := NewRegionService(mockRepo)
    ctx := context.Background()
    id := uuid.New()

    region := &models.Region{
        ID:   id,
        Name: "Test Region",
        Code: "TEST",
    }

    mockRepo.On("GetByID", ctx, id).Return(region, nil)

    // Reset timer before benchmark
    b.ResetTimer()

    // Run benchmark
    for i := 0; i < b.N; i++ {
        _, _ = service.GetByID(ctx, id)
    }
}

func BenchmarkRegionService_ListRegions(b *testing.B) {
    mockRepo := new(MockRegionRepository)
    service := NewRegionService(mockRepo)
    ctx := context.Background()

    regions := make([]*models.Region, 100)
    for i := 0; i < 100; i++ {
        regions[i] = &models.Region{
            ID:   uuid.New(),
            Name: fmt.Sprintf("Region %d", i),
        }
    }

    mockRepo.On("List", ctx, 100, 0).Return(regions, int64(100), nil)

    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        _, _, _ = service.ListRegions(ctx, 1, 100)
    }
}

// Benchmark with different data sizes
func BenchmarkRegionService_GetHierarchy(b *testing.B) {
    sizes := []int{10, 100, 1000}

    for _, size := range sizes {
        b.Run(fmt.Sprintf("Size_%d", size), func(b *testing.B) {
            // Setup with specific size
            mockRepo := setupMockWithSize(size)
            service := NewRegionService(mockRepo)
            ctx := context.Background()
            id := uuid.New()

            b.ResetTimer()

            for i := 0; i < b.N; i++ {
                _, _ = service.GetHierarchy(ctx, id)
            }
        })
    }
}

// Benchmark with memory allocation tracking
func BenchmarkRegionService_CreateRegion_Memory(b *testing.B) {
    mockRepo := new(MockRegionRepository)
    service := NewRegionService(mockRepo)
    ctx := context.Background()

    req := &models.CreateRegionRequest{
        Name: "Test Region",
        Code: "TEST",
        Type: "COUNTRY",
    }

    mockRepo.On("Create", ctx, mock.Anything).Return(nil)

    b.ReportAllocs() // Report memory allocations

    b.ResetTimer()

    for i := 0; i < b.N; i++ {
        _, _ = service.CreateRegion(ctx, req)
    }
}
```

### Running Benchmarks

```bash
# Run all benchmarks
go test -bench=. ./internal/service/...

# Run specific benchmark
go test -bench=BenchmarkRegionService_GetByID ./internal/service/

# With memory stats
go test -bench=. -benchmem ./internal/service/...

# Run multiple times for accuracy
go test -bench=. -benchtime=10s ./internal/service/...

# Compare benchmarks
go test -bench=. -benchmem ./internal/service/... > old.txt
# Make changes
go test -bench=. -benchmem ./internal/service/... > new.txt
benchcmp old.txt new.txt
```

### Benchmark Targets

| Operation | Target | Acceptable |
|-----------|--------|------------|
| **GetByID** | <1ms | <5ms |
| **Create** | <2ms | <10ms |
| **List (100)** | <10ms | <50ms |
| **Update** | <2ms | <10ms |
| **Delete** | <2ms | <10ms |
| **Hierarchy** | <20ms | <100ms |

---

## 🔥 LOAD TESTING

### Tools

**k6** (Recommended) - Modern load testing tool

Install:
```bash
brew install k6
# or
apt-get install k6
```

### k6 Test Script

Create `tests/load/basic_load_test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 50 },   // Stay at 50 users
        { duration: '1m', target: 100 },  // Ramp up to 100 users
        { duration: '3m', target: 100 },  // Stay at 100 users
        { duration: '1m', target: 0 },    // Ramp down to 0 users
    ],
    thresholds: {
        http_req_duration: ['p(95)<200'], // 95% of requests < 200ms
        http_req_failed: ['rate<0.01'],   // Error rate < 1%
    },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
    // Test API endpoints
    let responses = http.batch([
        ['GET', `${BASE_URL}/api/v1/regions`],
        ['GET', `${BASE_URL}/api/v1/tenants`],
        ['GET', `${BASE_URL}/api/v1/users`],
    ]);

    responses.forEach((response) => {
        check(response, {
            'status is 200': (r) => r.status === 200,
            'response time < 200ms': (r) => r.timings.duration < 200,
        });
    });

    sleep(1);
}
```

### Region Service Load Test

Create `tests/load/region_service_test.js`:

```javascript
import http from 'k6/http';
import { check, group } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 },
    ],
};

const BASE_URL = 'http://localhost:8080';

export default function () {
    group('Region API Tests', function () {
        // List regions
        group('List Regions', function () {
            let res = http.get(`${BASE_URL}/api/v1/regions?page=1&limit=100`);
            check(res, {
                'status is 200': (r) => r.status === 200,
                'response time < 100ms': (r) => r.timings.duration < 100,
                'has data': (r) => r.json('data').length > 0,
            });
        });

        // Get by ID
        group('Get Region by ID', function () {
            let res = http.get(`${BASE_URL}/api/v1/regions/some-uuid`);
            check(res, {
                'status is 200 or 404': (r) => [200, 404].includes(r.status),
                'response time < 50ms': (r) => r.timings.duration < 50,
            });
        });

        // Get hierarchy
        group('Get Region Hierarchy', function () {
            let res = http.get(`${BASE_URL}/api/v1/regions/some-uuid/hierarchy`);
            check(res, {
                'status is 200 or 404': (r) => [200, 404].includes(r.status),
                'response time < 200ms': (r) => r.timings.duration < 200,
            });
        });
    });
}
```

### Running Load Tests

```bash
# Run basic load test
k6 run tests/load/basic_load_test.js

# Run with cloud output
k6 run --out cloud tests/load/basic_load_test.js

# Run with influxdb output (for Grafana)
k6 run --out influxdb=http://localhost:8086/k6 tests/load/basic_load_test.js

# Run specific test
k6 run tests/load/region_service_test.js

# Run with custom VUs
k6 run --vus 100 --duration 30s tests/load/basic_load_test.js
```

### Stress Testing

Create `tests/load/stress_test.js`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
    stages: [
        { duration: '2m', target: 100 },   // Ramp up to 100
        { duration: '5m', target: 100 },   // Stay at 100
        { duration: '2m', target: 200 },   // Ramp up to 200
        { duration: '5m', target: 200 },   // Stay at 200
        { duration: '2m', target: 300 },   // Ramp up to 300
        { duration: '5m', target: 300 },   // Stay at 300
        { duration: '10m', target: 0 },    // Ramp down
    ],
};

const BASE_URL = 'http://localhost:8080';

export default function () {
    let res = http.get(`${BASE_URL}/api/v1/health`);
    check(res, {
        'status is 200': (r) => r.status === 200,
    });
}
```

### Spike Testing

Create `tests/load/spike_test.js`:

```javascript
export let options = {
    stages: [
        { duration: '10s', target: 100 },  // Fast ramp up
        { duration: '1m', target: 100 },   // Stay
        { duration: '10s', target: 1400 }, // Spike!
        { duration: '3m', target: 1400 },  // Stay at spike
        { duration: '10s', target: 100 },  // Drop
        { duration: '3m', target: 100 },   // Recovery
        { duration: '10s', target: 0 },    // Ramp down
    ],
};
```

---

## 🔬 PROFILING

### CPU Profiling

```bash
# Generate CPU profile
go test -cpuprofile=cpu.prof -bench=. ./internal/service/

# Analyze CPU profile
go tool pprof cpu.prof

# Commands in pprof:
# - top10: Show top 10 functions
# - list <function>: Show function code
# - web: Open in browser (requires graphviz)
# - pdf: Generate PDF (requires graphviz)
```

### Memory Profiling

```bash
# Generate memory profile
go test -memprofile=mem.prof -bench=. ./internal/service/

# Analyze memory profile
go tool pprof mem.prof

# Analyze allocations
go test -memprofile=mem.prof -bench=. ./internal/service/
go tool pprof -alloc_space mem.prof
```

### Block Profiling

```bash
# Generate block profile
go test -blockprofile=block.prof -bench=. ./internal/service/

# Analyze
go tool pprof block.prof
```

### HTTP Profiling (in Production)

Add to `main.go`:

```go
import _ "net/http/pprof"

func main() {
    // Start pprof server
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()

    // Your application code
}
```

Access profiles:
```bash
# CPU profile (30 seconds)
curl http://localhost:6060/debug/pprof/profile?seconds=30 > cpu.prof

# Heap profile
curl http://localhost:6060/debug/pprof/heap > heap.prof

# Goroutines
curl http://localhost:6060/debug/pprof/goroutine > goroutine.prof

# Analyze
go tool pprof cpu.prof
```

---

## 🚀 OPTIMIZATION

### Database Optimization

#### 1. Add Indexes

```sql
-- Identify slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add appropriate indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_regions_parent_id ON regions(parent_id);
CREATE INDEX idx_tenants_slug ON tenants(slug);
```

#### 2. Query Optimization

```go
// ❌ Bad: N+1 query problem
func GetRegionsWithParent(ctx context.Context) ([]*Region, error) {
    regions, _ := repo.List(ctx, 100, 0)
    for _, region := range regions {
        parent, _ := repo.GetByID(ctx, region.ParentID) // N queries!
        region.Parent = parent
    }
    return regions, nil
}

// ✅ Good: Join or preload
func GetRegionsWithParent(ctx context.Context) ([]*Region, error) {
    query := `
        SELECT r.*, p.name as parent_name
        FROM regions r
        LEFT JOIN regions p ON r.parent_id = p.id
        LIMIT 100
    `
    // Single query!
}
```

#### 3. Connection Pooling

```go
// Configure database pool
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(10)
db.SetConnMaxLifetime(5 * time.Minute)
db.SetConnMaxIdleTime(10 * time.Minute)
```

### Cache Optimization

#### 1. Redis Caching

```go
// Cache frequently accessed data
func (s *RegionService) GetByID(ctx context.Context, id uuid.UUID) (*Region, error) {
    // Try cache first
    cacheKey := fmt.Sprintf("region:%s", id)
    if cached, err := s.cache.Get(ctx, cacheKey); err == nil {
        var region Region
        json.Unmarshal(cached, &region)
        return &region, nil
    }

    // Cache miss - get from DB
    region, err := s.repo.GetByID(ctx, id)
    if err != nil {
        return nil, err
    }

    // Set cache (TTL: 5 minutes)
    data, _ := json.Marshal(region)
    s.cache.Set(ctx, cacheKey, data, 5*time.Minute)

    return region, nil
}
```

#### 2. Cache Invalidation

```go
func (s *RegionService) UpdateRegion(ctx context.Context, id uuid.UUID, req *UpdateRequest) error {
    // Update database
    err := s.repo.Update(ctx, id, req)
    if err != nil {
        return err
    }

    // Invalidate cache
    cacheKey := fmt.Sprintf("region:%s", id)
    s.cache.Delete(ctx, cacheKey)

    return nil
}
```

### Code Optimization

#### 1. Reduce Allocations

```go
// ❌ Bad: Creates new slice every time
func ProcessRegions(regions []*Region) []string {
    names := []string{}
    for _, r := range regions {
        names = append(names, r.Name)
    }
    return names
}

// ✅ Good: Pre-allocate slice
func ProcessRegions(regions []*Region) []string {
    names := make([]string, 0, len(regions))
    for _, r := range regions {
        names = append(names, r.Name)
    }
    return names
}
```

#### 2. Use sync.Pool for Reusable Objects

```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return new(bytes.Buffer)
    },
}

func ProcessData(data []byte) []byte {
    buf := bufferPool.Get().(*bytes.Buffer)
    defer bufferPool.Put(buf)
    
    buf.Reset()
    buf.Write(data)
    // Process...
    
    return buf.Bytes()
}
```

---

## 📊 MONITORING

### Metrics to Track

```go
// Prometheus metrics
var (
    requestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Name: "http_request_duration_seconds",
            Help: "Duration of HTTP requests.",
        },
        []string{"method", "endpoint", "status"},
    )

    requestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests.",
        },
        []string{"method", "endpoint", "status"},
    )

    cacheHits = promauto.NewCounter(
        prometheus.CounterOpts{
            Name: "cache_hits_total",
            Help: "Total number of cache hits.",
        },
    )

    dbQueryDuration = promauto.NewHistogram(
        prometheus.HistogramOpts{
            Name: "db_query_duration_seconds",
            Help: "Duration of database queries.",
        },
    )
)
```

### Grafana Dashboard

Import dashboard for Go application metrics:
- Dashboard ID: 10826 (Go Metrics)
- Dashboard ID: 6417 (PostgreSQL)
- Dashboard ID: 11835 (Redis)

---

## 🎯 PERFORMANCE TESTING CHECKLIST

### Before Load Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Database indexed properly
- [ ] Caching strategy implemented
- [ ] Connection pools configured
- [ ] Monitoring setup (metrics)

### During Load Testing

- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor database connections
- [ ] Monitor cache hit rate
- [ ] Monitor response times
- [ ] Monitor error rates

### After Load Testing

- [ ] Analyze results
- [ ] Identify bottlenecks
- [ ] Optimize slow endpoints
- [ ] Re-run tests
- [ ] Document findings

---

## 📈 PERFORMANCE TARGETS

### API Endpoints

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| GET /regions | <20ms | <50ms | <100ms |
| GET /regions/:id | <10ms | <30ms | <60ms |
| POST /regions | <30ms | <80ms | <150ms |
| PUT /regions/:id | <30ms | <80ms | <150ms |
| DELETE /regions/:id | <20ms | <50ms | <100ms |

### Resource Usage

- **CPU:** <50% average, <80% peak
- **Memory:** <512MB average, <1GB peak
- **Connections:** <100 database, <200 Redis
- **Goroutines:** <1000

---

**Strategy Version:** 1.0  
**Last Updated:** 2026-01-23  
**Status:** Ready for implementation
