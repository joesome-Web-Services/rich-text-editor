import { Loader2, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
}

export function SaveStatus({ isSaving, lastSaved }: SaveStatusProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2">
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
  );
}
