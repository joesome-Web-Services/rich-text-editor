import { type Editor } from "@tiptap/react";
import { Toggle } from "~/components/ui/toggle";
import { Button } from "~/components/ui/button";
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
  Wand2,
  Loader2,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { refineTextFn } from "../-funs";
import { useToast } from "~/hooks/use-toast";

interface ToolbarProps {
  editor: Editor | null;
  hasSelection: boolean;
}

export function Toolbar({ editor, hasSelection }: ToolbarProps) {
  const [isRefineDialogOpen, setIsRefineDialogOpen] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [refinedText, setRefinedText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{
    from: number;
    to: number;
  } | null>(null);
  const { toast } = useToast();

  const refineMutation = useMutation({
    mutationFn: ({
      originalText,
      prompt,
    }: {
      originalText: string;
      prompt: string;
    }) =>
      refineTextFn({
        data: {
          originalText,
          prompt,
        },
      }),
    onSuccess: (data) => {
      setRefinedText(data.refinedText || "");
      setIsRefining(false);
    },
    onError: (error) => {
      console.error("Failed to refine text:", error);
      toast({
        title: "Error",
        description: "Failed to refine text. Please try again.",
        variant: "destructive",
      });
      setIsRefining(false);
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt("URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleRefineText = () => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, "\n");
    setOriginalText(selectedText);
    setSelectionRange({ from, to });
    setRefinedText("");
    setRefinementPrompt("");
    setIsRefining(false);
    setIsRefineDialogOpen(true);
  };

  const handleCancel = () => {
    setIsRefineDialogOpen(false);
    setRefinementPrompt("");
    setRefinedText("");
    setIsRefining(false);
    setSelectionRange(null);
  };

  const handleRefine = () => {
    if (!refinementPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a refinement prompt.",
        variant: "destructive",
      });
      return;
    }

    setIsRefining(true);
    refineMutation.mutate({
      originalText,
      prompt: refinementPrompt,
    });
  };

  const handleReplaceText = () => {
    if (editor && selectionRange) {
      editor
        .chain()
        .focus()
        .deleteRange(selectionRange)
        .insertContent(refinedText)
        .run();
      setIsRefineDialogOpen(false);
      setRefinementPrompt("");
      setRefinedText("");
      setSelectionRange(null);
      toast({
        title: "Success",
        description: "Text has been replaced successfully!",
      });
    }
  };

  return (
    <>
      <div className="border border-input bg-transparent rounded-t-md p-1 flex flex-wrap gap-1">
        {hasSelection && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefineText}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Refine Text
          </Button>
        )}
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
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
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

      <Dialog open={isRefineDialogOpen} onOpenChange={setIsRefineDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Refine Highlighted Text</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Highlighted Text</Label>
              <div className="rounded-md border p-3 text-sm">
                {originalText}
              </div>
            </div>
            {!refinedText ? (
              <div className="space-y-2">
                <Label>How would you like to refine this text?</Label>
                <Textarea
                  placeholder="Example: Make it more concise, improve the flow, add more detail..."
                  className="min-h-[150px]"
                  value={refinementPrompt}
                  onChange={(e) => setRefinementPrompt(e.target.value)}
                  disabled={isRefining}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Refined Text</Label>
                <div className="rounded-md border p-3 text-sm">
                  {refinedText}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isRefining}
            >
              Cancel
            </Button>
            {!refinedText ? (
              <Button onClick={handleRefine} disabled={isRefining}>
                {isRefining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refining...
                  </>
                ) : (
                  "Refine"
                )}
              </Button>
            ) : (
              <Button onClick={handleReplaceText} className="gap-2">
                <Check className="h-4 w-4" />
                Replace Text
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
