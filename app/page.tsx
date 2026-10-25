import { getChatGPTUser } from "./chatgpt-auth";
import ValeApp from "./vale-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <ValeApp viewer={{
    id: user?.userId || "local_seedy",
    name: user?.displayName?.split("@")[0] || "Aadithya",
    email: user?.email || "seedy@sites.test",
  }} />;
}
