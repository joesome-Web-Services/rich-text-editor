import { z } from "zod";
import { asc } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { books, chapters } from "~/db/schema";
import { database } from "~/db";
import { adminMiddleware } from "~/lib/auth";

export const getBookChaptersFn = createServerFn()
  .validator(
    z.object({
      bookId: z.string(),
    })
  )
  .handler(async ({ data: { bookId } }) => {
    const bookChapters = await database.query.chapters.findMany({
      where: eq(chapters.bookId, parseInt(bookId)),
      orderBy: asc(chapters.order),
    });

    return { chapters: bookChapters };
  });

export const getChapterFn = createServerFn()
  .validator(
    z.object({
      chapterId: z.string(),
    })
  )
  .handler(async ({ data: { chapterId } }) => {
    const chapter = await database.query.chapters.findFirst({
      where: eq(chapters.id, parseInt(chapterId)),
    });

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    return { chapter };
  });

export const togglePublishFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      chapterId: z.string(),
      isPublished: z.boolean(),
    })
  )
  .handler(async ({ data }) => {
    const [chapter] = await database
      .update(chapters)
      .set({
        isPublished: data.isPublished,
      })
      .where(eq(chapters.id, parseInt(data.chapterId)))
      .returning();

    return { chapter };
  });

export const getBookFn = createServerFn()
  .validator(
    z.object({
      bookId: z.string(),
    })
  )
  .handler(async ({ data: { bookId } }) => {
    const book = await database.query.books.findFirst({
      where: eq(books.id, parseInt(bookId)),
      with: {
        coverImage: true,
      },
    });

    if (!book) {
      throw new Error("Book not found");
    }

    return { book };
  });

export const deleteChapterFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      chapterId: z.string(),
      bookId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    // Delete the chapter
    await database
      .delete(chapters)
      .where(eq(chapters.id, parseInt(data.chapterId)));

    // Get all remaining chapters for this book
    const remainingChapters = await database.query.chapters.findMany({
      where: eq(chapters.bookId, parseInt(data.bookId)),
      orderBy: asc(chapters.order),
    });

    // Update the order of remaining chapters
    await database.transaction(async (tx) => {
      for (let i = 0; i < remainingChapters.length; i++) {
        await tx
          .update(chapters)
          .set({ order: i + 1 })
          .where(eq(chapters.id, remainingChapters[i].id));
      }
    });

    return { success: true };
  });
