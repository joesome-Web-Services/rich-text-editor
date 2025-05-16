import { Loader2, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  wordCount: number;
}

export function SaveStatus({
  isSaving,
  lastSaved,
  wordCount,
}: SaveStatusProps) {
  return (
    <div className="fixed top-[80.5px] left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
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
        <div className="text-sm text-gray-600">
          {wordCount.toLocaleString()} {wordCount === 1 ? "word" : "words"}
        </div>
      </div>
    </div>
  );
}
