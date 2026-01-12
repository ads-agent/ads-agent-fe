CREATE TABLE IF NOT EXISTS "token_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"thread_id" text,
	"prompt_tokens" integer NOT NULL,
	"completion_tokens" integer NOT NULL,
	"total_tokens" integer NOT NULL,
	"model" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
