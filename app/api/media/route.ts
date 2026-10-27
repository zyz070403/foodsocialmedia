import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key || !key.startsWith("posts/")) return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  const object = await env.BUCKET.get(key);
  if (!object) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new NextResponse(object.body, { headers });
}
