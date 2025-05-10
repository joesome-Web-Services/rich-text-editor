import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "~/components/ui/dropdown-menu";
import { DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { getBookChaptersFn } from "../-funs";
import { Button } from "~/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "~/lib/utils";
import { Link } from "@tanstack/react-router";

interface ChapterNavigationProps {
  bookId: string;
  currentChapterId: string;
}

export function ChapterNavigation({
  bookId,
  currentChapterId,
}: ChapterNavigationProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["book-chapters", bookId],
    queryFn: () => getBookChaptersFn({ data: { bookId } }),
  });

  if (isLoading || !data) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span>Chapters</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {data.chapters.map((chapter, index) => (
          <DropdownMenuItem key={chapter.id} asChild>
            <Link
              to="/books/$bookId/chapters/$chapterId"
              params={{
                bookId: bookId,
                chapterId: chapter.id.toString(),
              }}
              className={cn(
                "w-full truncate",
                parseInt(currentChapterId) === chapter.id && "font-bold"
              )}
            >
              {index + 1}. {chapter.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
