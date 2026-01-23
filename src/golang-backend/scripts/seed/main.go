package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/vhv-platform/backend/internal/config"
	"github.com/vhv-platform/backend/internal/models"
	"github.com/vhv-platform/backend/internal/repository/yugabyte"
	"github.com/vhv-platform/backend/pkg/auth"
	"github.com/vhv-platform/backend/pkg/database"
	"go.uber.org/zap"
)

func main() {
	fmt.Println("🌱 Seeding test data...")

	// Load config
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to YugabyteDB
	db, err := database.NewYugabyteDB(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	ctx := context.Background()

	// Initialize repositories
	userRepo := yugabyte.NewUserRepository(db.DB)
	tenantRepo := yugabyte.NewTenantRepository(db.DB)
	memberRepo := yugabyte.NewTenantMemberRepository(db.DB)
	roleRepo := yugabyte.NewRoleRepository(db.DB)

	// Initialize logger
	logger, err := zap.NewDevelopment()
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Seed users
	users, err := seedUsers(ctx, userRepo)
	if err != nil {
		logger.Fatal("Failed to seed users", zap.Error(err))
	}

	// Seed tenants
	tenants, err := seedTenants(ctx, tenantRepo)
	if err != nil {
		logger.Fatal("Failed to seed tenants", zap.Error(err))
	}

	// Seed tenant members
	if err := seedTenantMembers(ctx, memberRepo, users, tenants); err != nil {
		logger.Fatal("Failed to seed tenant members", zap.Error(err))
	}

	// Seed roles
	if err := seedRoles(ctx, roleRepo); err != nil {
		logger.Fatal("Failed to seed roles", zap.Error(err))
	}

	// Seed applications
	if err := seedApplications(ctx, db, users[0].ID); err != nil {
		logger.Fatal("Failed to seed applications", zap.Error(err))
	}

	// Seed webhooks
	if err := seedWebhooks(ctx, db, tenants); err != nil {
		logger.Fatal("Failed to seed webhooks", zap.Error(err))
	}

	// Seed locations
	if err := seedLocations(ctx, db, tenants); err != nil {
		logger.Fatal("Failed to seed locations", zap.Error(err))
	}

	logger.Info("Database seeding completed successfully!")
	logger.Info("Test credentials:",
		zap.String("email", "admin@saas.coquan.vn"),
		zap.String("password", "Admin@2026"),
	)
}

func seedRoles(ctx context.Context, roleRepo *yugabyte.RoleRepository) error {
	roles := []struct {
		name        string
		description string
	}{
		{"admin", "Administrator role with full access"},
		{"user", "Regular user role with limited access"},
	}

	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	for _, roleData := range roles {
		role := models.NewRole(roleData.name)
		desc := roleData.description
		role.Description = &desc
		role.IsActive = true

		if err := roleRepo.Create(ctx, role); err != nil {
			return err
		}
	}

	logger.Info("Seeded roles", zap.Int("count", len(roles)))
	return nil
}

func seedApplications(ctx context.Context, db *database.YugabyteDB, createdBy uuid.UUID) error {
	appRepo := yugabyte.NewApplicationRepository(db.DB)

	applications := []struct {
		code        string
		name        string
		description string
	}{
		{"ADMIN", "Admin Portal", "Administration portal for system management"},
		{"CLIENT", "Client Portal", "Client-facing application portal"},
		{"MOBILE", "Mobile App", "Mobile application for iOS and Android"},
		{"API", "API Gateway", "RESTful API gateway"},
	}

	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	for _, appData := range applications {
		app := models.NewApplication(appData.code, appData.name, createdBy)
		desc := appData.description
		app.Description = &desc
		app.IsActive = true

		if err := appRepo.Create(ctx, app); err != nil {
			return err
		}
	}

	logger.Info("Seeded applications", zap.Int("count", len(applications)))
	return nil
}

func seedWebhooks(ctx context.Context, db *database.YugabyteDB, tenants []*models.Tenant) error {
	webhookRepo := yugabyte.NewWebhookRepository(db.DB)

	webhooks := []struct {
		name   string
		url    string
		events []string
	}{
		{"User Events", "https://webhook.site/user-events", []string{"user.created", "user.updated"}},
		{"Tenant Events", "https://webhook.site/tenant-events", []string{"tenant.created", "tenant.activated"}},
	}

	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	for _, tenant := range tenants {
		for _, whData := range webhooks {
			webhook := models.NewWebhook(tenant.ID, whData.name, whData.url, whData.events)
			webhook.IsActive = true

			if err := webhookRepo.Create(ctx, webhook); err != nil {
				return err
			}
		}
	}

	logger.Info("Seeded webhooks", zap.Int("count", len(webhooks)*len(tenants)))
	return nil
}

func seedLocations(ctx context.Context, db *database.YugabyteDB, tenants []*models.Tenant) error {
	locationRepo := yugabyte.NewLocationRepository(db.DB)

	// Create location type (you need to have this in your schema)
	typeID := uuid.New()

	locations := []struct {
		code    string
		name    string
		address string
	}{
		{"HN", "Hanoi Office", "Hoan Kiem, Hanoi"},
		{"HCM", "Ho Chi Minh Office", "District 1, Ho Chi Minh City"},
		{"DN", "Danang Office", "Hai Chau, Danang"},
	}

	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	for _, tenant := range tenants {
		for _, locData := range locations {
			location := models.NewLocation(tenant.ID, locData.code, locData.name, typeID)
			addr := locData.address
			location.Address = &addr
			location.Status = "active"

			if err := locationRepo.Create(ctx, location); err != nil {
				return err
			}
		}
	}

	logger.Info("Seeded locations", zap.Int("count", len(locations)*len(tenants)))
	return nil
}