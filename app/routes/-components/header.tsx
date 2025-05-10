import { Link } from "@tanstack/react-router";
import { Button } from "../../components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { useAuth } from "~/hooks/use-auth";
import { createServerFn } from "@tanstack/react-start";
import { database } from "~/db";
import { z } from "zod";

export const getBooksFn = createServerFn()
  .validator(
    z.object({
      bookId: z.string(),
    })
  )
  .handler(async ({ data: { bookId } }) => {
    const books = await database.query.books.findMany({
      with: {
        coverImage: true,
      },
    });
    return books;
  });

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuth();

  return (
    <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-rose-100 z-50">
      <div className="mx-auto container">
        <div className="flex h-20 items-center justify-between px-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3">
              <span className="font-serif text-xl text-gray-800">
                Vienna<span className="text-rose-600">Mata</span>
              </span>
            </Link>
            <Link
              to="/"
              className={cn(
                "hidden md:flex transition-colors",
                "text-gray-600 hover:text-gray-800 font-light"
              )}
              activeProps={{ className: "text-rose-600" }}
            >
              Home
            </Link>
            <Link
              to="/books"
              className={cn(
                "hidden md:flex transition-colors",
                "text-gray-600 hover:text-gray-800 font-light"
              )}
              activeProps={{ className: "text-rose-600" }}
            >
              My Books
            </Link>
            <Link
              to="/about"
              className={cn(
                "hidden md:flex transition-colors",
                "text-gray-600 hover:text-gray-800 font-light"
              )}
              activeProps={{ className: "text-rose-600" }}
            >
              About
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-4">
              {user ? (
                <a href="/api/logout">
                  <Button
                    variant="outline"
                    className="border-rose-200 hover:bg-rose-50"
                  >
                    Sign Out
                  </Button>
                </a>
              ) : (
                <a href="/api/login/google">
                  <Button
                    variant="outline"
                    className="border-rose-200 hover:bg-rose-50"
                  >
                    Sign In
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 p-0">
                  <Menu className="h-5 w-5 text-gray-600" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[250px] sm:w-[300px] bg-white/95 backdrop-blur-sm"
              >
                <nav className="flex flex-col gap-6 mt-8">
                  <Link
                    to="/"
                    className="flex items-center py-2 text-lg font-light text-gray-800 hover:text-rose-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/about"
                    className="flex items-center py-2 text-lg font-light text-gray-800 hover:text-rose-600 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    About
                  </Link>

                  {user ? (
                    <a
                      href="/api/logout"
                      className="py-2 text-lg font-light text-gray-800 hover:text-rose-600 transition-colors"
                    >
                      Sign Out
                    </a>
                  ) : (
                    <a
                      href="/api/login/google"
                      className="py-2 text-lg font-light text-gray-800 hover:text-rose-600 transition-colors"
                    >
                      Sign In
                    </a>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}
