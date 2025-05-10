import { cn } from "~/lib/utils";
import { useState } from "react";
import React from "react";

interface ChapterTitleProps {
  title: string;
  isAdmin: boolean;
  onTitleChange: (newTitle: string) => void;
}

export function ChapterTitle({
  title,
  isAdmin,
  onTitleChange,
}: ChapterTitleProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

  // Keep local title in sync with prop
  React.useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  return isAdmin && isEditingTitle ? (
    <input
      type="text"
      value={localTitle}
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
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setLocalTitle(newValue);
        onTitleChange(newValue);
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
          setLocalTitle(title);
        }
      }}
    >
      {title}
    </h1>
  );
}
