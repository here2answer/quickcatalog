# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

QuickCatalog — a product catalog and listing manager for Indian MSMEs. Part of an 8-tool MSME E-Commerce SaaS Suite. Phase 1 (core catalog MVP) and Phase 2 (AI content generation, product variants, barcode generation) are implemented.

## Dev Environment Setup

```bash
# Start PostgreSQL (port 5440) and MinIO (ports 9000/9001)
docker-compose up -d postgres minio

# Backend — Spring Boot on port 8083
cd backend && ./mvnw spring-boot:run

# Frontend — Angular on port 4202
cd frontend && ng serve
```

Seed credentials: `admin@quickcatalog.com` / `admin123` (tenant: "Nandi Crafts")

## Build & Test Commands

```bash
# Backend
cd backend && ./mvnw spring-boot:run
./mvnw test
./mvnw test -Dtest=ClassName
./mvnw test -Dtest=ClassName#method
./mvnw clean package

# Frontend
cd frontend && ng serve
ng test
ng test --include='**/component.spec.ts'
ng build --configuration=production
ng lint
```

## Port Allocations (chosen to avoid conflicts with other Docker services)

| Port | Service |
|------|---------|
| 5440 | PostgreSQL |
| 9000 | MinIO API |
| 9001 | MinIO Console |
| 8083 | Spring Boot (local dev) |
| 4202 | Angular (ng serve) |

Docker containers use standard ports internally (5432, 8080, 80). See `PORTS.md` for the full occupied port map.

## Architecture

### Backend (Java 17 / Spring Boot 3.2.5)

Package: `com.quickcatalog` under `backend/src/main/java/com/quickcatalog/`

```
config/          → SecurityConfig, TenantContext, JwtConfig, MinioConfig, CorsConfig, AsyncConfig, AiConfig, RestTemplateConfig
security/        → JwtTokenProvider, JwtAuthenticationFilter, UserPrincipal, @CurrentUser
controller/      → Auth, Category, Product, ProductImage, Dashboard, Lookup, Variant, Ai, Settings
service/         → Auth, Category, Product, ProductImage, Storage, ActivityLog, Dashboard, Lookup, Variant, Ai, Barcode, BackgroundRemoval, Tenant
entity/          → Tenant, User, Category, Product, ProductImage, ActivityLog, HsnMaster, ProductVariant, AiGenerationLog
entity/enums/    → SubscriptionPlan, UserRole, GstRate, BarcodeType, UnitType, ProductStatus, AiProvider, AiGenerationType
dto/             → Request/response DTOs per domain (auth/, category/, product/, image/, dashboard/, lookup/, common/, variant/, ai/, barcode/, settings/)
repository/      → JPA repositories with tenant-filtered custom queries
exception/       → Custom exceptions + GlobalExceptionHandler (@RestControllerAdvice)
```

### Frontend (Angular 18 / Tailwind CSS)

Standalone components (no NgModules). All routes lazy-loaded.

```
app.routes.ts              → Two layouts: AuthLayout (login/register) and MainLayout (guarded)
core/services/             → AuthService, StorageService (localStorage), LookupService, ToastService, AiService
core/interceptors/         → authInterceptor (adds Bearer token), errorInterceptor (toast on error)
core/guards/               → authGuard (checks token expiry)
features/auth/             → Login, Register components
features/products/         → ProductList, ProductForm, ProductDetail
features/categories/       → CategoryTree, CategoryForm
features/dashboard/        → Dashboard (summary cards + recent activity)
features/settings/         → CompanySettings, AiSettings
shared/components/         → ImageUploader, HsnSearch, CategoryTreeSelect, ConfirmDialog, Pagination, AiGenerateButton, etc.
shared/pipes/              → IndianCurrency, RelativeTime
```

### Database (PostgreSQL 16)

Schema initialized from `db/init.sql`. Hibernate runs in `validate` mode (no auto DDL).

Key tables: `tenant`, `user`, `category` (self-referencing tree), `product` (tsvector full-text search), `product_image`, `product_variant` (JSONB attributes), `activity_log`, `ai_generation_log`, `hsn_master` (global).

Uses PostgreSQL enums, GIN indexes for full-text/trigram search, and triggers for auto-updating `search_vector` and `updated_at`.

### Storage (MinIO / S3-compatible)

Images uploaded via `ProductImageController` → `ProductImageService` → `StorageService` (MinIO). Three resized variants generated async: thumbnail (200px), medium (600px), large (1200px).

## Critical Patterns

### Multi-Tenancy (MUST follow)

Every entity has a `tenant_id` column. Every query MUST filter by tenant. The flow:

1. `JwtAuthenticationFilter` extracts JWT → sets `TenantContext.setTenantId()` and `setUserId()` (ThreadLocal)
2. Service methods call `TenantContext.getTenantId()` as their first operation
3. All repository methods include `tenant_id` parameter: `findByIdAndTenantId(id, tenantId)`
4. Filter clears context in `finally` block to prevent ThreadLocal leaks

**Never use `findById()` alone — always `findByIdAndTenantId()`.**

### Auth & RBAC

JWT-based: 24h access token, 7d refresh token. Role hierarchy: OWNER > ADMIN > EDITOR > VIEWER. Endpoints gated with `@PreAuthorize("hasAnyRole('OWNER','ADMIN')")`.

Public endpoints (no auth): `/api/auth/**`, `/api/lookup/**`.

### API Conventions

- All responses wrapped in `ApiResponse<T>` or `PagedResponse<T>` — never expose entities directly
- DTOs for every request and response
- Monetary amounts as `BigDecimal`
- Pagination: `page` (0-indexed), `size` (default 20), `sort`
- Product slugs auto-generated from name (unique per tenant)
- SKU auto-generated if not provided

### Activity Logging

Every CRUD operation logs to `activity_log` via `ActivityLogService.log(tenantId, userId, EntityType, entityId, ActionType, detailsJson)`.

### Frontend HTTP

- `authInterceptor` adds `Authorization: Bearer` to all requests except `/api/auth/*` and `/api/lookup/*`
- `errorInterceptor` handles errors globally with toast notifications
- Dev proxy: `/api/*` → `http://localhost:8083` (via proxy.conf.json)

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| Auth | POST `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`; GET `/api/auth/me` |
| Categories | GET `/api/categories` (tree), GET/POST/PUT/DELETE `/api/categories/{id}` |
| Products | GET `/api/products` (paginated), GET/POST/PUT/DELETE `/api/products/{id}`, PATCH `/{id}/status`, POST `/{id}/duplicate`, GET `/api/products/search` |
| Images | POST `/api/products/{id}/images`, PUT `/{id}/images/reorder`, DELETE `/{id}/images/{imageId}`, POST `/{imageId}/remove-bg` |
| Variants | GET/POST/PUT/DELETE `/api/products/{id}/variants/{variantId}`, POST `/generate` |
| AI | POST `/api/ai/generate-description`, `/generate-seo`, `/suggest-hsn`, `/suggest-tags`, `/accept` |
| Barcode | POST `/api/products/{id}/generate-barcode`, GET `/{id}/barcode-image` |
| Settings | GET/PUT `/api/settings/company` |
| Dashboard | GET `/api/dashboard/summary`, `/api/dashboard/recent-activity` |
| Lookup | GET `/api/lookup/hsn-codes`, `/api/lookup/units`, `/api/lookup/gst-rates` |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 17, Spring Boot 3.2.5, Spring Security (JWT), Spring Data JPA, Lombok |
| Frontend | Angular 18, Tailwind CSS 3.4, RxJS 7.8, Angular CDK, ngx-toastr, ngx-quill |
| Database | PostgreSQL 16 (enums, tsvector, GIN indexes, triggers) |
| Storage | MinIO (S3-compatible), Thumbnailator for image resizing |
| AI | Ollama (local LLM, default) or OpenAI API (configurable per tenant) |
| Barcode | ZXing 3.5.3 (EAN-13 generation/validation/image) |
| API Docs | SpringDoc OpenAPI (Swagger) |
| Testing | JUnit 5 + Mockito (backend), Karma + Jasmine (frontend) |

## Ecosystem Context

QuickCatalog is tool #1 in the suite. Its products feed into QuickPrice (margins) and QuickLabel (barcodes). The parent spec lives at `D:\nandi\mnt\user-data\outputs\msme-suite\quickcatalog\CLAUDE.md` and the suite overview at `D:\nandi\CLAUDE.md`.
