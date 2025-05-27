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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

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
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      <Tabs defaultValue="unread" className="space-y-6">
        <TabsList>
          <TabsTrigger value="unread">
            Unread
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {unreadNotifications.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="read">
            Read
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
              {readNotifications.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
