import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Pencil, BookOpen } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { type Book, type Chapter } from "~/db/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getBookWithChaptersFn } from "./index";
import { getTotalReadingTime } from "~/utils/helpers";
import { isAdminFn } from "~/fn/auth";

interface BookDetailsProps {
  bookId: string;
}

export function BookDetails({ bookId }: BookDetailsProps) {
  const {
    data: bookData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bookWithChapters", bookId],
    queryFn: () => getBookWithChaptersFn({ data: { bookId } }),
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="text-rose-500">Error loading book: {error.message}</div>
      </div>
    );
  }

  const book = bookData?.book;
  const chapters = bookData?.chapters ?? [];
  const totalWords = bookData?.totalWords ?? 0;
  const readingTimeMinutes = bookData?.readingTimeMinutes ?? 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex gap-8">
        {/* Book Cover Image */}
        <div className="flex-shrink-0">
          {isLoading ? (
            <Skeleton className="w-48 h-64 rounded-lg" />
          ) : book?.coverImage?.data ? (
            <img
              src={book.coverImage.data}
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
                {isLoading ? (
                  <Skeleton className="h-10 w-64" />
                ) : (
                  <h1 className="text-4xl font-serif text-gray-900">
                    {book?.title}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                  </>
                ) : (
                  <>
                    <span className="bg-rose-100 text-rose-700 text-sm font-medium px-2.5 py-0.5 rounded">
                      {chapters.length}{" "}
                      {chapters.length === 1 ? "Chapter" : "Chapters"}
                    </span>
                    <span className="bg-gray-100 text-gray-700 text-sm font-medium px-2.5 py-0.5 rounded">
                      {totalWords} Words
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-0.5 rounded">
                      {readingTimeMinutes} min read
                    </span>
                  </>
                )}
              </div>
            </div>
            {isAdmin && !isLoading && book && (
              <Button size="sm" asChild>
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
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <p className="text-gray-600 mb-6 leading-relaxed">
              {book?.description}
            </p>
          )}

          {!isLoading && book && chapters.length > 0 && (
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
  );
}
