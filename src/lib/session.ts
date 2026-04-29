import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export async function requireUser() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}


