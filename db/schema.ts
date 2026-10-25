import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  avatarGradient: text("avatar_gradient").notNull().default("sunset"),
  goal: text("goal").notNull().default("General wellness"),
  createdAt: text("created_at").notNull().default("2026-01-01T00:00:00.000Z"),
}, (table) => [uniqueIndex("users_username_unique").on(table.username)]);

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  imageUrl: text("image_url").notNull(),
  mealName: text("meal_name").notNull(),
  caption: text("caption").notNull().default(""),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fat: integer("fat").notNull(),
  aiEstimated: integer("ai_estimated", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const likes = sqliteTable("likes", {
  userId: text("user_id").notNull().references(() => users.id),
  postId: text("post_id").notNull().references(() => posts.id),
}, (table) => [primaryKey({ columns: [table.userId, table.postId] })]);

export const bookmarks = sqliteTable("bookmarks", {
  userId: text("user_id").notNull().references(() => users.id),
  postId: text("post_id").notNull().references(() => posts.id),
}, (table) => [primaryKey({ columns: [table.userId, table.postId] })]);

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id),
  userId: text("user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});

export const follows = sqliteTable("follows", {
  followerId: text("follower_id").notNull().references(() => users.id),
  followingId: text("following_id").notNull().references(() => users.id),
}, (table) => [primaryKey({ columns: [table.followerId, table.followingId] })]);

export const mealLogs = sqliteTable("meal_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  postId: text("post_id").references(() => posts.id),
  mealName: text("meal_name").notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fat: integer("fat").notNull(),
  loggedDate: text("logged_date").notNull(),
  createdAt: text("created_at").notNull(),
});
