import { Loader2, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getChapterFn } from "../-funs";

interface SaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  chapterId: string;
}

export function SaveStatus({
  isSaving,
  lastSaved,
  chapterId,
}: SaveStatusProps) {
  const chapterQuery = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => getChapterFn({ data: { chapterId } }),
    refetchOnWindowFocus: false,
  });

  const calculateWordCount = (content: string) => {
    const text = content.replace(/<[^>]*>/g, " ");
    const words = text.trim().split(/\s+/);
    return words.length;
  };

  return (
    <div className="fixed top-[80.5px] left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span>
                Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
              </span>
            </>
          ) : (
            <>
              <div className="h-4 w-4 animate-pulse rounded-full bg-gray-200" />
              <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            </>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {chapterQuery.data?.chapter.content &&
            calculateWordCount(chapterQuery.data?.chapter.content)}{" "}
          {chapterQuery.data?.chapter.content &&
          calculateWordCount(chapterQuery.data?.chapter.content) === 1
            ? "word"
            : "words"}
        </div>
      </div>
    </div>
  );
}
