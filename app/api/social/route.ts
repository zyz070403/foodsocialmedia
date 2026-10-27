import { NextRequest, NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { database, ensureSeeded } from "../../../lib/server-data";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getChatGPTUser();
  const identity = user || { userId: "local_seedy", email: "seedy@sites.test", displayName: "Seedy" };
  const input = await request.json() as { action?: string; postId?: string; body?: string };
  if (!input.action || !input.postId) return NextResponse.json({ error: "Missing action" }, { status: 400 });

  try {
    await ensureSeeded(identity);
    const db = database();
    if (input.action === "like" || input.action === "bookmark") {
      const table = input.action === "like" ? "likes" : "bookmarks";
      const found = await db.prepare(`SELECT 1 AS found FROM ${table} WHERE user_id = ? AND post_id = ?`).bind(identity.userId, input.postId).first();
      if (found) await db.prepare(`DELETE FROM ${table} WHERE user_id = ? AND post_id = ?`).bind(identity.userId, input.postId).run();
      else await db.prepare(`INSERT INTO ${table} (user_id, post_id) VALUES (?, ?)`).bind(identity.userId, input.postId).run();
      return NextResponse.json({ active: !found });
    }
    if (input.action === "comment") {
      const body = String(input.body || "").trim().slice(0, 280);
      if (!body) return NextResponse.json({ error: "Comment is empty" }, { status: 400 });
      await db.prepare("INSERT INTO comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), input.postId, identity.userId, body, new Date().toISOString()).run();
      return NextResponse.json({ ok: true });
    }
    if (input.action === "log") {
      const post = await db.prepare("SELECT * FROM posts WHERE id = ?").bind(input.postId).first<Record<string, unknown>>();
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      const today = new Date().toISOString().slice(0, 10);
      await db.prepare("INSERT INTO meal_logs (id, user_id, post_id, meal_name, calories, protein, carbs, fat, logged_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(crypto.randomUUID(), identity.userId, input.postId, post.meal_name, post.calories, post.protein, post.carbs, post.fat, today, new Date().toISOString()).run();
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("Social action failed", error);
    return NextResponse.json({ error: "Could not save that action" }, { status: 500 });
  }
}
