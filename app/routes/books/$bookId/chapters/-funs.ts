import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { adminMiddleware } from "~/lib/auth";
import { database } from "~/db";
import { eq } from "drizzle-orm";
import { chapters, books } from "~/db/schema";
import OpenAI from "openai";

export const getChapterFn = createServerFn()
  .validator(
    z.object({
      chapterId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const chapter = await database.query.chapters.findFirst({
      where: eq(chapters.id, parseInt(data.chapterId)),
    });

    return { chapter };
  });

export const getBookFn = createServerFn()
  .validator(
    z.object({
      bookId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const book = await database.query.books.findFirst({
      where: eq(books.id, parseInt(data.bookId)),
    });

    return { book };
  });

export const getBookChaptersFn = createServerFn()
  .validator(
    z.object({
      bookId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const bookChapters = await database.query.chapters.findMany({
      where: eq(chapters.bookId, parseInt(data.bookId)),
      orderBy: (chapters, { asc }) => [asc(chapters.order)],
    });

    return { chapters: bookChapters };
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

export const deleteChapterFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      chapterId: z.string(),
      bookId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    await database
      .delete(chapters)
      .where(eq(chapters.id, parseInt(data.chapterId)));
  });

export const refineTextFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      originalText: z.string(),
      prompt: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const openai = new OpenAI();

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful writing assistant. Your task is to refine and improve the given text based on the user's prompt. Maintain the original meaning while enhancing clarity, style, and impact. Do not wrap your response in quotes.",
        },
        {
          role: "user",
          content: `Original text: ${data.originalText}\n\nUser's refinement prompt: "${data.prompt}"\n\nPlease provide the refined version of the text:`,
        },
      ],
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    return {
      refinedText: completion.choices[0].message.content,
    };
  });
