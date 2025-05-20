import { cn } from "~/lib/utils";
import { useState, useRef, useEffect } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAdminFn } from "~/fn/auth";
import { getChapterFn } from "../-funs";
import { useToast } from "~/hooks/use-toast";
import { Skeleton } from "~/components/ui/skeleton";
import { adminMiddleware } from "~/lib/auth";
import { createServerFn } from "@tanstack/react-start";
import { database } from "~/db";
import { z } from "zod";
import { chapters } from "~/db/schema";
import { eq } from "drizzle-orm";

const SAVE_DELAY = 1000;

interface ChapterTitleProps {
  chapterId: string;
}

export const updateChapterTitleFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(
    z.object({
      chapterId: z.string(),
      title: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const [chapter] = await database
      .update(chapters)
      .set({
        title: data.title,
      })
      .where(eq(chapters.id, parseInt(data.chapterId)))
      .returning();
  });

export function ChapterTitle({ chapterId }: ChapterTitleProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: isAdminFn,
  });

  const { data: chapterData, isLoading } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => getChapterFn({ data: { chapterId } }),
  });

  // Keep local title in sync with chapter data
  useEffect(() => {
    if (chapterData?.chapter) {
      setLocalTitle(chapterData.chapter.title);
    }
  }, [chapterData?.chapter]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const updateChapterMutation = useMutation({
    mutationFn: (newTitle: string) =>
      updateChapterTitleFn({
        data: {
          chapterId,
          title: newTitle,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chapter", chapterId] });
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Failed to update chapter title:", error);
      toast({
        title: "Error",
        description: "Failed to update chapter title. Please try again.",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const debounceSave = (newTitle: string) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateChapterMutation.mutateAsync(newTitle);
    }, SAVE_DELAY);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto mb-8">
        <Skeleton className="h-10 w-3/4 mx-auto" />
      </div>
    );
  }

  if (!chapterData?.chapter) {
    return null;
  }

  return isAdmin && isEditingTitle ? (
    <input
      type="text"
      value={localTitle}
      spellCheck={false}
      className={cn(
        "text-3xl font-bold mb-8 text-center w-full bg-transparent border-none outline-none focus:ring-0 focus:ring-offset-0 p-0 m-0 block",
        isSaving && "opacity-50"
      )}
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
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalTitle(newValue);
        debounceSave(newValue);
      }}
      onBlur={() => {
        setIsEditingTitle(false);
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
      onClick={() => {
        if (isAdmin) {
          setIsEditingTitle(true);
          setLocalTitle(chapterData.chapter.title);
        }
      }}
    >
      {chapterData.chapter.title}
    </h1>
  );
}
