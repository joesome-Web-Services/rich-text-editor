import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "~/lib/auth";
import { database } from "~/db";
import { comments, users } from "~/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { isAdmin } from "~/lib/auth";

export const getChapterCommentsFn = createServerFn()
  .validator(
    z.object({
      chapterId: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const chapterComments = await database.query.comments.findMany({
      where: eq(comments.chapterId, parseInt(data.chapterId)),
      with: {
        user: {
          with: {
            profile: true,
          },
        },
      },
      orderBy: (comments, { desc }) => [desc(comments.createdAt)],
    });

    return chapterComments;
  });

export const createCommentFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      chapterId: z.string(),
      content: z.string().min(1, "Comment cannot be empty"),
    })
  )
  .handler(async ({ data, context }) => {
    const [comment] = await database
      .insert(comments)
      .values({
        chapterId: parseInt(data.chapterId),
        userId: context.userId,
        content: data.content,
      })
      .returning();

    const commentWithUser = await database.query.comments.findFirst({
      where: eq(comments.id, comment.id),
      with: {
        user: {
          with: {
            profile: true,
          },
        },
      },
    });

    return commentWithUser;
  });

export const deleteCommentFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      commentId: z.number(),
    })
  )
  .handler(async ({ data, context }) => {
    // First verify the user owns this comment or is an admin
    const [comment, user] = await Promise.all([
      database.query.comments.findFirst({
        where: eq(comments.id, data.commentId),
      }),
      database.query.users.findFirst({
        where: eq(users.id, context.userId),
      }),
    ]);

    if (!comment) {
      throw new Error("Comment not found");
    }

    if (!user) {
      throw new Error("User not found");
    }

    const isUserAdmin = isAdmin(user);
    if (!isUserAdmin && comment.userId !== context.userId) {
      throw new Error("Unauthorized to delete this comment");
    }

    await database.delete(comments).where(eq(comments.id, data.commentId));

    return { success: true };
  });
