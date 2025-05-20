import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { getBookChaptersFn } from "../-funs";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface NextChapterButtonProps {
  bookId: string;
  currentChapterId: string;
}

export function NextChapterButton({
  bookId,
  currentChapterId,
}: NextChapterButtonProps) {
  const { data } = useQuery({
    queryKey: ["book-chapters", bookId],
    queryFn: () => getBookChaptersFn({ data: { bookId } }),
  });

  const router = useRouter();

  if (!data?.chapters) return null;

  const currentIndex = data.chapters.findIndex(
    (chapter) => chapter.id === parseInt(currentChapterId)
  );

  if (currentIndex === -1 || currentIndex === data.chapters.length - 1)
    return null;

  const nextChapter = data.chapters[currentIndex + 1];

  return (
    <Button className="gap-2 w-full max-w-2xl mx-auto">
      <Link
        to="/books/$bookId/chapters/$chapterId"
        params={{
          bookId: bookId,
          chapterId: nextChapter.id.toString(),
        }}
        className="flex gap-2 items-center justify-center"
      >
        <span>Continue to Next Chapter</span>
        <ArrowLeft className="h-4 w-4 rotate-180" />
      </Link>
    </Button>
  );
}
