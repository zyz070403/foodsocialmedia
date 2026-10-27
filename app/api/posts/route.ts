import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { database, ensureSeeded } from "../../../lib/server-data";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getChatGPTUser();
  const identity = user || { userId: "local_seedy", email: "seedy@sites.test", displayName: "Seedy" };
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 8_000_000) {
      return NextResponse.json({ error: "Choose an image under 8 MB" }, { status: 400 });
    }
    await ensureSeeded(identity);
    const id = crypto.randomUUID();
    const key = `posts/${identity.userId}/${id}-${file.name.replace(/[^a-z0-9.]/gi, "-").toLowerCase()}`;
    await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    const values = {
      mealName: String(form.get("mealName") || "My meal").slice(0, 80),
      caption: String(form.get("caption") || "").slice(0, 800),
      calories: safeNumber(form.get("calories"), 550), protein: safeNumber(form.get("protein"), 30),
      carbs: safeNumber(form.get("carbs"), 55), fat: safeNumber(form.get("fat"), 18),
    };
    const imageUrl = `/api/media?key=${encodeURIComponent(key)}`;
    await database().prepare("INSERT INTO posts (id, user_id, image_url, meal_name, caption, calories, protein, carbs, fat, ai_estimated, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)")
      .bind(id, identity.userId, imageUrl, values.mealName, values.caption, values.calories, values.protein, values.carbs, values.fat, new Date().toISOString()).run();
    return NextResponse.json({ ok: true, id, imageUrl });
  } catch (error) {
    console.error("Post creation failed", error);
    return NextResponse.json({ error: "Upload could not be saved" }, { status: 500 });
  }
}

function safeNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}
