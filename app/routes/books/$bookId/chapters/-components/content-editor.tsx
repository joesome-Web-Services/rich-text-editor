import { cn } from "~/lib/utils";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Toolbar } from "./toolbar";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useRef } from "react";

interface ContentEditorProps {
  isAdmin: boolean;
  content?: string;
  onContentChange?: (content: string) => void;
  onWordCountChange?: (count: number) => void;
}

export function ContentEditor({
  isAdmin,
  content,
  onContentChange,
  onWordCountChange,
}: ContentEditorProps) {
  const lastSelection = useRef<{ from: number; to: number } | null>(null);

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
        if (onWordCountChange) {
          onWordCountChange(calculateWordCount(html));
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
    if (editor && content) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content);
        // Restore selection after content update
        if (lastSelection.current) {
          editor.commands.setTextSelection(lastSelection.current);
        }
        if (onWordCountChange) {
          onWordCountChange(calculateWordCount(content));
        }
      }
    }
  }, [editor, content, onWordCountChange]);

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
          <div className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
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
