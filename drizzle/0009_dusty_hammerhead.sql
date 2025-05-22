CREATE TABLE "app_comment_heart" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"commentId" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_comment_heart" ADD CONSTRAINT "app_comment_heart_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_comment_heart" ADD CONSTRAINT "app_comment_heart_commentId_app_comment_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."app_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_comment_idx" ON "app_comment_heart" USING btree ("userId","commentId");--> statement-breakpoint
CREATE UNIQUE INDEX "user_comment_unique_idx" ON "app_comment_heart" USING btree ("userId","commentId");