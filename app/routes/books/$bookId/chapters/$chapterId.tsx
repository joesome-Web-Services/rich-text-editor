import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";
import { Loader2, Globe, EyeOff } from "lucide-react";
import { isAdminFn } from "~/fn/auth";
import { useState, useEffect, useRef, Suspense } from "react";
import { Comments } from "./-components/comments";
import {
  getBookChaptersFn,
  getBookFn,
  getChapterFn,
  togglePublishFn,
} from "./-funs";
import { ChapterNavigation } from "./-components/chapter-navigation";
import { BookBanner } from "./-components/book-banner";
import { ChapterTitle } from "./-components/chapter-title";
import { ContentEditor } from "./-components/content-editor";
import { NextChapterButton } from "./-components/next-chapter-button";
import { SaveStatus } from "./-components/save-status";
import { ReadingProgress } from "./-components/reading-progress";
import { chapters, type Chapter } from "~/db/schema";
import { GoogleAd } from "~/components/google-ad";
import { getUserInfoFn } from "~/hooks/use-auth";
import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "~/lib/auth";
import { database } from "~/db";
import { eq } from "drizzle-orm";

const SAVE_DELAY = 1000;

const formSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ChapterData {
  chapter: Chapter;
}

export const updateChapterContentFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      chapterId: z.string(),
      content: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const [chapter] = await database
      .update(chapters)
      .set({
        content: data.content,
      })
      .where(eq(chapters.id, parseInt(data.chapterId)))
      .returning();
  });

function ChapterPanel({
  children,
  left,
  right,
}: {
  children?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm rounded-t-xl">
      <div className="flex items-center gap-2">{left}</div>
      <div className="flex items-center gap-2">{right}</div>
      {children}
    </div>
  );
}

export const Route = createFileRoute("/books/$bookId/chapters/$chapterId")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const { chapterId, bookId } = params;

    await context.queryClient.ensureQueryData({
      queryKey: ["isAdmin"],
      queryFn: isAdminFn,
    });

    await context.queryClient.ensureQueryData({
      queryKey: ["chapter", chapterId],
      queryFn: () => getChapterFn({ data: { chapterId } }),
    });

    await context.queryClient.ensureQueryData({
      queryKey: ["userInfo"],
      queryFn: () => getUserInfoFn(),
    });

    await context.queryClient.ensureQueryData({
      queryKey: ["book", bookId],
      queryFn: () => getBookFn({ data: { bookId } }),
    });

    await context.queryClient.ensureQueryData({
      queryKey: ["book-chapters", bookId],
      queryFn: () => getBookChaptersFn({ data: { bookId } }),
    });
  },
});

function RouteComponent() {
  const { chapterId, bookId } = Route.useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const chapterQuery = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => getChapterFn({ data: { chapterId } }),
    refetchOnWindowFocus: false,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (chapterQuery.data?.chapter) {
      form.reset({
        content: chapterQuery.data.chapter.content,
      });
      setLastSaved(new Date());
    }
  }, [chapterQuery.data, form]);

  const debounceSave = () => {
    console.log("debounceSave");
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const values = form.getValues();
      updateChapterMutation.mutateAsync({
        chapterId,
        content: values.content,
      });
    }, SAVE_DELAY);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const updateChapterMutation = useMutation({
    mutationFn: ({
      chapterId,
      content,
    }: {
      chapterId: string;
      content: string;
    }) =>
      updateChapterContentFn({
        data: {
          chapterId,
          content,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapter", chapterId] });
      setIsSaving(false);
      setLastSaved(new Date());
    },
    onError: (error) => {
      console.error("Failed to update chapter:", error);
      toast({
        title: "Error",
        description: "Failed to update chapter. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: (isPublished: boolean) =>
      togglePublishFn({
        data: {
          chapterId,
          isPublished,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapter", chapterId] });
      toast({
        title: "Success",
        description: `Chapter ${chapterQuery.data?.chapter.isPublished ? "unpublished" : "published"} successfully!`,
      });
    },
    onError: (error) => {
      console.error("Failed to toggle publish status:", error);
      toast({
        title: "Error",
        description: "Failed to update publish status. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (chapterQuery.error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-red-600">
          Error loading chapter: {chapterQuery.error.message}
        </div>
      </div>
    );
  }

  return (
    <>
      <ReadingProgress />
      <BookBanner bookId={bookId} chapterId={chapterId} />
      <SaveStatus
        isSaving={isSaving}
        lastSaved={lastSaved}
        chapterId={chapterId}
      />
      <div className="relative">
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="bg-white shadow-lg rounded-xl">
              <ChapterPanel
                left={
                  <div className="flex items-center gap-2">
                    Chapter:
                    <ChapterNavigation
                      bookId={bookId}
                      currentChapterId={chapterId}
                    />
                  </div>
                }
                right={
                  isAdmin && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        togglePublishMutation.mutate(
                          !chapterQuery.data?.chapter.isPublished
                        )
                      }
                      disabled={togglePublishMutation.isPending}
                      className="inline-flex items-center gap-2"
                    >
                      {togglePublishMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : chapterQuery.data?.chapter.isPublished ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          <span>Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4" />
                          <span>Publish</span>
                        </>
                      )}
                    </Button>
                  )
                }
              />
              <div className="px-6 py-10">
                <div className="max-w-3xl mx-auto">
                  <ChapterTitle chapterId={chapterId} />

                  <hr className="border-gray-400 my-4 mb-8 max-w-2xl mx-auto" />

                  <ContentEditor
                    content={chapterQuery.data?.chapter.content}
                    onContentChange={(content) => {
                      // Only update form when saving, not on every keystroke
                      if (saveTimeoutRef.current) {
                        clearTimeout(saveTimeoutRef.current);
                      }
                      saveTimeoutRef.current = setTimeout(() => {
                        form.setValue("content", content, {
                          shouldValidate: true,
                        });
                        debounceSave();
                      }, SAVE_DELAY);
                    }}
                  />

                  <div className="flex justify-end mt-8">
                    <NextChapterButton
                      bookId={bookId}
                      currentChapterId={chapterId}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-xl px-6 py-10">
              <Comments />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-full pointer-events-none">
          <div className="sticky top-4 pointer-events-auto">
            <GoogleAd
              slot="YOUR_AD_SLOT_ID"
              format="vertical"
              style={{ display: "block", width: "100%", height: "600px" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
