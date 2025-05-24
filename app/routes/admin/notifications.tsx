import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { database } from "~/db";
import {
  notifications,
  users,
  comments,
  books,
  chapters,
  type Notification,
  type User,
  type Comment,
  type Book,
  type Chapter,
} from "~/db/schema";
import { eq } from "drizzle-orm";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { adminMiddleware } from "~/lib/auth";
import { Switch } from "~/components/ui/switch";
import { useState } from "react";

type NotificationWithRelations = Notification & {
  createdByUser: User & { profile: { displayName: string | null } };
  comment: Comment;
  book: Book;
  chapter: Chapter;
};

const getNotificationsFn = createServerFn()
  .middleware([adminMiddleware])
  .handler(async () => {
    const notificationsList = await database.query.notifications.findMany({
      with: {
        createdByUser: {
          with: {
            profile: true,
          },
        },
        comment: true,
        book: true,
        chapter: true,
      },
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    });
    return { notifications: notificationsList as NotificationWithRelations[] };
  });

const markAsReadFn = createServerFn()
  .middleware([adminMiddleware])
  .validator(z.object({ notificationId: z.number() }))
  .handler(async ({ data }) => {
    await database
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, data.notificationId));
  });

export const Route = createFileRoute("/admin/notifications")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const [showRead, setShowRead] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotificationsFn(),
  });

  const markAsRead = useMutation({
    mutationFn: (notificationId: number) =>
      markAsReadFn({ data: { notificationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  const notifications = data?.notifications ?? [];
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <div className="container py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Show read notifications</span>
          <Switch checked={showRead} onCheckedChange={setShowRead} />
        </div>
      </div>

      <div className="space-y-6">
        {/* Unread Notifications */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Unread ({unreadNotifications.length})
          </h2>
          {unreadNotifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 rounded-lg border bg-blue-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {notification.createdByUser.profile.displayName ||
                      "Anonymous"}{" "}
                    commented on{" "}
                    <Link
                      to="/books/$bookId/chapters/$chapterId"
                      params={{
                        bookId: notification.book.id.toString(),
                        chapterId: notification.chapter.id.toString(),
                      }}
                      search={{ commentId: notification.comment.id }}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {notification.book.title} - {notification.chapter.title}
                    </Link>
                  </p>
                  <p className="text-gray-600 mt-1">
                    {notification.comment.content}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead.mutate(notification.id)}
                  disabled={markAsRead.isPending}
                >
                  Mark as read
                </Button>
              </div>
            </div>
          ))}
          {unreadNotifications.length === 0 && (
            <p className="text-center text-gray-500">No unread notifications</p>
          )}
        </div>

        {/* Read Notifications */}
        {showRead && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Read ({readNotifications.length})
            </h2>
            {readNotifications.map((notification) => (
              <div
                key={notification.id}
                className="p-4 rounded-lg border bg-white"
              >
                <div>
                  <p className="font-medium">
                    {notification.createdByUser.profile.displayName ||
                      "Anonymous"}{" "}
                    commented on{" "}
                    <Link
                      to="/books/$bookId/chapters/$chapterId"
                      params={{
                        bookId: notification.book.id.toString(),
                        chapterId: notification.chapter.id.toString(),
                      }}
                      search={{ commentId: notification.comment.id }}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {notification.book.title} - {notification.chapter.title}
                    </Link>
                  </p>
                  <p className="text-gray-600 mt-1">
                    {notification.comment.content}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
            {readNotifications.length === 0 && (
              <p className="text-center text-gray-500">No read notifications</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
