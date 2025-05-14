import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Loader2,
  Globe,
  EyeOff,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Toggle } from "~/components/ui/toggle";
import { isAdminFn } from "~/fn/auth";
import { useState, useEffect, useRef, Suspense } from "react";
import { Comments } from "./-components/comments";
import { formatDistanceToNow } from "date-fns";
import {
  getBookChaptersFn,
  getBookFn,
  getChapterFn,
  togglePublishFn,
  updateChapterFn,
} from "./-funs";
import { ChapterNavigation } from "./-components/chapter-navigation";
import { BookTitle } from "./-components/book-title";
import { ChapterTitle } from "./-components/chapter.title";
import { ContentEditor } from "./-components/content-editor";
import { NextChapterButton } from "./-components/next-chapter-button";
import { SaveStatus } from "./-components/save-status";
import { ReadingProgress } from "./-components/reading-progress";
import type { Chapter } from "~/db/schema";

const SAVE_DELAY = 2000;

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
  loader: async () => {
    const isAdmin = await isAdminFn();
    return { isAdmin };
  },
});

function RouteComponent() {
  const { chapterId, bookId } = Route.useParams();
  const { isAdmin } = Route.useLoaderData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => getChapterFn({ data: { chapterId } }),
    refetchOnWindowFocus: false,
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

  const debounceSave = () => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const values = form.getValues();
      updateChapterMutation.mutate(values);
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

  if (isLoading) {
    return (
      <>
        <ReadingProgress />
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {/* Chapter Content Card */}
            <div className="bg-white shadow-lg rounded-xl">
              {/* Chapter Panel Skeleton */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm rounded-t-xl">
                <div className="flex items-center gap-4">
                  <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-9 bg-gray-200 rounded w-28 animate-pulse"></div>
              </div>

              {/* Chapter Content Skeleton */}
              <div className="px-6 py-10">
                <div className="max-w-3xl mx-auto">
                  {/* Title Skeleton */}
                  <div className="h-10 bg-gray-200 rounded w-3/4 mb-8 animate-pulse"></div>

                  <hr className="border-gray-400 my-4 mb-8 max-w-2xl mx-auto" />

                  {/* Content Editor Skeleton */}
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  </div>

                  {/* Next Chapter Button Skeleton */}
                  <div className="flex justify-end mt-8">
                    <div className="h-9 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section Skeleton */}
            <div className="bg-white shadow-lg rounded-xl px-6 py-10">
              <div className="space-y-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6 animate-pulse"></div>
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-red-600">
          Error loading chapter: {error.message}
        </div>
      </div>
    );
  }

  if (!data?.chapter) {
    return null;
  }

  const { chapter } = data;

  return (
    <>
      <ReadingProgress />
      <Suspense
        fallback={
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-6 py-4">
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        }
      >
        <BookTitle bookId={bookId} chapterTitle={data.chapter.title} />
      </Suspense>
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
                  isAdmin={isAdmin}
                  onTitleChange={(newTitle) => {
                    form.setValue("title", newTitle, { shouldValidate: true });
                    debounceSave();
                  }}
                />

                <hr className="border-gray-400 my-4 mb-8 max-w-2xl mx-auto" />

                <ContentEditor
                  isAdmin={isAdmin}
                  content={chapter.content}
                  onContentChange={(content) => {
                    form.setValue("content", content, { shouldValidate: true });
                    debounceSave();
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
      <SaveStatus isSaving={isSaving} lastSaved={lastSaved} />
    </>
  );
}
