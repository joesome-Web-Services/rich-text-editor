import { cn } from "~/lib/utils";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Toolbar } from "./toolbar";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAdminFn } from "~/fn/auth";

interface ContentEditorProps {
  content?: string;
  onContentChange?: (content: string) => void;
}

export function ContentEditor({
  content,
  onContentChange,
}: ContentEditorProps) {
  const lastSelection = useRef<{ from: number; to: number } | null>(null);

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

  const calculateWordCount = (html: string) => {
    const text = html.replace(/<[^>]*>/g, " ");
    const words = text.trim().split(/\s+/);
    return words.length;
  };

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
        // Store current selection before update
        const { from, to } = editor.state.selection;
        lastSelection.current = { from, to };

        const html = editor.getHTML();
        if (onContentChange) {
          onContentChange(html);
        }
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
    if (editor) {
      if (content) {
        editor.commands.setContent(content);
        // Restore selection after content update
        if (lastSelection.current) {
          editor.commands.setTextSelection(lastSelection.current);
        }
      } else {
        // Clear the editor when content is empty or undefined
        editor.commands.setContent("");
      }
    }
  }, [editor, content]);

  return (
    <div
      className={cn(
        "prose prose-sm sm:prose lg:prose-lg xl:prose-xl",
        isAdmin && "group"
      )}
    >
      {isAdmin ? (
        <div
          className="min-h-[500px] w-full rounded-md border border-input bg-transparent shadow-sm"
          onMouseDown={(e) => {
            if (editor && e.target === e.currentTarget) {
              editor.commands.focus();
            }
          }}
        >
          <div className="border-b border-input">
            <Toolbar editor={editor} />
          </div>
          <div
            className="p-3"
            onClick={(e) => {
              if (editor && e.target === e.currentTarget) {
                editor.commands.focus();
              }
            }}
          >
            <EditorContent
              editor={editor}
              className="min-h-[460px]"
              aria-label="Chapter content editor"
              tabIndex={0}
            />
          </div>
        </div>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: content || "" }} />
      )}
    </div>
  );
}
