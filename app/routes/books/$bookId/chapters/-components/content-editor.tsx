import { cn } from "~/lib/utils";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Toolbar } from "./toolbar";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

interface ContentEditorProps {
  isAdmin: boolean;
  content?: string;
  onContentChange?: (content: string) => void;
}

export function ContentEditor({
  isAdmin,
  content,
  onContentChange,
}: ContentEditorProps) {
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
      if (isAdmin && onContentChange) {
        onContentChange(editor.getHTML());
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
      editor.commands.setContent(content);
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
