import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { cn } from "~/lib/utils";
import { isAdminFn } from "~/fn/auth";
import { useState, useEffect, useRef } from "react";
import { Link as RouterLink } from "@tanstack/react-router";
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

const formSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z.string().min(1, "Content is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface ToolbarProps {
  editor: Editor | null;
}

function Toolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("link")}
        onPressedChange={addLink}
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface NextChapterButtonProps {
  bookId: string;
  currentChapterId: string;
}

function NextChapterButton({
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
    <Button
      className="gap-2 w-full max-w-2xl mx-auto"
      onClick={() => {
        router.navigate({
          to: "/books/$bookId/chapters/$chapterId",
          params: {
            bookId: bookId,
            chapterId: nextChapter.id.toString(),
          },
        });
      }}
    >
      <span>Continue to Next Chapter</span>
      <ArrowLeft className="h-4 w-4 rotate-180" />
    </Button>
  );
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const { data: bookData } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBookFn({ data: { bookId } }),
  });

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

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
        },
      }),
    ],
    content: "",
    editable: isAdmin,
    onUpdate: ({ editor }) => {
      if (isAdmin) {
        form.setValue("content", editor.getHTML(), { shouldValidate: true });
        debounceSave();
      }
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none",
      },
    },
  });

  // Update editor content when data is loaded
  useEffect(() => {
    if (editor && data?.chapter) {
      editor.commands.setContent(data.chapter.content);
    }
  }, [editor, data]);

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

  const debounceSave = () => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const values = form.getValues();
      updateChapterMutation.mutate(values);
    }, 3000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
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

  if (!data) {
    return null;
  }

  const { chapter } = data;

  return (
    <>
      <div className="pt-4 bg-white border-b border-gray-200 pb-4 text-center flex gap-4 justify-center items-center">
        <RouterLink
          to="/books/$bookId"
          className="flex gap-2 items-center"
          params={{
            bookId: bookId,
          }}
        >
          {bookData?.book.coverImage?.data ? (
            <img
              src={bookData.book.coverImage.data}
              alt={`Cover for ${bookData.book.title}`}
              className="size-6 object-cover rounded-full shadow-md"
            />
          ) : (
            <div className="size-6 rounded-full bg-gray-200 shadow-md" />
          )}
          <p className="text-xl font-semibold text-muted-foreground">
            {bookData?.book.title}
          </p>
        </RouterLink>
      </div>

      <div className="max-w-5xl mx-auto py-12">
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
                {isAdmin && isEditingTitle ? (
                  <input
                    {...form.register("title")}
                    type="text"
                    spellCheck={false}
                    className="text-3xl font-bold mb-8 text-center w-full bg-transparent border-none outline-none focus:ring-0 focus:ring-offset-0 p-0 m-0 block"
                    style={{
                      fontFamily: "inherit",
                      lineHeight: "1.2",
                      letterSpacing: "inherit",
                      appearance: "none",
                      MozAppearance: "none",
                      WebkitAppearance: "none",
                      marginBottom: "2rem",
                      padding: 0,
                      height: "auto",
                      minHeight: "unset",
                    }}
                    onBlur={() => {
                      setIsEditingTitle(false);
                      debounceSave();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setIsEditingTitle(false);
                        debounceSave();
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <h1
                    className={cn(
                      "text-3xl font-bold mb-8 text-center",
                      isAdmin &&
                        "cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                    )}
                    onClick={() => isAdmin && setIsEditingTitle(true)}
                  >
                    {form.watch("title")}
                  </h1>
                )}
                <hr className="border-gray-400 my-4 mb-8 max-w-2xl mx-auto" />
                <div
                  className={cn(
                    "prose prose-sm sm:prose lg:prose-lg xl:prose-xl",
                    isAdmin && "group"
                  )}
                >
                  {isAdmin ? (
                    <div className="min-h-[500px] w-full rounded-md border border-input bg-transparent shadow-sm">
                      <div className="opacity-0 group-focus-within:opacity-100 transition-opacity">
                        <Toolbar editor={editor} />
                      </div>
                      <div className="p-3">
                        <EditorContent
                          editor={editor}
                          className="min-h-[460px]"
                          aria-label="Chapter content editor"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{ __html: chapter.content }}
                    />
                  )}
                </div>
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

      {/* Save Status Indicator */}
      <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2">
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
        ) : null}
      </div>
    </>
  );
}
