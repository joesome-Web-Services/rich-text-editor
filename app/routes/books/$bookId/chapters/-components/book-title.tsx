import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { getBookFn } from "../-funs";

interface BookTitleProps {
  bookId: string;
}

export function BookTitle({ bookId }: BookTitleProps) {
  const { data: bookData } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBookFn({ data: { bookId } }),
  });

  if (!bookData) return null;

  return (
    <div className="pt-4 bg-white border-b border-gray-200 pb-4">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-sm text-gray-500 mb-2">You are reading</p>
        <div className="flex items-center gap-2">
          <Link
            to="/books/$bookId"
            className="text-muted-foreground hover:text-foreground transition-colors"
            params={{
              bookId: bookId,
            }}
          >
            <ChevronLeft className="size-5" />
          </Link>
          <Link
            to="/books/$bookId"
            className="flex gap-2 items-center"
            params={{
              bookId: bookId,
            }}
          >
            {bookData.book.coverImage?.data ? (
              <img
                src={bookData.book.coverImage.data}
                alt={`Cover for ${bookData.book.title}`}
                className="size-6 object-cover rounded-full shadow-md"
              />
            ) : (
              <div className="size-6 rounded-full bg-gray-200 shadow-md" />
            )}
            <p className="text-xl font-serif text-gray-800">
              {bookData.book.title}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
