/**
 * Services Index
 * Export all telemetry services (real Supabase services)
 * 
 * Telemetry services use schema('telemetry') for direct schema access.
 * All services ready for migration to Golang microservice backend.
 * 
 * Other business logic services are in /api/ directory
 */

// Dashboard service (combines data from multiple sources)
export * from './dashboardService';

// Telemetry Services (schema: telemetry)
export * from './apiUsageLogsService';
export * from './auditLogsService';
export * from './authLogsService';
export * from './businessReportsService';
export * from './securityAuditLogsService';
export * from './trafficLogsService';
export * from './userRegistrationLogsService';
export * from './webhookDeliveryLogsService';