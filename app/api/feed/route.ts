import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../chatgpt-auth";
import { demoPosts } from "../../../lib/demo-data";
import { getFeed } from "../../../lib/server-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  const identity = user || { userId: "local_seedy", email: "seedy@sites.test", displayName: "Seedy" };
  try {
    return NextResponse.json({ posts: await getFeed(identity) });
  } catch (error) {
    console.error("Feed fallback", error);
    return NextResponse.json({ posts: demoPosts, fallback: true });
  }
}
