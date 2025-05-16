CREATE TABLE "app_configuration" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"heading" text NOT NULL,
	"subHeading" text NOT NULL,
	"email" text NOT NULL,
	"about" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_comment" ALTER COLUMN "content" SET DEFAULT '';