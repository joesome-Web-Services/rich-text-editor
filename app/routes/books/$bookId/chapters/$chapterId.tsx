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
import { getChapterFn, togglePublishFn, updateChapterFn } from "./-funs";
import { ChapterNavigation } from "./-components/chapter-navigation";
import { BookBanner } from "./-components/book-banner";
import { ChapterTitle } from "./-components/chapter-title";
import { ContentEditor } from "./-components/content-editor";
import { NextChapterButton } from "./-components/next-chapter-button";
import { SaveStatus } from "./-components/save-status";
import { ReadingProgress } from "./-components/reading-progress";
import type { Chapter } from "~/db/schema";
import { GoogleAd } from "~/components/google-ad";

const SAVE_DELAY = 1000;

const formSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z.string().min(1, "Content is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ChapterData {
  chapter: Chapter;
}

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
    const { chapterId } = params;

    context.queryClient.ensureQueryData({
      queryKey: ["isAdmin"],
      queryFn: isAdminFn,
    });

    context.queryClient.ensureQueryData({
      queryKey: ["chapter", chapterId],
      queryFn: () => getChapterFn({ data: { chapterId } }),
    });
  },
});

function RouteComponent() {
  const { chapterId, bookId } = Route.useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const { data, isLoading, error } = useQuery({
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
      title: "",
      content: "",
    },
  });

  // Update form values when data is loaded
  useEffect(() => {
    if (data?.chapter) {
      form.reset({
        title: data.chapter.title,
        content: data.chapter.content,
      });
      setLastSaved(new Date());
    }
  }, [data, form]);

  const calculateWordCount = (content: string) => {
    // Remove HTML tags and count words
    const text = content.replace(/<[^>]*>/g, " ");
    const words = text.trim().split(/\s+/);
    return words.length;
  };

  // Update word count when content changes
  useEffect(() => {
    if (data?.chapter) {
      setWordCount(calculateWordCount(data.chapter.content));
    }
  }, [data?.chapter]);

  const debounceSave = () => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const values = form.getValues();
      updateChapterMutation
        .mutateAsync(values)
        .then(() =>
          queryClient.invalidateQueries({ queryKey: ["book-chapters"] })
        );
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
    mutationFn: (values: FormValues) =>
      updateChapterFn({
        data: {
          chapterId,
          title: values.title,
          content: values.content,
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
        description: `Chapter ${data?.chapter.isPublished ? "unpublished" : "published"} successfully!`,
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

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-red-600">
          Error loading chapter: {error.message}
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
        wordCount={wordCount}
      />
      <div className="relative">
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="bg-white shadow-lg rounded-xl">
              <ChapterPanel
                left={
                  <ChapterNavigation
                    bookId={bookId}
                    currentChapterId={chapterId}
                  />
                }
                right={
                  isAdmin && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        togglePublishMutation.mutate(!data?.chapter.isPublished)
                      }
                      disabled={togglePublishMutation.isPending}
                      className="inline-flex items-center gap-2"
                    >
                      {togglePublishMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : data?.chapter.isPublished ? (
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
                  <ChapterTitle
                    title={form.watch("title")}
                    onTitleChange={(newTitle) => {
                      form.setValue("title", newTitle, {
                        shouldValidate: true,
                      });
                      debounceSave();
                    }}
                  />

                  <hr className="border-gray-400 my-4 mb-8 max-w-2xl mx-auto" />

                  <ContentEditor
                    content={data?.chapter.content}
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
                    onWordCountChange={setWordCount}
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
