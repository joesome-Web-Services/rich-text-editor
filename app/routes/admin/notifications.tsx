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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { adminMiddleware } from "~/lib/auth";

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
  loader: () => getNotificationsFn(),
});

function RouteComponent() {
  const { notifications } = Route.useLoaderData();
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: (notificationId: number) =>
      markAsReadFn({ data: { notificationId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border ${
              notification.isRead ? "bg-white" : "bg-blue-50"
            }`}
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
              {!notification.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead.mutate(notification.id)}
                  disabled={markAsRead.isPending}
                >
                  Mark as read
                </Button>
              )}
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-gray-500">No notifications yet</p>
        )}
      </div>
    </div>
  );
}
