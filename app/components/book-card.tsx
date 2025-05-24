import { Link } from "@tanstack/react-router";
import { BookOpen, MessageSquare, BookText, Clock, Hash } from "lucide-react";
import { type Book } from "~/db/schema";

interface BookCardProps {
  book: Book & {
    totalChapters: number;
    totalWords: number;
    readingTimeMinutes: number;
    totalReadCount: number;
    totalCommentCount: number;
    coverImage: {
      data: string;
      id: number;
    } | null;
  };
  className?: string;
}

export function BookCard({ book, className = "" }: BookCardProps) {
  return (
    <Link
      to="/books/$bookId"
      params={{
        bookId: book.id.toString(),
      }}
      className={`block ${className}`}
    >
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] p-6 flex gap-6">
        {book.coverImage?.data ? (
          <div className="w-48 h-64 flex-shrink-0">
            <img
              src={book.coverImage.data}
              alt={`Cover for ${book.title}`}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="w-48 h-64 flex-shrink-0 bg-gray-200 rounded-lg"></div>
        )}
        <div className="flex flex-col flex-grow">
          <h2 className="text-4xl mb-4 font-serif">{book.title}</h2>
          <div className="mb-4 flex items-center gap-4 text-gray-600">
            <span className="bg-rose-100 text-rose-700 text-sm font-medium px-2.5 py-0.5 rounded flex items-center gap-1">
              <BookText className="w-4 h-4" />
              {book.totalChapters} Chapters
            </span>
            <span className="bg-gray-100 text-gray-700 text-sm font-medium px-2.5 py-0.5 rounded flex items-center gap-1">
              <Hash className="w-4 h-4" />
              {book.totalWords} Words
            </span>
            <span className="bg-blue-100 text-blue-700 text-sm font-medium px-2.5 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {book.readingTimeMinutes} min read
            </span>
            <span className="bg-green-100 text-green-700 text-sm font-medium px-2.5 py-0.5 rounded flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {book.totalReadCount} Reads
            </span>
            <span className="bg-gray-100 text-gray-700 text-sm font-medium px-2.5 py-0.5 rounded flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {book.totalCommentCount} Comments
            </span>
          </div>
          <p className="text-gray-600 flex-grow">{book.description}</p>
        </div>
      </div>
    </Link>
  );
}
