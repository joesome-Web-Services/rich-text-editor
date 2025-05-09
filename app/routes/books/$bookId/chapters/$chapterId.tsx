import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { database } from "~/db";
import { chapters, books } from "~/db/schema";
import { eq, asc } from "drizzle-orm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
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
  Save,
  Eye,
  Edit,
  ChevronDown,
  Globe,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { Toggle } from "~/components/ui/toggle";
import { cn } from "~/lib/utils";
import { adminMiddleware } from "~/lib/auth";
import { isAdminFn } from "~/fn/auth";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Link as RouterLink } from "@tanstack/react-router";
import { Comments } from "./-components/comments";

const formSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  content: z.string().min(1, "Content is required"),
});

type FormValues = z.infer<typeof formSchema>;

const getChapterFn = createServerFn()
  .validator(
    z.object({
      chapterId: z.string(),
    })
  )
  .handler(async ({ data: { chapterId } }) => {
    const chapter = await database.query.chapters.findFirst({
      where: eq(chapters.id, parseInt(chapterId)),
    });

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    return { chapter };
  });

const updateChapterFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      chapterId: z.string(),
      title: z.string(),
      content: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const [chapter] = await database
      .update(chapters)
      .set({
        title: data.title,
        content: data.content,
      })
      .where(eq(chapters.id, parseInt(data.chapterId)))
      .returning();

    return { chapter };
  });

const getBookChaptersFn = createServerFn()
  .validator(
    z.object({
      bookId: z.string(),
    })
  )
  .handler(async ({ data: { bookId } }) => {
    const bookChapters = await database.query.chapters.findMany({
      where: eq(chapters.bookId, parseInt(bookId)),
      orderBy: asc(chapters.id),
    });

    return { chapters: bookChapters };
  });

const togglePublishFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(
    z.object({
      chapterId: z.string(),
      isPublished: z.boolean(),
    })
  )
  .handler(async ({ data }) => {
    const [chapter] = await database
      .update(chapters)
      .set({
        isPublished: data.isPublished,
      })
      .where(eq(chapters.id, parseInt(data.chapterId)))
      .returning();

    return { chapter };
  });

const getBookFn = createServerFn()
  .validator(
    z.object({
      bookId: z.string(),
    })
  )
  .handler(async ({ data: { bookId } }) => {
    const book = await database.query.books.findFirst({
      where: eq(books.id, parseInt(bookId)),
    });

    if (!book) {
      throw new Error("Book not found");
    }

    return { book };
  });

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

interface ChapterViewProps {
  title: string;
  content: string;
  bookId: string;
  chapterId: string;
}

function ChapterView({ title, content, bookId, chapterId }: ChapterViewProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">{title}</h1>
      <hr className="border-gray-400 my-4 mb-8 max-w-2xl mx-auto" />
      <div
        className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl"
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <div className="flex justify-end mt-8">
        <NextChapterButton bookId={bookId} currentChapterId={chapterId} />
      </div>
      <hr className="border-gray-400 my-12 max-w-2xl mx-auto" />
    </div>
  );
}

interface ChapterNavigationProps {
  bookId: string;
  currentChapterId: string;
}

function ChapterNavigation({
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
            <RouterLink
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
            </RouterLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
  const [isPreview, setIsPreview] = useState(false);

  const { data: bookData } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBookFn({ data: { bookId } }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => getChapterFn({ data: { chapterId } }),
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
    editable: isAdmin && !isPreview,
    onUpdate: ({ editor }) => {
      if (isAdmin && !isPreview) {
        form.setValue("content", editor.getHTML(), { shouldValidate: true });
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
      toast({
        title: "Success",
        description: "Chapter updated successfully!",
      });
    },
    onError: (error) => {
      console.error("Failed to update chapter:", error);
      toast({
        title: "Error",
        description: "Failed to update chapter. Please try again.",
        variant: "destructive",
      });
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

  if (!isAdmin) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <ChapterView
          title={chapter.title}
          content={chapter.content}
          bookId={bookId}
          chapterId={chapterId}
        />
        <Comments />
      </div>
    );
  }

  const onSubmit = (values: FormValues) => {
    updateChapterMutation.mutate(values);
  };

  return (
    <>
      <div className="pt-4 border-b border-gray-200 pb-4 text-center flex gap-4 justify-center items-center">
        <RouterLink
          to="/books/$bookId"
          className="flex gap-2 items-center"
          params={{
            bookId: bookId,
          }}
        >
          <img
            src="https://img.wattpad.com/cover/392642739-256-k475365.jpg"
            className="size-6 object-cover rounded-full shadow-md"
          />
          <h1 className="text-xl font-semibold text-muted-foreground">
            {bookData?.book.title}
          </h1>
        </RouterLink>
      </div>

      <div className="max-w-3xl mx-auto pt-12">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <ChapterNavigation bookId={bookId} currentChapterId={chapterId} />
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreview(!isPreview)}
                  className="inline-flex items-center gap-2"
                >
                  {isPreview ? (
                    <>
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Preview</span>
                    </>
                  )}
                </Button>
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
                <Button
                  type="submit"
                  form="chapter-form"
                  disabled={updateChapterMutation.isPending || isPreview}
                  className="inline-flex items-center gap-2"
                >
                  {updateChapterMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Changes</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {isPreview ? (
          <>
            <ChapterView
              title={form.getValues("title")}
              content={form.getValues("content")}
              bookId={bookId}
              chapterId={chapterId}
            />
          </>
        ) : (
          <Form {...form}>
            <form
              id="chapter-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Chapter Title"
                        disabled={isPreview}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div
                        className={cn(
                          "min-h-[500px] w-full rounded-md border border-input bg-transparent shadow-sm",
                          "focus-within:outline-none focus-within:ring-1 focus-within:ring-ring"
                        )}
                      >
                        <Toolbar editor={editor} />
                        <div className="p-3">
                          <EditorContent
                            editor={editor}
                            className="min-h-[460px]"
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        <Comments />
      </div>
    </>
  );
}
