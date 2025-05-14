import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { database } from "~/db";
import { books, chapters, type Book, type Chapter } from "~/db/schema";
import { and, eq } from "drizzle-orm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { PlusCircle, Loader2, Pencil, BookOpen } from "lucide-react";
import { adminMiddleware } from "~/lib/auth";
import { useToast } from "~/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { isAdminFn } from "~/fn/auth";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

const getBookWithChaptersFn = createServerFn()
  .validator(z.object({ bookId: z.string() }))
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

    const isAdmin = await isAdminFn();
    const bookChapters = await database.query.chapters.findMany({
      where: isAdmin
        ? eq(chapters.bookId, book.id)
        : and(eq(chapters.bookId, book.id), eq(chapters.isPublished, true)),
      orderBy: chapters.order,
    });

    return { book, chapters: bookChapters };
  });

const createChapterFn = createServerFn()
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
  loader: async () => {
    const isAdmin = await isAdminFn();
    return { isAdmin };
  },
});

function RouteComponent() {
  const { bookId } = Route.useParams();
  const { isAdmin } = Route.useLoaderData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBookWithChaptersFn({ data: { bookId } }),
  });

  const createChapterMutation = useMutation({
    mutationFn: () => createChapterFn({ data: { bookId } }),
    onSuccess: ({ chapter }) => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      toast({
        title: "Success",
        description: "Chapter created successfully!",
      });
      navigate({
        to: "/books/$bookId/chapters/$chapterId",
        params: { bookId, chapterId: chapter.id.toString() },
      });
    },
    onError: (error) => {
      console.error("Failed to create chapter:", error);
      toast({
        title: "Error",
        description: "Failed to create chapter. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="pt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-8">
            {/* Book Cover Skeleton */}
            <div className="flex-shrink-0">
              <div className="w-48 h-64 bg-gray-200 rounded-lg shadow-md animate-pulse"></div>
            </div>

            {/* Book Info Skeleton */}
            <div className="flex-grow">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-10 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        <hr className="my-8 border-gray-200" />

        {/* Chapters List Skeleton */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-28 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-rose-500">Error loading book: {error.message}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  const { book, chapters = [] } = data;

  return (
    <div className="pt-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex gap-8">
          {/* Book Cover Image */}
          <div className="flex-shrink-0">
            {book.coverImage?.data ? (
              <img
                src={book.coverImage?.data}
                alt={`Cover for ${book.title}`}
                className="w-48 h-64 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              />
            ) : (
              <div className="w-48 h-64 bg-gray-200 rounded-lg shadow-md"></div>
            )}
          </div>

          {/* Book Info */}
          <div className="flex-grow">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-4">
                  <h1 className="text-4xl font-serif text-gray-900">
                    {book.title}
                  </h1>
                </div>
                <div className="flex items-center gap-4 text-gray-600">
                  <span className="bg-rose-100 text-rose-700 text-sm font-medium px-2.5 py-0.5 rounded">
                    {chapters.length}{" "}
                    {chapters.length === 1 ? "Chapter" : "Chapters"}
                  </span>
                </div>
              </div>
              {isAdmin && (
                <Button variant="secondary" size="sm" asChild>
                  <Link
                    to="/books/$bookId/edit"
                    params={{ bookId: book.id.toString() }}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {book.description}
            </p>

            {/* Start Reading Button */}
            {chapters.length > 0 && (
              <Button size="lg" asChild>
                <Link
                  to="/books/$bookId/chapters/$chapterId"
                  params={{
                    bookId: book.id.toString(),
                    chapterId: chapters[0].id.toString(),
                  }}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Reading
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <hr className="my-8 border-gray-200" />

      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-2xl font-semibold">Chapters</CardTitle>
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => createChapterMutation.mutate()}
              disabled={createChapterMutation.isPending}
            >
              {createChapterMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              <span>Add Chapter</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {chapters.length === 0 ? (
            <p className="text-gray-500">No chapters available yet.</p>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter: Chapter, index: number) => (
                <Link
                  key={chapter.id}
                  to="/books/$bookId/chapters/$chapterId"
                  params={{
                    bookId: book.id.toString(),
                    chapterId: chapter.id.toString(),
                  }}
                  className={`block p-4 rounded-lg border transition-colors ${
                    chapter.isPublished
                      ? "border-gray-200 hover:border-rose-400 hover:bg-rose-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {index + 1}. {chapter.title}
                      {!chapter.isPublished && (
                        <span className="ml-2 text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(chapter.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
