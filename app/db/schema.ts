import {
  boolean,
  index,
  integer,
  pgTableCreator,
  serial,
  text,
  timestamp,
  uniqueIndex,
  AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const PREFIX = "app";

const tableCreator = pgTableCreator((name) => `${PREFIX}_${name}`);

export const users = tableCreator("user", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  isPremium: boolean("isPremium").notNull().default(false),
  isAdmin: boolean("isAdmin").notNull().default(false),
});

export const profiles = tableCreator("profile", {
  id: serial("id").primaryKey(),
  userId: serial("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  displayName: text("displayName"),
  imageId: text("imageId"),
  imageRefId: integer("imageRefId").references(() => images.id, {
    onDelete: "set null",
  }),
  bio: text("bio").notNull().default(""),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  comments: many(comments),
  notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
  image: one(images, {
    fields: [profiles.imageRefId],
    references: [images.id],
  }),
}));

export const accounts = tableCreator(
  "accounts",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    googleId: text("googleId").unique(),
  },
  (table) => [index("user_id_google_id_idx").on(table.userId, table.googleId)]
);

export const sessions = tableCreator(
  "session",
  {
    id: text("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export const books = tableCreator("book", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coverImageId: integer("coverImageId").references(() => images.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const chapters = tableCreator("chapter", {
  id: serial("id").primaryKey(),
  bookId: serial("bookId")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull(),
  isPublished: boolean("isPublished").notNull().default(false),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  readCount: integer("readCount").notNull().default(0),
});

export const images = tableCreator("image", {
  id: serial("id").primaryKey(),
  data: text("data").notNull(),
});

export type Image = typeof images.$inferSelect;

export const imagesRelations = relations(images, ({ many }) => ({
  profiles: many(profiles),
}));

export const configuration = tableCreator("configuration", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  heading: text("heading").notNull(),
  subHeading: text("subHeading").notNull(),
  email: text("email").notNull(),
  about: text("about").notNull(),
  company: text("company").notNull().default(""),
  favicon: text("favicon").notNull().default(""),
});

export const comments = tableCreator("comment", {
  id: serial("id").primaryKey(),
  chapterId: serial("chapterId")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  userId: serial("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentCommentId: integer("parentCommentId").references(
    (): AnyPgColumn => comments.id,
    {
      onDelete: "cascade",
    }
  ),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const booksRelations = relations(books, ({ one, many }) => ({
  coverImage: one(images, {
    fields: [books.coverImageId],
    references: [images.id],
  }),
  notifications: many(notifications),
}));

export type BookWithRelations = typeof books.$inferSelect & {
  coverImage: typeof images.$inferSelect | null;
};

export type ProfileWithRelations = typeof profiles.$inferSelect & {
  image: typeof images.$inferSelect | null;
};

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [comments.chapterId],
    references: [chapters.id],
  }),
  parent: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
  }),
  children: many(comments),
  notifications: many(notifications),
}));

export const commentHearts = tableCreator(
  "comment_heart",
  {
    id: serial("id").primaryKey(),
    userId: serial("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commentId: serial("commentId")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_comment_idx").on(table.userId, table.commentId),
    uniqueIndex("user_comment_unique_idx").on(table.userId, table.commentId),
  ]
);

export const commentHeartsRelations = relations(commentHearts, ({ one }) => ({
  user: one(users, {
    fields: [commentHearts.userId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [commentHearts.commentId],
    references: [comments.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Configuration = typeof configuration.$inferSelect;

export const notifications = tableCreator("notification", {
  id: serial("id").primaryKey(),
  createdByUserId: serial("createdByUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  commentId: serial("commentId")
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" }),
  bookId: serial("bookId")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  chapterId: serial("chapterId")
    .notNull()
    .references(() => chapters.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isRead: boolean("isRead").notNull().default(false),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  createdByUser: one(users, {
    fields: [notifications.createdByUserId],
    references: [users.id],
  }),
  comment: one(comments, {
    fields: [notifications.commentId],
    references: [comments.id],
  }),
  book: one(books, {
    fields: [notifications.bookId],
    references: [books.id],
  }),
  chapter: one(chapters, {
    fields: [notifications.chapterId],
    references: [chapters.id],
  }),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  book: one(books, {
    fields: [chapters.bookId],
    references: [books.id],
  }),
  notifications: many(notifications),
}));

export type Notification = typeof notifications.$inferSelect;
