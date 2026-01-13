CREATE TABLE IF NOT EXISTS "shared_chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"md5" text NOT NULL,
	"thread_title" text,
	"messages" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_thread_md5_idx" ON "shared_chat" USING btree ("user_id","thread_id","md5");