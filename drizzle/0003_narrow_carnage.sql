CREATE TABLE "app_image" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_book" ADD COLUMN "coverImageId" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "app_book" ADD CONSTRAINT "app_book_coverImageId_app_image_id_fk" FOREIGN KEY ("coverImageId") REFERENCES "public"."app_image"("id") ON DELETE cascade ON UPDATE no action;