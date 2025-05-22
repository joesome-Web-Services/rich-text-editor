import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authenticatedMiddleware } from "~/lib/auth";
import { database } from "~/db";
import { comments, users, commentHearts } from "~/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
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
      parentCommentId: z.number().optional().nullable(),
    })
  )
  .handler(async ({ data, context }) => {
    const result = (await database
      .insert(comments)
      .values({
        chapterId: parseInt(data.chapterId),
        userId: context.userId,
        content: data.content,
        parentCommentId: data.parentCommentId ?? null,
      })
      .returning()) as any[];
    const comment = result[0];

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

export const heartCommentFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      commentId: z.number(),
    })
  )
  .handler(async ({ data, context }) => {
    // Insert, ignore if already exists
    await database
      .insert(commentHearts)
      .values({
        commentId: data.commentId,
        userId: context.userId,
      })
      .onConflictDoNothing();
    return { success: true };
  });

export const unheartCommentFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      commentId: z.number(),
    })
  )
  .handler(async ({ data, context }) => {
    await database
      .delete(commentHearts)
      .where(
        and(
          eq(commentHearts.commentId, data.commentId),
          eq(commentHearts.userId, context.userId)
        )
      );
    return { success: true };
  });

export const getCommentHeartsFn = createServerFn()
  .middleware([authenticatedMiddleware])
  .validator(
    z.object({
      commentIds: z.array(z.number()),
    })
  )
  .handler(async ({ data, context }) => {
    // Get heart counts and whether the current user has hearted each comment
    const hearts = await database.query.commentHearts.findMany({
      where: inArray(commentHearts.commentId, data.commentIds),
    });
    const counts: Record<number, number> = {};
    const userHearted: Record<number, boolean> = {};
    for (const id of data.commentIds) {
      counts[id] = 0;
      userHearted[id] = false;
    }
    for (const heart of hearts) {
      counts[heart.commentId] = (counts[heart.commentId] || 0) + 1;
      if (heart.userId === context.userId) {
        userHearted[heart.commentId] = true;
      }
    }
    return { counts, userHearted };
  });
