import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { PlusCircle, BookOpen } from "lucide-react";
import { isAdminFn } from "~/fn/auth";
import { createServerFn } from "@tanstack/react-start";
import { database } from "~/db";
import { chapters } from "~/db/schema";
import { eq } from "drizzle-orm";

const getBooksFn = createServerFn().handler(async () => {
  const allBooks = await database.query.books.findMany({
    orderBy: (books, { desc }) => [desc(books.createdAt)],
    with: {
      coverImage: true,
    },
  });

  // For each book, get its first chapter (lowest order)
  const booksWithFirstChapter = await Promise.all(
    allBooks.map(async (book) => {
      const firstChapter = await database.query.chapters.findFirst({
        where: eq(chapters.bookId, book.id),
        orderBy: chapters.order,
      });
      return {
        ...book,
        firstChapter,
      };
    })
  );

  return { books: booksWithFirstChapter };
});

export const Route = createFileRoute("/books/")({
  component: RouteComponent,
  loader: async () => {
    const isAdmin = await isAdminFn();
    const { books } = await getBooksFn();
    return { isAdmin, books };
  },
});

function RouteComponent() {
  const { isAdmin, books } = Route.useLoaderData();

  if (books.length === 0) {
    return (
      <main className="mt-32 flex flex-col items-center justify-center min-h-[50vh] p-4">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/0 via-theme-950/10 to-gray-900/0 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(74,222,128,0.05)_0%,transparent_65%)] pointer-events-none" />

        {/* Content container */}
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
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 relative font-medium inline-flex items-center gap-2"
                asChild
              >
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
            <span className="font-serif">ViennaMata</span>
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
        {books.map((book) => (
          <Link
            key={book.id}
            to="/books/$bookId"
            params={{
              bookId: book.id.toString(),
            }}
            className="block"
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
                <h2 className="text-2xl font-bold mb-2">{book.title}</h2>
                <p className="text-gray-600 flex-grow">{book.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
