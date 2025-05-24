import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { PlusCircle, BookOpen, MessageSquare } from "lucide-react";
import { isAdminFn } from "~/fn/auth";
import { createServerFn } from "@tanstack/react-start";
import { database } from "~/db";
import { BookWithRelations, chapters, comments } from "~/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getTotalReadingTime } from "~/utils/helpers";
import { useQuery } from "@tanstack/react-query";
import { getConfigurationFn } from "../-components/header";
import { BookCard } from "~/components/book-card";

const getBooksFn = createServerFn().handler(async () => {
  const allBooks = await database.query.books.findMany({
    orderBy: (books, { desc }) => [desc(books.createdAt)],
    with: {
      coverImage: true,
    },
  });

  // For each book, get its first chapter (lowest order)
  const books = await Promise.all(
    allBooks.map(async (book) => {
      const allChapters = await database.query.chapters.findMany({
        where: eq(chapters.bookId, book.id),
        orderBy: chapters.order,
      });
      const totalWords = allChapters.reduce((acc, chapter) => {
        return acc + chapter.content.split(" ").length;
      }, 0);

      const publishedChapters = allChapters.filter(
        (chapter) => chapter.isPublished
      );

      const readingTimeMinutes = getTotalReadingTime(totalWords);
      const totalReadCount = allChapters.reduce(
        (acc, chapter) => acc + (chapter.readCount || 0),
        0
      );

      // Fetch all comments for these chapters
      const chapterIds = allChapters.map((ch) => ch.id);
      let totalCommentCount = 0;
      if (chapterIds.length > 0) {
        const allComments = await database.query.comments.findMany({
          where: inArray(comments.chapterId, chapterIds),
        });
        totalCommentCount = allComments.length;
      }

      return {
        ...(book as BookWithRelations),
        totalWords,
        totalChapters: publishedChapters.length,
        readingTimeMinutes,
        totalReadCount,
        totalCommentCount,
      };
    })
  );

  return { books };
});

export const Route = createFileRoute("/books/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    context.queryClient.ensureQueryData({
      queryKey: ["isAdmin"],
      queryFn: isAdminFn,
    });

    context.queryClient.ensureQueryData({
      queryKey: ["books"],
      queryFn: getBooksFn,
    });
  },
});

function RouteComponent() {
  const isAdmin = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["books"],
    queryFn: getBooksFn,
  });

  const { data: configuration } = useQuery({
    queryKey: ["configuration"],
    queryFn: getConfigurationFn,
  });

  if (books?.books.length === 0) {
    return (
      <main className="mt-32 flex flex-col items-center justify-center min-h-[50vh] p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/0 via-theme-950/10 to-gray-900/0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(74,222,128,0.05)_0%,transparent_65%)] pointer-events-none" />

        <div className="relative text-center space-y-6 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            No Books Yet
          </h1>

          <p className="text-lg text-gray-600 leading-relaxed">
            {isAdmin
              ? "Start your writing journey by creating your first book. Each book can contain multiple chapters where you can express your creativity and share your stories."
              : "Check back soon for new stories and adventures. Our writer is working on bringing amazing content to life."}
          </p>

          {isAdmin && (
            <div className="pt-4">
              <Button size="lg" asChild>
                <Link to="/books/create">
                  <PlusCircle className="w-5 h-5" aria-hidden="true" />
                  <span>Create Your First Book</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-transparent bg-clip-text animate-gradient relative group">
            <span className="text-gray-500 text-lg">Written by</span>{" "}
            <span className="font-serif">{configuration?.name}</span>
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 transform scale-x-0 transition-transform group-hover:scale-x-100"></span>
          </h1>
        </div>
        {isAdmin && (
          <Button size="lg" asChild>
            <Link to="/books/create">
              <PlusCircle className="w-5 h-5" aria-hidden="true" />
              <span>Create New Book</span>
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {booksLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex gap-6 animate-pulse"
              >
                <div className="w-48 h-64 flex-shrink-0 bg-gray-200 rounded-lg" />
                <div className="flex flex-col flex-grow">
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
                  <div className="mb-4 flex items-center gap-4">
                    <div className="h-6 bg-gray-200 rounded w-24" />
                    <div className="h-6 bg-gray-200 rounded w-24" />
                    <div className="h-6 bg-gray-200 rounded w-24" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-4/6" />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          books?.books.map((book) => <BookCard key={book.id} book={book} />)
        )}
      </div>
    </main>
  );
}
