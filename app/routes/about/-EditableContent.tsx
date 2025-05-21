import { useState, useEffect, useRef } from "react";
import { useDebounce } from "~/hooks/use-debounce";
import { useToast } from "~/hooks/use-toast";
import { isAdminFn } from "~/fn/auth";
import { Loader2, Eye, Pencil } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Toolbar } from "~/routes/books/$bookId/chapters/-components/toolbar";
import { useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";

const SAVE_DEBOUNCE_TIME = 1000;

interface EditableContentProps {
  content: string;
  onSave: (content: string) => Promise<void>;
  onSaveSuccess?: () => void;
}

export function EditableContent({
  content,
  onSave,
  onSaveSuccess,
}: EditableContentProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);

  const isAdmin = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

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
    editable: Boolean(isAdmin.data) && !isPreview,
    onUpdate: ({ editor }) => {
      // Trigger debounced save on content update
      if (editor.getHTML() !== content) {
        debouncedSave();
      }
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

  // Update editable state when admin status or preview mode changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(Boolean(isAdmin.data) && !isPreview);
    }
  }, [editor, isAdmin.data, isPreview]);

  const handleSave = async () => {
    if (!editor) return;

    const newContent = editor.getHTML();
    if (newContent === content) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newContent);
      onSaveSuccess?.();

      // Store current scroll position
      const scrollPosition = window.scrollY;

      // Restore focus after toast with a small delay
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          // Also ensure the editor is focused
          editor.commands.focus();
          // Restore scroll position
          window.scrollTo(0, scrollPosition);
        }
      }, 100);
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

  // Debounced save function
  const debouncedSave = useDebounce(handleSave, SAVE_DEBOUNCE_TIME);

  // Handle blur event
  const handleBlur = () => {
    if (editor && editor.getHTML() !== content) {
      handleSave();
    }
  };

  const handlePreviewToggle = async () => {
    if (!isPreview && editor) {
      // If switching to preview, save first
      const newContent = editor.getHTML();
      if (newContent !== content) {
        await handleSave();
      }
    }
    setIsPreview(!isPreview);
  };

  if (!isAdmin.data) {
    return (
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="space-y-4">
        {isPreview ? (
          <div>
            <div className="flex items-center justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviewToggle}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
            <div className="prose max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: editor?.getHTML() || content,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="prose max-w-none min-h-[500px] w-full rounded-md shadow-sm">
            <div className="flex items-center justify-end mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviewToggle}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </div>
            <Toolbar editor={editor} />
            <div>
              <EditorContent
                ref={editorRef}
                editor={editor}
                className="min-h-[460px] prose max-w-none border border-input bg-transparent focus:outline-none"
                aria-label="About content editor"
                tabIndex={0}
                onBlur={handleBlur}
              />
            </div>
          </div>
        )}
        {isSaving && (
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}
