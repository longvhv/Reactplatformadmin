import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import tenantsAPI from "./tenants-api.tsx";
import usersAPI from "./users-api.tsx";
import seedDataAPI from "./seed-data.tsx";
import tenantMembersAPI from "./tenant-members-routes.tsx";
import departmentsAPI from "./departments-routes.tsx";
import userGroupsAPI from "./user-groups-routes.tsx";
import groupMembersAPI from "./group-members-routes.tsx";
import locationsAPI from "./locations-api.tsx";
import userAuthMethodsAPI from "./user-auth-methods-api.tsx";
import tenantSSOConfigsAPI from "./tenant-sso-configs-api.tsx";
import userSessionsAPI from "./user-sessions-api.tsx";
import applicationsAPI from "./applications-routes.tsx";
import permissionsAPI from "./permissions-routes.tsx";
import tenantApplicationsAPI from "./tenant-applications-routes.tsx";
import tenantAppRoutesAPI from "./tenant-app-routes-api.tsx";
import saasProductTypesAPI from "./saas-product-types-routes.tsx";
import systemJobsAPI from "./system-jobs-api.ts";
import featureFlagsAPI from "./feature-flags-api.ts";
import subscriptionOrdersAPI from "./subscription-orders-api.ts";
import subscriptionInvoicesAPI from "./subscription-invoices-api.ts";
import systemAnnouncementsAPI from "./system-announcements-api.ts";
import notificationTemplatesAPI from "./notification-templates-api.ts";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Request-Id"],
    maxAge: 600,
    credentials: true,
  }),
);

// Health check endpoint - with and without prefix
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/make-server-7eedb4e0/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug endpoint
app.get("/make-server-7eedb4e0/api/core/debug", (c) => {
  return c.json({ 
    status: "ok", 
    message: "API is working with make-server-7eedb4e0 prefix",
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasSupabaseKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    }
  });
});

// Mount Core APIs - all APIs start with /make-server-7eedb4e0/api/core/
app.route("/make-server-7eedb4e0/api/core", tenantsAPI);
app.route("/make-server-7eedb4e0/api/core", usersAPI);
app.route("/make-server-7eedb4e0/api/core", seedDataAPI);
app.route("/make-server-7eedb4e0/api/core", tenantMembersAPI);
app.route("/make-server-7eedb4e0/api/core", departmentsAPI);
app.route("/make-server-7eedb4e0/api/core", userGroupsAPI);
app.route("/make-server-7eedb4e0/api/core", groupMembersAPI);
app.route("/make-server-7eedb4e0/api/core", locationsAPI);
app.route("/make-server-7eedb4e0/api/core", userAuthMethodsAPI);
app.route("/make-server-7eedb4e0/api/core", tenantSSOConfigsAPI);
app.route("/make-server-7eedb4e0/api/core", userSessionsAPI);
app.route("/make-server-7eedb4e0/api/core", applicationsAPI);
app.route("/make-server-7eedb4e0/api/core", permissionsAPI);
app.route("/make-server-7eedb4e0/api/core", tenantApplicationsAPI);
app.route("/make-server-7eedb4e0/api/core", tenantAppRoutesAPI);
app.route("/make-server-7eedb4e0/api/core", saasProductTypesAPI);
app.route("/make-server-7eedb4e0/api/core", systemJobsAPI);
app.route("/make-server-7eedb4e0/api/core", featureFlagsAPI);
app.route("/make-server-7eedb4e0/api/core", subscriptionOrdersAPI);
app.route("/make-server-7eedb4e0/api/core", subscriptionInvoicesAPI);
app.route("/make-server-7eedb4e0/api/core", systemAnnouncementsAPI);
app.route("/make-server-7eedb4e0/api/core", notificationTemplatesAPI);

// Handle OPTIONS preflight for any route
app.options("*", (c) => {
  return c.text("", 204);
});

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: "Not Found", 
    path: c.req.path,
    method: c.req.method,
    message: "The requested endpoint does not exist"
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ 
    error: "Internal Server Error", 
    message: err.message,
    path: c.req.path
  }, 500);
});

Deno.serve(app.fetch);