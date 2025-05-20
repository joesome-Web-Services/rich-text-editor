import { Send, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useAuth } from "~/hooks/use-auth";
import { useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCommentFn,
  getChapterCommentsFn,
  deleteCommentFn,
} from "~/fn/comments";
import { useToast } from "~/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Comment as CommentType } from "~/db/schema";
import { isAdmin } from "~/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

interface CommentProps {
  id: number;
  author: string;
  date: string;
  content: string;
  avatarUrl?: string;
  userId: number;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function FormattedDate({ date }: { date: string }) {
  const [formattedDate, setFormattedDate] = useState(date);

  useEffect(() => {
    setFormattedDate(format(new Date(date), "MMM d, yyyy 'at' h:mm a"));
  }, [date]);

  return <span className="text-muted-foreground text-sm">{formattedDate}</span>;
}

function Comment({
  id,
  author,
  date,
  content,
  avatarUrl,
  userId,
  onDelete,
  isDeleting,
}: CommentProps) {
  const user = useAuth();
  const isOwner = user?.id === userId;
  const canDelete = isOwner || (user && isAdmin(user));

  return (
    <div className="flex gap-4 py-4">
      <Avatar>
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>{author[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">{author}</span>
          <FormattedDate date={date} />
        </div>
        <p className="text-sm text-muted-foreground">{content}</p>
      </div>
      {canDelete && onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="self-start text-muted-foreground hover:text-destructive"
              disabled={isDeleting}
              title={isOwner ? "Delete your comment" : "Delete comment (Admin)"}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                {isOwner
                  ? "Are you sure you want to delete your comment? This action cannot be undone."
                  : "As an admin, are you sure you want to delete this comment? This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

type CommentWithUser = CommentType & {
  user: {
    id: number;
    profile: {
      displayName: string | null;
      image: string | null;
    } | null;
  };
};

export function Comments() {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const user = useAuth();
  const { chapterId } = useParams({
    from: "/books/$bookId/chapters/$chapterId",
  });
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", chapterId] as const,
    queryFn: () => getChapterCommentsFn({ data: { chapterId } }),
  });

  const createComment = useMutation({
    mutationFn: (content: string) =>
      createCommentFn({ data: { chapterId, content } }),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", chapterId] });
      toast({
        title: "Success",
        description: "Your comment has been posted!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post your comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: number) => deleteCommentFn({ data: { commentId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", chapterId] });
      toast({
        title: "Success",
        description: "Comment deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment.mutate(newComment);
  };

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <h2 className="text-2xl font-bold mb-6">Comments</h2>

      {user && (
        <div className="mb-8">
          <div className="flex gap-4">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              disabled={createComment.isPending}
            />
            <Button
              className="self-end"
              onClick={handleSubmit}
              disabled={createComment.isPending || !newComment.trim()}
            >
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1 divide-y">
        {isLoading ? (
          <div className="space-y-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          (comments as CommentWithUser[]).map((comment) => (
            <Comment
              key={comment.id}
              id={comment.id}
              author={comment.user.profile?.displayName || "Anonymous"}
              date={format(new Date(comment.createdAt), "yyyy-MM-dd HH:mm:ss")}
              content={comment.content}
              avatarUrl={comment.user.profile?.image || undefined}
              userId={comment.user.id}
              onDelete={() => deleteComment.mutate(comment.id)}
              isDeleting={
                deleteComment.isPending &&
                deleteComment.variables === comment.id
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
