CREATE TYPE "public"."crawl_candidate_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."crawl_channel" AS ENUM('website', 'app_api', 'sns');--> statement-breakpoint
CREATE TYPE "public"."crawl_run_status" AS ENUM('success', 'failed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."device_platform" AS ENUM('ios', 'android', 'web');--> statement-breakpoint
CREATE TYPE "public"."discount_source" AS ENUM('crawl', 'seller', 'report');--> statement-breakpoint
CREATE TYPE "public"."discount_status" AS ENUM('scheduled', 'active', 'ended', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."discount_target_scope" AS ENUM('all', 'menu');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'amount');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('cafe_discount', 'payment_discount', 'report_status');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('naverpay', 'kakaopay', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_info_source" AS ENUM('offline', 'receipt', 'store_notice', 'witnessed');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewing', 'approved', 'rejected', 'auto_registered');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'seller', 'admin');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"trust_score" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"logo_url" text,
	"is_low_cost" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cafes" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text,
	"owner_id" text,
	"name" varchar(200) NOT NULL,
	"address" varchar(500),
	"road_address" varchar(500),
	"phone" varchar(20),
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"kakao_place_id" varchar(50),
	"business_hours" jsonb,
	"metadata" jsonb,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discounts" (
	"id" text PRIMARY KEY NOT NULL,
	"cafe_id" text NOT NULL,
	"source" "discount_source" NOT NULL,
	"title" varchar(200) NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"target_scope" "discount_target_scope" DEFAULT 'all' NOT NULL,
	"conditions" jsonb,
	"payment_type" "payment_type",
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"status" "discount_status" DEFAULT 'active' NOT NULL,
	"created_by_id" text,
	"report_id" text,
	"info_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"cafe_id" text NOT NULL,
	"reporter_id" text NOT NULL,
	"title" varchar(200) NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"conditions" jsonb,
	"info_source" "report_info_source" NOT NULL,
	"receipt_image_url" text NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"confirm_count" integer DEFAULT 0 NOT NULL,
	"reject_reason" text,
	"registered_discount_id" text,
	"metadata" jsonb,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_confirmations" (
	"report_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_confirmations_report_id_user_id_pk" PRIMARY KEY("report_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "favorites" (
	"user_id" text NOT NULL,
	"cafe_id" text NOT NULL,
	"notify_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_cafe_id_pk" PRIMARY KEY("user_id","cafe_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_alerts" (
	"user_id" text NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_alerts_user_id_payment_type_pk" PRIMARY KEY("user_id","payment_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "payment_type" NOT NULL,
	"label" varchar(100) NOT NULL,
	"encrypted_token" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expo_push_token" text NOT NULL,
	"platform" "device_platform" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crawl_candidates" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text,
	"cafe_id" text,
	"raw_text" text,
	"parsed" jsonb,
	"status" "crawl_candidate_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crawl_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text,
	"status" "crawl_run_status" NOT NULL,
	"collected_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crawl_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"channel" "crawl_channel" NOT NULL,
	"url" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"parse_rule" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cafes" ADD CONSTRAINT "cafes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cafes" ADD CONSTRAINT "cafes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discounts" ADD CONSTRAINT "discounts_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discounts" ADD CONSTRAINT "discounts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discounts" ADD CONSTRAINT "discounts_report_id_discount_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."discount_reports"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_reports" ADD CONSTRAINT "discount_reports_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discount_reports" ADD CONSTRAINT "discount_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_confirmations" ADD CONSTRAINT "report_confirmations_report_id_discount_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."discount_reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_confirmations" ADD CONSTRAINT "report_confirmations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_alerts" ADD CONSTRAINT "payment_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crawl_candidates" ADD CONSTRAINT "crawl_candidates_source_id_crawl_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."crawl_sources"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crawl_candidates" ADD CONSTRAINT "crawl_candidates_cafe_id_cafes_id_fk" FOREIGN KEY ("cafe_id") REFERENCES "public"."cafes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crawl_logs" ADD CONSTRAINT "crawl_logs_source_id_crawl_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."crawl_sources"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "crawl_sources" ADD CONSTRAINT "crawl_sources_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_active_uniq" ON "users" USING btree ("email") WHERE "users"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brands_slug_active_uniq" ON "brands" USING btree ("slug") WHERE "brands"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cafes_geo_idx" ON "cafes" USING btree ("lat","lng");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cafes_brand_idx" ON "cafes" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cafes_owner_idx" ON "cafes" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cafes_kakao_place_uniq" ON "cafes" USING btree ("kakao_place_id") WHERE "cafes"."kakao_place_id" is not null and "cafes"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discounts_cafe_status_idx" ON "discounts" USING btree ("cafe_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discounts_status_end_idx" ON "discounts" USING btree ("status","end_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discounts_source_idx" ON "discounts" USING btree ("source");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discounts_payment_type_idx" ON "discounts" USING btree ("payment_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discounts_active_idx" ON "discounts" USING btree ("cafe_id") WHERE "discounts"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_cafe_idx" ON "discount_reports" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_reporter_idx" ON "discount_reports" USING btree ("reporter_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_status_idx" ON "discount_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_confirmations_user_idx" ON "report_confirmations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "favorites_cafe_idx" ON "favorites" USING btree ("cafe_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_user_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_methods_one_default_uniq" ON "payment_methods" USING btree ("user_id") WHERE "payment_methods"."is_default" = true and "payment_methods"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_devices_user_idx" ON "user_devices" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_devices_token_uniq" ON "user_devices" USING btree ("expo_push_token") WHERE "user_devices"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crawl_candidates_status_idx" ON "crawl_candidates" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crawl_logs_source_idx" ON "crawl_logs" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crawl_logs_created_idx" ON "crawl_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crawl_sources_brand_idx" ON "crawl_sources" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id");