import { env } from "cloudflare:workers";
import { demoPosts, demoUsers } from "./demo-data";
import type { CommentItem, ValePost } from "./types";

type Identity = { userId: string; email?: string | null; displayName?: string | null };

export function database() {
  return env.DB;
}

export async function ensureSeeded(identity: Identity) {
  const db = database();
  const currentName = identity.displayName?.split("@")[0] || "Vale Member";
  const currentUsername = (identity.email?.split("@")[0] || "vale.member").replace(/[^a-z0-9._]/gi, "").toLowerCase();
  const statements = [
    db.prepare("INSERT OR IGNORE INTO users (id, username, display_name, email, avatar_gradient, goal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(identity.userId, currentUsername, currentName, identity.email || null, "lime", "General wellness", new Date().toISOString()),
    ...demoUsers.map((user) => db.prepare("INSERT OR IGNORE INTO users (id, username, display_name, email, avatar_gradient, goal, created_at) VALUES (?, ?, ?, NULL, ?, ?, ?)")
      .bind(user.id, user.username, user.displayName, user.avatarGradient, user.goal, "2026-10-01T08:00:00.000Z")),
    ...demoPosts.map((post, index) => db.prepare("INSERT OR IGNORE INTO posts (id, user_id, image_url, meal_name, caption, calories, protein, carbs, fat, ai_estimated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(post.id, post.user.id, post.imageUrl, post.mealName, post.caption, post.calories, post.protein, post.carbs, post.fat, 1, `2026-10-25T${14 - index * 2}:00:00.000Z`)),
    db.prepare("INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)").bind(identity.userId, "post-pasta"),
    db.prepare("INSERT OR IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)").bind(identity.userId, "post-pasta"),
    db.prepare("INSERT OR IGNORE INTO comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)").bind("seed-c1", "post-bowl", "ari", "That char on the sweet potato 👌", "2026-10-25T14:03:00.000Z"),
    db.prepare("INSERT OR IGNORE INTO comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)").bind("seed-c2", "post-bowl", "nia", "Saving this for meal prep Sunday.", "2026-10-25T14:04:00.000Z"),
    db.prepare("INSERT OR IGNORE INTO comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)").bind("seed-c3", "post-pasta", "maya", "Recipe drop please!", "2026-10-25T12:08:00.000Z"),
  ];
  await db.batch(statements);
}

export async function getFeed(identity: Identity): Promise<ValePost[]> {
  await ensureSeeded(identity);
  const db = database();
  const rows = await db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar_gradient, u.goal,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) + CASE p.id WHEN 'post-bowl' THEN 284 WHEN 'post-pasta' THEN 430 WHEN 'post-oats' THEN 198 ELSE 0 END AS like_count,
      EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked,
      EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = ?) AS bookmarked
    FROM posts p JOIN users u ON u.id = p.user_id
    ORDER BY p.created_at DESC
  `).bind(identity.userId, identity.userId).all<Record<string, unknown>>();

  const posts: ValePost[] = [];
  for (const row of rows.results) {
    const commentRows = await db.prepare(`
      SELECT c.id, c.body, u.username FROM comments c JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ? ORDER BY c.created_at ASC LIMIT 3
    `).bind(row.id).all<{ id: string; body: string; username: string }>();
    const displayName = String(row.display_name);
    const comments: CommentItem[] = commentRows.results;
    posts.push({
      id: String(row.id),
      user: {
        id: String(row.user_id), username: String(row.username), displayName,
        initials: displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
        avatarGradient: String(row.avatar_gradient), goal: String(row.goal),
      },
      imageUrl: String(row.image_url), mealName: String(row.meal_name), caption: String(row.caption),
      calories: Number(row.calories), protein: Number(row.protein), carbs: Number(row.carbs), fat: Number(row.fat),
      aiEstimated: Boolean(row.ai_estimated), createdAt: relativeTime(String(row.created_at)),
      likes: Number(row.like_count), liked: Boolean(row.liked), bookmarked: Boolean(row.bookmarked), comments,
    });
  }
  return posts;
}

function relativeTime(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  return `${Math.round(hours / 24)} d`;
}
