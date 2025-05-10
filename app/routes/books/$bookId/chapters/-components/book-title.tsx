import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
    <div className="pt-4 bg-white border-b border-gray-200 pb-4 text-center flex gap-4 justify-center items-center">
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
        <p className="text-xl font-semibold text-muted-foreground">
          {bookData.book.title}
        </p>
      </Link>
    </div>
  );
}
