import { Send, Trash2, Heart } from "lucide-react";
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
  heartCommentFn,
  unheartCommentFn,
  getCommentHeartsFn,
} from "~/fn/comments";
import { useToast } from "~/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
import { UseMutationResult } from "@tanstack/react-query";

interface CommentProps {
  id: number;
  author: string;
  date: string;
  content: string;
  avatarUrl?: string;
  userId: number;
  onDelete?: () => void;
  isDeleting?: boolean;
  heartCount?: number;
  heartedByUser?: boolean;
  onHeart?: () => void;
  onUnheart?: () => void;
  canHeart?: boolean;
  heartLoading?: boolean;
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
  heartCount = 0,
  heartedByUser = false,
  onHeart,
  onUnheart,
  canHeart = false,
  heartLoading = false,
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
          <span className="text-muted-foreground text-sm">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{content}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={heartedByUser ? "default" : "ghost"}
            size="icon"
            className={`text-muted-foreground ${heartedByUser ? "text-red-500" : ""}`}
            onClick={heartedByUser ? onUnheart : onHeart}
            disabled={!canHeart || heartLoading}
            title={heartedByUser ? "Unheart" : "Heart"}
          >
            <Heart
              className={`h-4 w-4 ${heartedByUser ? "fill-red-500" : ""}`}
            />
          </Button>
          <span className="text-xs text-muted-foreground">{heartCount}</span>
        </div>
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

// Utility to build a tree from flat comments
function buildCommentTree(comments: CommentWithUser[]): CommentTreeNode[] {
  const map = new Map<number, CommentTreeNode>();
  const roots: CommentTreeNode[] = [];
  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, children: [] });
  });
  map.forEach((node) => {
    if (node.parentCommentId && map.has(node.parentCommentId)) {
      map.get(node.parentCommentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

type CommentTreeNode = CommentWithUser & { children: CommentTreeNode[] };

function CommentThread({
  node,
  onReply,
  onDelete,
  isDeleting,
  replyingTo,
  createComment,
  user,
  heartCount = 0,
  heartedByUser = false,
  onHeart,
  onUnheart,
  canHeart = false,
  heartLoading = false,
  heartData,
  heartComment,
  unheartComment,
  userId,
}: {
  node: CommentTreeNode;
  onReply: (id: number | null) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  replyingTo: number | null;
  createComment: ReturnType<
    typeof useMutation<
      { [x: string]: any } | undefined,
      Error,
      { content: string; parentCommentId?: number | null },
      unknown
    >
  >;
  user: ReturnType<typeof useAuth>;
  heartCount?: number;
  heartedByUser?: boolean;
  onHeart?: () => void;
  onUnheart?: () => void;
  canHeart?: boolean;
  heartLoading?: boolean;
  heartData?: {
    counts: Record<number, number>;
    userHearted: Record<number, boolean>;
  };
  heartComment?: UseMutationResult<
    { success: boolean },
    Error,
    number,
    unknown
  >;
  unheartComment?: UseMutationResult<
    { success: boolean },
    Error,
    number,
    unknown
  >;
  userId?: number;
}) {
  const [replyContent, setReplyContent] = useState("");
  const isReplying = replyingTo === node.id;
  return (
    <div className="ml-0 md:ml-8 mt-4">
      <Comment
        id={node.id}
        author={node.user.profile?.displayName || "Anonymous"}
        date={node.createdAt}
        content={node.content}
        avatarUrl={node.user.profile?.image || undefined}
        userId={node.user.id}
        onDelete={() => onDelete(node.id)}
        isDeleting={isDeleting}
        heartCount={heartCount}
        heartedByUser={heartedByUser}
        onHeart={onHeart}
        onUnheart={onUnheart}
        canHeart={canHeart}
        heartLoading={heartLoading}
      />
      {user && (
        <div className="mb-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => onReply(node.id)}
            className="px-0"
          >
            Reply
          </Button>
        </div>
      )}
      {isReplying && (
        <div className="mb-4">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="flex-1"
            disabled={createComment.isPending}
          />
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => {
                if (!replyContent.trim()) return;
                createComment.mutate({
                  content: replyContent,
                  parentCommentId: node.id,
                });
                setReplyContent("");
              }}
              disabled={createComment.isPending || !replyContent.trim()}
            >
              {createComment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" onClick={() => onReply(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {node.children.length > 0 &&
        heartData &&
        heartComment &&
        unheartComment &&
        userId !== undefined && (
          <div className="ml-4 border-l border-muted-foreground/10 pl-4">
            {node.children.map((child: CommentTreeNode) => (
              <CommentThread
                key={child.id}
                node={child}
                onReply={onReply}
                onDelete={onDelete}
                isDeleting={isDeleting && child.id === node.id}
                replyingTo={replyingTo}
                createComment={createComment}
                user={user}
                heartCount={heartData.counts[child.id] || 0}
                heartedByUser={!!heartData.userHearted[child.id]}
                onHeart={() => heartComment.mutate(child.id)}
                onUnheart={() => unheartComment.mutate(child.id)}
                canHeart={user && user.id !== child.user.id}
                heartLoading={
                  heartComment.isPending || unheartComment.isPending
                }
                heartData={heartData}
                heartComment={heartComment}
                unheartComment={unheartComment}
                userId={userId}
              />
            ))}
          </div>
        )}
    </div>
  );
}

export function Comments() {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
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

  // Heart state
  const commentIds = (comments as CommentWithUser[]).map((c) => c.id);
  const {
    data: heartData = {
      counts: {} as Record<number, number>,
      userHearted: {} as Record<number, boolean>,
    },
    refetch: refetchHearts,
    isFetching: isFetchingHearts,
  } = useQuery<{
    counts: Record<number, number>;
    userHearted: Record<number, boolean>;
  }>({
    queryKey: ["commentHearts", commentIds],
    queryFn: () =>
      user
        ? getCommentHeartsFn({ data: { commentIds } })
        : Promise.resolve({ counts: {}, userHearted: {} }),
    enabled: commentIds.length > 0 && !!user,
  });

  const createComment = useMutation<
    { [x: string]: any } | undefined,
    Error,
    { content: string; parentCommentId?: number | null },
    unknown
  >({
    mutationFn: ({
      content,
      parentCommentId,
    }: {
      content: string;
      parentCommentId?: number | null;
    }) => createCommentFn({ data: { chapterId, content, parentCommentId } }),
    onSuccess: () => {
      setNewComment("");
      setReplyingTo(null);
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

  const heartComment = useMutation({
    mutationFn: (commentId: number) => heartCommentFn({ data: { commentId } }),
    onSuccess: () => refetchHearts(),
  });
  const unheartComment = useMutation({
    mutationFn: (commentId: number) =>
      unheartCommentFn({ data: { commentId } }),
    onSuccess: () => refetchHearts(),
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    createComment.mutate({ content: newComment, parentCommentId: null });
  };

  // Build the comment tree
  const commentTree = buildCommentTree(comments as CommentWithUser[]);

  function renderThread(node: CommentTreeNode) {
    return (
      <CommentThread
        key={node.id}
        node={node}
        onReply={setReplyingTo}
        onDelete={(id) => deleteComment.mutate(id)}
        isDeleting={
          deleteComment.isPending && deleteComment.variables === node.id
        }
        replyingTo={replyingTo}
        createComment={createComment}
        user={user}
        heartCount={heartData.counts[node.id] || 0}
        heartedByUser={!!heartData.userHearted[node.id]}
        onHeart={() => heartComment.mutate(node.id)}
        onUnheart={() => unheartComment.mutate(node.id)}
        canHeart={user && user.id !== node.user.id}
        heartLoading={heartComment.isPending || unheartComment.isPending}
        heartData={heartData}
        heartComment={heartComment}
        unheartComment={unheartComment}
        userId={user?.id}
      />
    );
  }

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
        ) : commentTree.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          commentTree.map(renderThread)
        )}
      </div>
    </div>
  );
}
