import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  getConfiguration,
  updateConfiguration,
} from "~/data-access/configuration";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "~/hooks/use-debounce";
import { useToast } from "~/hooks/use-toast";
import { isAdminFn } from "~/fn/auth";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Toolbar } from "~/routes/books/$bookId/chapters/-components/toolbar";
import sanitizeHtml from "sanitize-html";

export const getConfigurationFn = createServerFn().handler(async () => {
  return await getConfiguration();
});

export const updateConfigurationFn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      about: z.string(),
    })
  )
  .handler(async ({ data }) => {
    // Sanitize the HTML content
    const sanitizedContent = sanitizeHtml(data.about, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "p",
        "a",
        "ul",
        "ol",
        "nl",
        "li",
        "b",
        "i",
        "strong",
        "em",
        "strike",
        "code",
        "hr",
        "br",
        "div",
        "table",
        "thead",
        "caption",
        "tbody",
        "tr",
        "th",
        "td",
        "pre",
        "span",
      ],
      allowedAttributes: {
        a: ["href", "name", "target", "class"],
        img: ["src", "alt", "title", "class"],
        "*": ["class"],
      },
      allowedSchemes: ["http", "https", "mailto", "tel"],
      transformTags: {
        a: (tagName, attribs) => {
          // Ensure external links open in new tab
          if (attribs.href && !attribs.href.startsWith("/")) {
            return {
              tagName,
              attribs: {
                ...attribs,
                target: "_blank",
                rel: "noopener noreferrer",
              },
            };
          }
          return { tagName, attribs };
        },
      },
    });

    return await updateConfiguration({ about: sanitizedContent });
  });

export const Route = createFileRoute("/about")({
  component: RouteComponent,
  loader: async ({ context }) => {
    const isAdmin = await isAdminFn();
    context.queryClient.ensureQueryData({
      queryKey: ["configuration"],
      queryFn: getConfigurationFn,
    });
    return { isAdmin };
  },
});

function EditableContent({
  content,
  isAdmin,
  onSave,
}: {
  content: string;
  isAdmin: boolean;
  onSave: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
    content: content || "",
    editable: false,
    onUpdate: ({ editor }) => {
      // TipTap manages its own state, no need for local state
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none min-h-[200px] p-4",
      },
    },
  });

  // Update editor content when data is loaded
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  // Update editable state when isEditing changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isAdmin && isEditing);
    }
  }, [editor, isAdmin, isEditing]);

  const handleSave = async () => {
    if (!editor) return;

    const newContent = editor.getHTML();
    if (newContent === content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await updateConfigurationFn({ data: { about: newContent } });
      toast({
        title: "Success",
        description: "Content saved successfully!",
      });
      setIsEditing(false);
      onSave();
    } catch (error) {
      console.error("Failed to save content:", error);
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (editor) {
      editor.commands.setContent(content);
    }
    setIsEditing(false);
  };

  if (!isAdmin) {
    return (
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  return (
    <div className="relative group">
      {isEditing ? (
        <div className="space-y-4">
          <div className="min-h-[500px] w-full rounded-md border border-input bg-transparent shadow-sm">
            <div className="opacity-100 transition-opacity">
              <Toolbar editor={editor} />
            </div>
            <div className="p-3">
              <EditorContent
                editor={editor}
                className="min-h-[460px]"
                aria-label="About content editor"
                tabIndex={0}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            {isSaving && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !editor || editor.getHTML() === content}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="prose max-w-none relative group/edit cursor-pointer rounded-lg p-4 transition-all hover:bg-gray-50 border border-transparent hover:border-gray-200"
          onClick={() => {
            setIsEditing(true);
            setTimeout(() => editor?.commands.focus(), 0);
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: content }} />
          <div className="absolute top-2 right-2 opacity-0 group-hover/edit:opacity-100 transition-opacity">
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Click to edit
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RouteComponent() {
  const { isAdmin } = Route.useLoaderData();

  const configuration = useSuspenseQuery({
    queryKey: ["configuration"],
    queryFn: getConfigurationFn,
  });

  return (
    <main className="mt-12 container mx-auto px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <EditableContent
          onSave={() => {
            configuration.refetch();
          }}
          content={configuration.data.about}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
