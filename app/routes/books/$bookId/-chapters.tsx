import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { PlusCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "~/components/ui/skeleton";
import { type Chapter } from "~/db/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "~/hooks/use-toast";
import { createChapterFn, getBookWithChaptersFn } from "./index";
import { isAdminFn } from "~/fn/auth";

interface ChaptersProps {
  bookId: string;
}

export function Chapters({ bookId }: ChaptersProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

  const {
    data: bookData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bookWithChapters", bookId],
    queryFn: () => getBookWithChaptersFn({ data: { bookId } }),
  });

  const router = useRouter();

  const createChapterMutation = useMutation({
    mutationFn: () => createChapterFn({ data: { bookId } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["book", bookId] });
      router.navigate({
        to: "/books/$bookId/chapters/$chapterId",
        params: {
          bookId,
          chapterId: data.chapter.id.toString(),
        },
      });
      toast({
        title: "Success",
        description: "Chapter created successfully!",
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

  if (error) {
    return (
      <Card className="mb-8">
        <CardContent>
          <div className="text-rose-500">
            Error loading chapters: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log(bookData);

  return (
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
        {!bookData ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : bookData.chapters.length === 0 ? (
          <p className="text-gray-500">No chapters available yet.</p>
        ) : (
          <div className="space-y-2">
            {bookData.chapters.map((chapter: Chapter, index: number) => (
              <Link
                key={chapter.id}
                to="/books/$bookId/chapters/$chapterId"
                params={{
                  bookId,
                  chapterId: chapter.id.toString(),
                }}
                className={`block p-4 rounded-lg border transition-colors ${
                  chapter.isPublished
                    ? "border-gray-200 hover:border-rose-400 hover:bg-rose-50"
                    : "border-gray-200 bg-gray-100 hover:border-gray-300 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {chapter.title}
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
  );
}
