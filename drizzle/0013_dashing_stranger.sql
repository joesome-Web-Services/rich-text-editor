CREATE TABLE "app_notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdByUserId" serial NOT NULL,
	"commentId" serial NOT NULL,
	"bookId" serial NOT NULL,
	"chapterId" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_notification" ADD CONSTRAINT "app_notification_createdByUserId_app_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_notification" ADD CONSTRAINT "app_notification_commentId_app_comment_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."app_comment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_notification" ADD CONSTRAINT "app_notification_bookId_app_book_id_fk" FOREIGN KEY ("bookId") REFERENCES "public"."app_book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_notification" ADD CONSTRAINT "app_notification_chapterId_app_chapter_id_fk" FOREIGN KEY ("chapterId") REFERENCES "public"."app_chapter"("id") ON DELETE cascade ON UPDATE no action;