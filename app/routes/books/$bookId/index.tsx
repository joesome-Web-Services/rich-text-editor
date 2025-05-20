import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { database } from "~/db";
import { books, chapters } from "~/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { adminMiddleware, unauthenticatedMiddleware } from "~/lib/auth";
import { isAdminFn } from "~/fn/auth";
import { Chapters } from "./-chapters";
import { BookDetails } from "./-book-details";
import { getTotalReadingTime } from "~/utils/helpers";

export const getBookWithChaptersFn = createServerFn()
  .middleware([unauthenticatedMiddleware])
  .validator(z.object({ bookId: z.string() }))
  .handler(async ({ data: { bookId }, context }) => {
    const book = await database.query.books.findFirst({
      where: eq(books.id, parseInt(bookId)),
      with: {
        coverImage: true,
      },
    });

    if (!book) {
      throw new Error("Book not found");
    }

    const bookChapters = await database.query.chapters.findMany({
      where: context.isAdmin
        ? eq(chapters.bookId, book.id)
        : and(eq(chapters.bookId, book.id), eq(chapters.isPublished, true)),
      orderBy: chapters.order,
    });

    // Calculate total word count
    const totalWords = bookChapters.reduce((acc, chapter) => {
      const words = chapter.content
        .split(/\s+/)
        .filter((word) => word.length > 0).length;
      return acc + words;
    }, 0);

    const readingTimeMinutes = getTotalReadingTime(totalWords);

    return { book, chapters: bookChapters, totalWords, readingTimeMinutes };
  });

export const createChapterFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      bookId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    // Get the current highest order for chapters in this book
    const highestOrder = await database.query.chapters.findFirst({
      where: eq(chapters.bookId, parseInt(data.bookId)),
      orderBy: (chapters, { desc }) => [desc(chapters.order)],
    });

    const nextOrder = (highestOrder?.order ?? 0) + 1;

    const chapter = await database
      .insert(chapters)
      .values({
        bookId: parseInt(data.bookId),
        title: "New Chapter",
        content: "",
        order: nextOrder,
      })
      .returning();

    return { chapter: chapter[0] };
  });

export const Route = createFileRoute("/books/$bookId/")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { bookId } = params;

    context.queryClient.ensureQueryData({
      queryKey: ["isAdmin"],
      queryFn: isAdminFn,
    });

    context.queryClient.ensureQueryData({
      queryKey: ["bookWithChapters", bookId],
      queryFn: () => getBookWithChaptersFn({ data: { bookId } }),
    });
  },
});

function RouteComponent() {
  const { bookId } = Route.useParams();

  return (
    <div className="pt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <BookDetails bookId={bookId} />

      <hr className="my-8 border-gray-200" />

      <Chapters bookId={bookId} />
    </div>
  );
}
