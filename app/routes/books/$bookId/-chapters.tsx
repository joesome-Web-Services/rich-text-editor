import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { PlusCircle, Loader2, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "~/components/ui/skeleton";
import { type Chapter } from "~/db/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "~/hooks/use-toast";
import { createChapterFn, getBookWithChaptersFn } from "./index";
import { isAdminFn } from "~/fn/auth";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { database } from "~/db";
import { chapters } from "~/db/schema";
import { eq } from "drizzle-orm";
import { adminMiddleware } from "~/lib/auth";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export const reorderChaptersFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      bookId: z.string(),
      chapterIds: z.array(z.number()),
    })
  )
  .handler(async ({ data }) => {
    // Update all chapters with new order values
    const updates = data.chapterIds.map((id, index) => ({
      id,
      order: index + 1,
    }));

    // Perform the updates in a transaction
    await database.transaction(async (tx) => {
      for (const update of updates) {
        await tx
          .update(chapters)
          .set({ order: update.order })
          .where(eq(chapters.id, update.id));
      }
    });

    return { success: true };
  });

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

  const reorderChaptersMutation = useMutation({
    mutationFn: (chapterIds: number[]) =>
      reorderChaptersFn({ data: { bookId, chapterIds } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookWithChapters", bookId] });
      toast({
        title: "Success",
        description: "Chapters reordered successfully!",
      });
    },
    onError: (error) => {
      console.error("Failed to reorder chapters:", error);
      toast({
        title: "Error",
        description: "Failed to reorder chapters. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination || !bookData) return;

    const items = Array.from(bookData.chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    reorderChaptersMutation.mutate(items.map((c) => c.id));
  };

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
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="chapters">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {bookData.chapters.map((chapter, index) => (
                    <Draggable
                      key={chapter.id}
                      draggableId={chapter.id.toString()}
                      index={index}
                      isDragDisabled={!isAdmin}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.5 : 1,
                          }}
                        >
                          <Link
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
                              <div className="flex items-center gap-2">
                                {isAdmin && (
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
                                  >
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                                <div className="font-medium">
                                  {chapter.title}
                                  {!chapter.isPublished && (
                                    <span className="ml-2 text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                                      Draft
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-500">
                                {format(
                                  new Date(chapter.createdAt),
                                  "MMM d, yyyy"
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );
}
