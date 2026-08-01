import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/dal.server";
import { readSession } from "@/lib/auth/session.server";

export default async function Home() {
  const session = await readSession();
  if (session.status === "expired" || session.status === "invalid") {
    redirect(`/session-expired?reason=${session.status}`);
  }
  const viewer = await getViewer();
  redirect(viewer ? "/dashboard" : "/login");
}
